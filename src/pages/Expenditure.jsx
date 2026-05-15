import { useState, useMemo } from 'react'
import { Plus, Receipt } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import TransactionForm from '../components/TransactionForm'
import DateInput from '../components/DateInput'
import {
  formatCurrency, formatDate, TRANSACTION_TYPES, EXPENSE_CATEGORIES, getCategoryLabel
} from '../utils/helpers'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4']

export default function Expenditure() {
  const { transactions, settings, customCategories = [] } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const expenses = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== TRANSACTION_TYPES.EXPENSE) return false
      if (filterFrom && t.date < filterFrom) return false
      if (filterTo && t.date > filterTo) return false
      if (filterCat && t.category !== filterCat) return false
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, filterFrom, filterTo, filterCat])

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)

  const categoryBreakdown = useMemo(() => {
    const map = {}
    expenses.forEach(t => {
      const key = t.category || 'MISCELLANEOUS'
      map[key] = (map[key] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([key, value]) => ({ name: getCategoryLabel(key, customCategories), value, key }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Expenditure</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={15} />
          Add Expense
        </button>
      </div>

      {/* Total card */}
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white">
        <p className="text-red-100 text-sm font-medium">Total Expenditure (Filtered)</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(totalExpense, settings.currency)}</p>
        <p className="text-red-200 text-xs mt-2">{expenses.length} transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <DateInput
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <DateInput
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Expense Breakdown</h2>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value, settings.currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data</div>
          )}
        </div>

        {/* Category breakdown list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Category Summary</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm">No expenses in this period.</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, i) => {
                const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0
                return (
                  <div key={cat.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs">{pct.toFixed(1)}%</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(cat.value, settings.currency)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expense table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">All Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-gray-900">
                      <p>{t.description}</p>
                      {t.notes && <p className="text-xs text-gray-400">{t.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                        {getCategoryLabel(t.category, customCategories)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.paymentMode}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      {formatCurrency(t.amount, settings.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-red-700">{formatCurrency(totalExpense, settings.currency)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
