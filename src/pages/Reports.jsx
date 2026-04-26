import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { useApp } from '../context/AppContext'
import {
  formatCurrency, formatMonthYear, getLast12Months, isInflow,
  TRANSACTION_TYPES, EXPENSE_CATEGORIES, getCategoryLabel, OWNER_COLORS
} from '../utils/helpers'
import { format } from 'date-fns'

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

export default function Reports() {
  const { transactions, owners, settings, getTotals } = useApp()

  const last12 = getLast12Months()

  const monthlyData = useMemo(() => {
    return last12.map(({ key, label }) => {
      const txns = transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === key)
      const income = txns.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0)
      const ownerIn = txns.filter(t => t.type === TRANSACTION_TYPES.OWNER_DEPOSIT).reduce((s, t) => s + t.amount, 0)
      const expense = txns.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0)
      const ownerOut = txns.filter(t => t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL).reduce((s, t) => s + t.amount, 0)
      return { month: label, Income: income, OwnerDeposit: ownerIn, Expense: expense, OwnerWithdrawal: ownerOut, Net: income - expense }
    })
  }, [transactions])

  const allTotals = getTotals(transactions)

  const expenseCategoryData = useMemo(() => {
    const map = {}
    transactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).forEach(t => {
      const key = t.category || 'MISCELLANEOUS'
      map[key] = (map[key] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([key, value]) => ({ name: getCategoryLabel(key), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [transactions])

  const ownerData = useMemo(() => {
    return owners.map((owner, i) => {
      const ownerTxns = transactions.filter(t => t.ownerId === owner.id)
      const deposits = ownerTxns.filter(t => t.type === TRANSACTION_TYPES.OWNER_DEPOSIT).reduce((s, t) => s + t.amount, 0)
      const withdrawals = ownerTxns.filter(t => t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL).reduce((s, t) => s + t.amount, 0)
      return {
        name: owner.name,
        Deposits: deposits,
        Withdrawals: withdrawals,
        Net: deposits - withdrawals,
        color: owner.color || OWNER_COLORS[i],
      }
    })
  }, [transactions, owners])

  const incomeByCategory = useMemo(() => {
    const map = {}
    transactions.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).forEach(t => {
      const key = t.category || 'OTHER_INCOME'
      map[key] = (map[key] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([key, value]) => ({ name: getCategoryLabel(key), value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const formatYAxis = (val) => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
    return val
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Income (All Time)"
          value={formatCurrency(allTotals.inflow, settings.currency)}
          color="text-green-600"
        />
        <SummaryCard
          label="Total Outflow (All Time)"
          value={formatCurrency(allTotals.outflow, settings.currency)}
          color="text-red-500"
        />
        <SummaryCard
          label="Net Surplus / Deficit"
          value={formatCurrency(allTotals.net, settings.currency)}
          color={allTotals.net >= 0 ? 'text-blue-600' : 'text-orange-600'}
        />
        <SummaryCard
          label="Total Transactions"
          value={transactions.length}
          color="text-slate-700"
        />
      </div>

      {/* Monthly Income vs Expense bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Income vs Expense (Last 12 Months)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => formatCurrency(val, settings.currency)} />
            <Legend />
            <Bar dataKey="Income" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Expense" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net trend line chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Net Profit / Loss Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => formatCurrency(val, settings.currency)} />
            <Line
              type="monotone"
              dataKey="Net"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3B82F6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense by category pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Expense by Category</h2>
          {expenseCategoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseCategoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                    {expenseCategoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val, settings.currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {expenseCategoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cat.value, settings.currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No expense data</p>
          )}
        </div>

        {/* Income by category */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Income Sources</h2>
          {incomeByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={incomeByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                    {incomeByCategory.map((_, i) => (
                      <Cell key={i} fill={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'][i % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val, settings.currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {incomeByCategory.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'][i % 6] }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cat.value, settings.currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No income data</p>
          )}
        </div>
      </div>

      {/* Owner comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Owner Deposits vs Withdrawals</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ownerData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => formatCurrency(val, settings.currency)} />
            <Legend />
            <Bar dataKey="Deposits" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Withdrawals" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
