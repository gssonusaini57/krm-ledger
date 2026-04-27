import { useMemo, useState } from 'react'
import { X, ArrowDownRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/helpers'
import { format } from 'date-fns'

export default function EmployeeDetail({ employee, onClose }) {
  const { transactions, settings } = useApp()

  const currentMonth = format(new Date(), 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const color = employee.type === 'FIXED' ? '#8B5CF6' : '#F97316'

  const empTxns = useMemo(() =>
    transactions
      .filter(t => t.employeeId === employee.id)
      .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt)),
    [transactions, employee.id]
  )

  const months = useMemo(() => {
    const seen = new Set([currentMonth])
    empTxns.forEach(t => seen.add(t.date.slice(0, 7)))
    return Array.from(seen).sort().reverse()
      .map(key => ({ key, label: format(new Date(key + '-01'), 'MMM yy') }))
  }, [empTxns, currentMonth])

  const monthTxns = useMemo(() =>
    empTxns.filter(t => t.date.startsWith(selectedMonth)),
    [empTxns, selectedMonth]
  )

  const totalPaid  = monthTxns.reduce((s, t) => s + t.amount, 0)
  const salary     = employee.type === 'FIXED' ? (employee.salary || 0) : null
  const remaining  = salary !== null ? salary - totalPaid : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-5" style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{employee.name}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {employee.type === 'FIXED'
                    ? `Fixed ₹${Number(employee.salary || 0).toLocaleString('en-IN')}/month`
                    : 'Variable Labour'}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-gray-400 shadow-sm">
              <X size={16} />
            </button>
          </div>

          {/* Month tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {months.map(m => (
              <button key={m.key} onClick={() => setSelectedMonth(m.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={selectedMonth === m.key
                  ? { background: color, color: '#fff' }
                  : { background: 'rgba(0,0,0,0.06)', color: '#64748B' }
                }>
                {m.label}
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className={`grid gap-2 mt-3 ${salary !== null ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {salary !== null && (
              <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">Salary</p>
                <p className="font-bold text-gray-800 text-base">{formatCurrency(salary, settings.currency)}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-medium mb-1">Paid</p>
              <p className="font-bold text-rose-500 text-base">{formatCurrency(totalPaid, settings.currency)}</p>
            </div>
            {remaining !== null && (
              <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">
                  {remaining >= 0 ? 'Remaining' : 'Excess'}
                </p>
                <p className="font-bold text-base" style={{ color: remaining >= 0 ? '#059669' : '#E11D48' }}>
                  {formatCurrency(Math.abs(remaining), settings.currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-2">
          {monthTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-400 text-sm">No entries this month</p>
              <p className="text-gray-300 text-xs mt-1">Add a salary/labour entry and select this employee</p>
            </div>
          ) : (
            monthTxns.map(t => (
              <div key={t.id} className="bg-gray-50 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FFF1F2' }}>
                  <ArrowDownRight size={18} color="#F43F5E" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
                </div>
                <p className="font-bold text-sm text-rose-500 flex-shrink-0">
                  -{formatCurrency(t.amount, settings.currency)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
