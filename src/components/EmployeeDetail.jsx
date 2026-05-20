import { useMemo, useState } from 'react'
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, TRANSACTION_TYPES, PAYMENT_MODES, todayISO } from '../utils/helpers'
import { format } from 'date-fns'

export default function EmployeeDetail({ employee, onClose }) {
  const { transactions, settings, settleWageAccrual } = useApp()

  const currentMonth = format(new Date(), 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [payingEntry, setPayingEntry] = useState(null)
  const [payDate, setPayDate] = useState(todayISO())
  const [payMode, setPayMode] = useState('CASH')
  const [payLoading, setPayLoading] = useState(false)

  const color = employee.type === 'FIXED' ? '#8B5CF6' : '#F97316'

  const empTxns = useMemo(() =>
    transactions
      .filter(t => t.employeeId === employee.id)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || '')),
    [transactions, employee.id]
  )

  const months = useMemo(() => {
    const seen = new Set([currentMonth])
    empTxns.forEach(t => seen.add(t.date.slice(0, 7)))
    return Array.from(seen).sort().reverse()
      .map(key => ({ key, label: format(new Date(key + '-01'), 'MMM yy') }))
  }, [empTxns, currentMonth])

  const ledger = useMemo(() => {
    const monthTxns = empTxns.filter(t => t.date.startsWith(selectedMonth))
    let running = 0
    return monthTxns.map(t => {
      const isAccrual = t.type === TRANSACTION_TYPES.WAGE_ACCRUAL
      const isPayment = t.type === TRANSACTION_TYPES.EXPENSE
      const credit = isAccrual ? t.amount : 0
      const debit  = isPayment ? t.amount : 0
      if (isAccrual) running += t.amount
      if (isPayment) running -= t.amount
      return { ...t, credit, debit, running }
    })
  }, [empTxns, selectedMonth])

  const totalEarned  = ledger.reduce((s, r) => s + r.credit, 0)
  const totalPaid    = ledger.reduce((s, r) => s + r.debit, 0)
  const outstanding  = totalEarned - totalPaid
  const salary       = employee.type === 'FIXED' ? (employee.salary || 0) : null

  const handleSettlePay = async (entry) => {
    setPayLoading(true)
    try {
      await settleWageAccrual(entry, payDate, payMode)
      setPayingEntry(null)
      setPayDate(todayISO())
      setPayMode('CASH')
    } finally {
      setPayLoading(false)
    }
  }

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
              <button key={m.key} onClick={() => { setSelectedMonth(m.key); setPayingEntry(null) }}
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
          <div className={`grid gap-2 mt-3 ${salary !== null ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {salary !== null && (
              <div className="bg-white rounded-2xl p-2.5 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">Salary</p>
                <p className="font-bold text-gray-800 text-sm">{formatCurrency(salary, settings.currency)}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl p-2.5 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-medium mb-1">Earned</p>
              <p className="font-bold text-emerald-600 text-sm">{formatCurrency(totalEarned, settings.currency)}</p>
            </div>
            <div className="bg-white rounded-2xl p-2.5 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-medium mb-1">Paid</p>
              <p className="font-bold text-rose-500 text-sm">{formatCurrency(totalPaid, settings.currency)}</p>
            </div>
            <div className="bg-white rounded-2xl p-2.5 shadow-sm text-center">
              <p className="text-xs text-gray-400 font-medium mb-1">Due</p>
              <p className="font-bold text-sm" style={{ color: outstanding > 0 ? '#D97706' : '#059669' }}>
                {formatCurrency(outstanding, settings.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Bank-statement header */}
        <div className="grid grid-cols-4 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Date</p>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide text-right">Earnings+</p>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wide text-right">Paid−</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Balance</p>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto pb-8">
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-400 text-sm">No entries this month</p>
              <p className="text-gray-300 text-xs mt-1">Record wages from the Staff tab</p>
            </div>
          ) : (
            ledger.map(row => {
              const isAccrual = row.type === TRANSACTION_TYPES.WAGE_ACCRUAL
              const isPaying = payingEntry?.id === row.id
              const isSettled = isAccrual && !!row.settledAt

              return (
                <div key={row.id}>
                  <div className="grid grid-cols-4 items-center px-4 py-3 border-b border-gray-50 gap-1">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{formatDate(row.date)}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{row.description}</p>
                      {isAccrual && (
                        <span className="inline-block mt-1 text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={isSettled
                            ? { background: '#D1FAE5', color: '#065F46' }
                            : { background: '#FEF3C7', color: '#92400E' }
                          }>
                          {isSettled ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      )}
                    </div>

                    <p className="text-right text-sm font-bold" style={{ color: row.credit ? '#059669' : '#CBD5E1' }}>
                      {row.credit ? `+${formatCurrency(row.credit, settings.currency)}` : '—'}
                    </p>
                    <p className="text-right text-sm font-bold" style={{ color: row.debit ? '#F43F5E' : '#CBD5E1' }}>
                      {row.debit ? `-${formatCurrency(row.debit, settings.currency)}` : '—'}
                    </p>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: row.running >= 0 ? '#D97706' : '#059669' }}>
                        {formatCurrency(Math.abs(row.running), settings.currency)}
                      </p>
                      {isAccrual && !isSettled && (
                        <button
                          onClick={() => { setPayingEntry(isPaying ? null : row); setPayDate(todayISO()); setPayMode('CASH') }}
                          className="mt-1 text-xs font-bold px-2 py-0.5 rounded-lg text-white"
                          style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Pay Now form */}
                  {isPaying && (
                    <div className="mx-4 mb-3 p-3 rounded-2xl border-2 space-y-2"
                      style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                      <p className="text-xs font-bold text-blue-700">
                        Pay {formatCurrency(row.amount, settings.currency)} to {employee.name}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1">Date</label>
                          <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                            className="w-full text-xs rounded-xl border border-blue-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1">Mode</label>
                          <select value={payMode} onChange={e => setPayMode(e.target.value)}
                            className="w-full text-xs rounded-xl border border-blue-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300">
                            {PAYMENT_MODES.map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPayingEntry(null)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 bg-white">
                          Cancel
                        </button>
                        <button onClick={() => handleSettlePay(row)} disabled={payLoading}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ background: payLoading ? '#93C5FD' : 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                          {payLoading ? 'Processing...' : 'Mark as Paid'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
