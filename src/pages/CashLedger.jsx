import { useState, useMemo } from 'react'
import { Plus, Search, Printer, Pencil, Trash2, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TransactionForm from '../components/TransactionForm'
import {
  formatCurrency, formatDate, isInflow, computeRunningBalance,
  TRANSACTION_TYPES, TYPE_LABELS, getCategoryLabel, getPaymentModeLabel
} from '../utils/helpers'

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: TRANSACTION_TYPES.CASH_IN, label: 'Cash In' },
  { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
  { value: TRANSACTION_TYPES.OWNER_DEPOSIT, label: 'Owner Deposit' },
  { value: TRANSACTION_TYPES.OWNER_WITHDRAWAL, label: 'Owner Withdrawal' },
]

export default function CashLedger() {
  const { transactions, owners, settings, deleteTransaction, getTotals } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType && t.type !== filterType) return false
      if (filterFrom && t.date < filterFrom) return false
      if (filterTo && t.date > filterTo) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.description?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          getCategoryLabel(t.category)?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [transactions, filterType, filterFrom, filterTo, search])

  const withBalance = useMemo(() => computeRunningBalance(filtered), [filtered])
  const totals = getTotals(filtered)

  const handleEdit = (t) => {
    setEditData(t)
    setShowForm(true)
  }
  const handleDelete = (id) => {
    deleteTransaction(id)
    setConfirmDelete(null)
  }
  const handleCloseForm = () => {
    setShowForm(false)
    setEditData(null)
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Cash Book</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Printer size={15} />
            Print
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={15} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="From date"
          />
          <input
            type="date"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="To date"
          />
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xs text-green-700 font-medium">Total In</p>
          <p className="text-lg font-bold text-green-700">{formatCurrency(totals.inflow, settings.currency)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xs text-red-700 font-medium">Total Out</p>
          <p className="text-lg font-bold text-red-700">{formatCurrency(totals.outflow, settings.currency)}</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${totals.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-xs font-medium ${totals.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net</p>
          <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net, settings.currency)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cash In</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cash Out</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</th>
                <th className="px-4 py-3 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withBalance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No transactions found</td>
                </tr>
              ) : (
                withBalance.map(t => {
                  const inflow = isInflow(t.type)
                  const owner = t.ownerId ? owners.find(o => o.id === t.ownerId) : null
                  const isExpanded = expandedId === t.id
                  return (
                    <>
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      >
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900 font-medium truncate max-w-[220px]">{t.description}</p>
                          {t.category && (
                            <p className="text-xs text-gray-400">{getCategoryLabel(t.category)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            inflow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {TYPE_LABELS[t.type]}
                          </span>
                          {owner && (
                            <p className="text-xs mt-0.5" style={{ color: owner.color }}>{owner.name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          {inflow ? formatCurrency(t.amount, settings.currency) : ''}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-500">
                          {!inflow ? formatCurrency(t.amount, settings.currency) : ''}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${t.runningBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                          {formatCurrency(t.runningBalance, settings.currency)}
                        </td>
                        <td className="px-4 py-3 no-print">
                          <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit(t)}
                              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(t.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${t.id}-expand`} className="bg-blue-50/50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                              <span><strong>Payment:</strong> {getPaymentModeLabel(t.paymentMode)}</span>
                              {t.reference && <span><strong>Ref:</strong> {t.reference}</span>}
                              {t.notes && <span><strong>Notes:</strong> {t.notes}</span>}
                              {owner && <span><strong>Owner:</strong> {owner.name}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && <TransactionForm onClose={handleCloseForm} editData={editData} />}
    </div>
  )
}
