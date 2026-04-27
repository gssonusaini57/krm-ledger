import { useState, useMemo, useCallback } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import TransactionForm from './components/TransactionForm'
import InlineAddForm from './components/InlineAddForm'
import SettingsModal from './components/SettingsModal'
import {
  formatCurrency, formatDate, isInflow,
  TRANSACTION_TYPES, OWNER_COLORS, getCategoryLabel
} from './utils/helpers'
import {
  Settings, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, Search, X as XIcon, Wheat
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

// ── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ALL',         label: 'All'         },
  { key: 'IN',          label: 'Cash In'     },
  { key: 'OUT',         label: 'Cash Out'    },
  { key: 'OWNER',       label: 'Owner'       },
  { key: 'SALARY',      label: 'Salary'      },
  { key: 'LABOUR',      label: 'Labour'      },
  { key: 'BANK',        label: 'Bank'        },
  { key: 'DEPOT_EXP',   label: 'Depot Exp'   },
  { key: 'EXPENDITURE', label: 'Expenditure' },
  { key: 'ASHOK_DEPOT', label: 'Ashok Depot' },
  { key: 'TRUCK',       label: 'Truck'       },
]

const CATEGORY_TABS = new Set(['SALARY','LABOUR','BANK','DEPOT_EXP','EXPENDITURE','ASHOK_DEPOT','TRUCK'])

// ── Category colours ─────────────────────────────────────────────────────────
const CAT_COLOR = {
  SALARY:'#8B5CF6', LABOUR:'#F97316', BANK:'#06B6D4',
  DEPOT_EXP:'#EC4899', EXPENDITURE:'#EF4444', ASHOK_DEPOT:'#14B8A6',
  TRUCK:'#F59E0B', PADDY_PURCHASE:'#84CC16', ELECTRICITY:'#3B82F6',
  TRANSPORT:'#F59E0B', MACHINE_MAINTENANCE:'#64748B', GUNNY_BAGS:'#A78BFA',
  DIESEL_FUEL:'#F97316', MISCELLANEOUS:'#94A3B8',
}

// ── Date label ───────────────────────────────────────────────────────────────
function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMMM yyyy')
}

