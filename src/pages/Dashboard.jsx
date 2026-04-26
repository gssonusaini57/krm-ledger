import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TransactionForm from '../components/TransactionForm'
import {
  formatCurrency, formatDate, formatDateShort, isInflow,
  TRANSACTION_TYPES, getThisMonthRange, getTodayRange, OWNER_COLORS
} from '../utils/helpers'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color === 'text-green-600' ? 'bg-green-50' : color === 'text-red-500' ? 'bg-red-50' : 'bg-blue-50'}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { transactions, owners, settings, getCompanyBalance, getOwnerBalance, getTotals } = useApp()
  const [showForm, setShowForm] = useState(false)

  const companyBalance = getCompanyBalance()
  const { from: monthFrom, to: monthTo } = getThisMonthRange()
  const { from: todayFrom, to: todayTo } = getTodayRange()

  const txnsThisMonth = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= monthFrom && d <= monthTo
  })
  const txnsToday = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= todayFrom && d <= todayTo
  })

  const monthTotals = getTotals(txnsThisMonth)
  const todayTotals = getTotals(txnsToday)

  const recentTxns = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{settings.companyName}</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      {/* Main balance */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <p className="text-slate-400 text-sm font-medium">Company Cash Balance</p>
        <p className={`text-4xl font-bold mt-2 ${companyBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
          {formatCurrency(companyBalance, settings.currency)}
        </p>
        <div className="flex gap-6 mt-4 pt-4 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400">This Month In</p>
            <p className="text-green-400 font-semibold">{formatCurrency(monthTotals.inflow, settings.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">This Month Out</p>
            <p className="text-red-400 font-semibold">{formatCurrency(monthTotals.outflow, settings.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Net This Month</p>
            <p className={`font-semibold ${monthTotals.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthTotals.net >= 0 ? '+' : ''}{formatCurrency(monthTotals.net, settings.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Income"
          value={formatCurrency(todayTotals.inflow, settings.currency)}
          icon={TrendingUp}
          color="text-green-600"
          sub={`${txnsToday.filter(t => isInflow(t.type)).length} entries`}
        />
        <StatCard
          label="Today's Outflow"
          value={formatCurrency(todayTotals.outflow, settings.currency)}
          icon={TrendingDown}
          color="text-red-500"
          sub={`${txnsToday.filter(t => !isInflow(t.type)).length} entries`}
        />
        <StatCard
          label="Month's Income"
          value={formatCurrency(monthTotals.inflow, settings.currency)}
          icon={ArrowUpRight}
          color="text-green-600"
        />
        <StatCard
          label="Month's Expenses"
          value={formatCurrency(monthTotals.outflow, settings.currency)}
          icon={ArrowDownRight}
          color="text-red-500"
        />
      </div>

      {/* Owner balance cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users size={18} />
          Owner Accounts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {owners.map((owner, i) => {
            const bal = getOwnerBalance(owner.id)
            const ownerTxns = transactions.filter(t => t.ownerId === owner.id)
            const deposits = ownerTxns.filter(t => t.type === TRANSACTION_TYPES.OWNER_DEPOSIT).reduce((s, t) => s + t.amount, 0)
            const withdrawals = ownerTxns.filter(t => t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL).reduce((s, t) => s + t.amount, 0)
            return (
              <div key={owner.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: owner.color || OWNER_COLORS[i] }}
                  >
                    {owner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{owner.name}</p>
                    <p className="text-xs text-gray-400">{owner.sharePercent}% share</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Deposited</span>
                    <span className="text-green-600 font-medium">{formatCurrency(deposits, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Withdrawn</span>
                    <span className="text-red-500 font-medium">{formatCurrency(withdrawals, settings.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-100">
                    <span className="text-gray-700">Net Balance</span>
                    <span className={bal >= 0 ? 'text-green-600' : 'text-red-500'}>
                      {bal >= 0 ? '+' : ''}{formatCurrency(bal, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Transactions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {recentTxns.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Wallet size={36} className="mx-auto mb-2 opacity-30" />
              <p>No transactions yet. Click "Add Entry" to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTxns.map(t => {
                const inflow = isInflow(t.type)
                const owner = t.ownerId ? owners.find(o => o.id === t.ownerId) : null
                return (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${inflow ? 'bg-green-100' : 'bg-red-100'}`}>
                        {inflow
                          ? <ArrowUpRight size={16} className="text-green-600" />
                          : <ArrowDownRight size={16} className="text-red-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatDateShort(t.date)}</span>
                          {owner && (
                            <>
                              <span>·</span>
                              <span style={{ color: owner.color }}>{owner.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold flex-shrink-0 ml-4 ${inflow ? 'text-green-600' : 'text-red-500'}`}>
                      {inflow ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