// ── Main app ─────────────────────────────────────────────────────────────────
function MainApp() {
  const { transactions, owners, settings, getCompanyBalance, getOwnerBalance, deleteTransaction } = useApp()

  const [tab, setTab]               = useState('ALL')
  const [search, setSearch]         = useState('')
  const [monthFilter, setMonthFilter] = useState(null) // null = All
  const [showSettings, setShowSettings] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  // Build list of months that have at least one transaction
  const availableMonths = useMemo(() => {
    const seen = new Set()
    transactions.forEach(t => seen.add(t.date.slice(0, 7)))
    return Array.from(seen)
      .sort()
      .reverse()
      .map(key => ({ key, label: format(new Date(key + '-01'), 'MMM yy') }))
  }, [transactions])

  // ── Balance & today/month stats ───────────────────────────────────────────
  const balance = getCompanyBalance()

  const { todayIn, todayOut } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayTxns = transactions.filter(t => t.date === today)
    return {
      todayIn:  todayTxns.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0),
      todayOut: todayTxns.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions])

  const { monthIn, monthOut } = useMemo(() => {
    if (!monthFilter) return { monthIn: 0, monthOut: 0 }
    const monthTxns = transactions.filter(t => t.date.startsWith(monthFilter))
    return {
      monthIn:  monthTxns.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0),
      monthOut: monthTxns.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions, monthFilter])

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (monthFilter && !t.date.startsWith(monthFilter)) return false
        if (tab === 'IN')    { if (t.type !== TRANSACTION_TYPES.CASH_IN) return false }
        else if (tab === 'OUT')   { if (t.type !== TRANSACTION_TYPES.EXPENSE) return false }
        else if (tab === 'OWNER') { if (t.type !== TRANSACTION_TYPES.OWNER_DEPOSIT && t.type !== TRANSACTION_TYPES.OWNER_WITHDRAWAL) return false }
        else if (CATEGORY_TABS.has(tab)) {
          if (t.type !== TRANSACTION_TYPES.EXPENSE || t.category !== tab) return false
        }
        if (search.trim()) {
          const q = search.toLowerCase()
          return t.description?.toLowerCase().includes(q) || getCategoryLabel(t.category)?.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))
  }, [transactions, tab, search, monthFilter])

  // ── Group by date ─────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(t => {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const switchTab = (key) => { setTab(key); setSearch('') }
  const openEdit  = (t) => { setEditData(t); setShowEditForm(true) }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F5F9' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E3A5F 100%)' }}>
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />

        <div className="relative px-6 pt-6 pb-6">
          {/* Top row */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
                <Wheat size={16} color="#F59E0B" />
              </div>
              <p className="text-white font-bold text-base">{settings.companyName || 'KRM Rice Mill'}</p>
            </div>
            <button onClick={() => setShowSettings(true)}
              className="absolute right-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Settings size={16} color="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {/* Balance */}
          <div className="mb-5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Cash Balance</p>
            <p className={`font-bold leading-none ${balance >= 0 ? 'text-white' : 'text-red-400'}`}
               style={{ fontSize: 42 }}>
              {formatCurrency(balance, settings.currency)}
            </p>
          </div>

          {/* Today / Month stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ArrowUpRight size={11} color="#10B981" />
                </div>
                <p className="text-slate-400 text-xs">
                  {monthFilter ? `${format(new Date(monthFilter + '-01'), 'MMM')} Kamai` : 'Aaj Ki Kamai'}
                </p>
              </div>
              <p className="text-emerald-400 font-bold text-xl">
                {formatCurrency(monthFilter ? monthIn : todayIn, settings.currency)}
              </p>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ArrowDownRight size={11} color="#F43F5E" />
                </div>
                <p className="text-slate-400 text-xs">
                  {monthFilter ? `${format(new Date(monthFilter + '-01'), 'MMM')} Kharcha` : 'Aaj Ka Kharcha'}
                </p>
              </div>
              <p className="text-rose-400 font-bold text-xl">
                {formatCurrency(monthFilter ? monthOut : todayOut, settings.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-thin">
          {TABS.map(t => (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150
                ${tab === t.key
                  ? 'text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              style={tab === t.key
                ? { background: 'linear-gradient(135deg, #1E293B, #334155)' }
                : { background: '#F1F5F9' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INLINE ADD FORM ─────────────────────────────────────────────── */}
      <InlineAddForm
        key={tab}
        defaultMode={CATEGORY_TABS.has(tab) ? 'OUT' : tab === 'IN' ? 'IN' : tab === 'OWNER' ? 'OWNER' : 'IN'}
        defaultCategory={CATEGORY_TABS.has(tab) ? tab : ''}
      />

      {/* ── SEARCH ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-1 pb-2">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white rounded-2xl text-sm text-gray-700 placeholder-gray-400 border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── MONTH FILTER ─────────────────────────────────────────────────── */}
      {availableMonths.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setMonthFilter(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
              ${monthFilter === null ? 'text-white shadow-sm' : 'text-gray-500'}`}
            style={monthFilter === null
              ? { background: 'linear-gradient(135deg, #F59E0B, #F97316)' }
              : { background: '#F1F5F9' }
            }
          >
            All
          </button>
          {availableMonths.map(m => (
            <button
              key={m.key}
              onClick={() => setMonthFilter(monthFilter === m.key ? null : m.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${monthFilter === m.key ? 'text-white shadow-sm' : 'text-gray-500'}`}
              style={monthFilter === m.key
                ? { background: 'linear-gradient(135deg, #F59E0B, #F97316)' }
                : { background: '#F1F5F9' }
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* ── OWNER CARDS (owner tab only) ─────────────────────────────────── */}
      {tab === 'OWNER' && (
        <div className="flex gap-3 px-4 py-2 overflow-x-auto scrollbar-thin">
          {owners.map((owner, i) => {
            const bal = getOwnerBalance(owner.id)
            const color = owner.color || OWNER_COLORS[i]
            return (
              <div key={owner.id} className="flex-shrink-0 rounded-2xl p-4 text-white min-w-[160px] shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm mb-3">
                  {owner.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-sm text-white/90 mb-1">{owner.name}</p>
                <p className="font-bold text-xl">{formatCurrency(Math.abs(bal), settings.currency)}</p>
                <p className="text-white/60 text-xs mt-0.5">{bal >= 0 ? 'Company owes owner' : 'Owner owes company'}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TRANSACTION LIST ─────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-2 pb-8 space-y-5">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <p className="text-gray-500 font-semibold">No entries found</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to add a new entry</p>
          </div>
        ) : (
          grouped.map(([date, txns]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dayLabel(date)}</p>
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs text-gray-400 font-medium">
                  {formatCurrency(
                    txns.reduce((s, t) => s + (isInflow(t.type) ? t.amount : -t.amount), 0),
                    settings.currency
                  )}
                </p>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {txns.map(t => {
                  const inflow = isInflow(t.type)
                  const owner  = t.ownerId ? owners.find(o => o.id === t.ownerId) : null
                  const catColor = CAT_COLOR[t.category] || (inflow ? '#10B981' : '#F43F5E')

                  return (
                    <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: inflow ? '#ECFDF5' : '#FFF1F2' }}>
                        {inflow
                          ? <ArrowUpRight size={20} color="#10B981" />
                          : <ArrowDownRight size={20} color="#F43F5E" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{t.description}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {t.category && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${catColor}18`, color: catColor }}>
                              {getCategoryLabel(t.category)}
                            </span>
                          )}
                          {t.paymentMode && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                              {t.paymentMode === 'CASH' ? '💵 Cash' : '📱 Online'}
                            </span>
                          )}
                          {owner && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${owner.color || '#3B82F6'}18`, color: owner.color || '#3B82F6' }}>
                              {owner.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount + actions */}
                      <div className="flex-shrink-0 text-right">
                        <p className="font-bold text-base"
                          style={{ color: inflow ? '#10B981' : '#F43F5E' }}>
                          {inflow ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                        </p>
                        <div className="flex gap-1 mt-1.5 justify-end">
                          <button onClick={() => openEdit(t)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setConfirmDel(t.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DELETE CONFIRM ────────────────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={24} color="#F43F5E" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Delete Entry?</p>
            <p className="text-gray-400 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button onClick={() => { deleteTransaction(confirmDel); setConfirmDel(null) }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: '#F43F5E' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && (
        <TransactionForm
          onClose={() => { setShowEditForm(false); setEditData(null) }}
          editData={editData}
          defaultTab={CATEGORY_TABS.has(tab) ? 'OUT' : tab}
          defaultCategory={CATEGORY_TABS.has(tab) ? tab : ''}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  )
}
