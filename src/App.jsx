import { useState, useMemo } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import InlineAddForm from './components/InlineAddForm'
import TransactionForm from './components/TransactionForm'
import SettingsModal from './components/SettingsModal'
import PartnerDetail from './components/PartnerDetail'
import {
  formatCurrency, isInflow, TRANSACTION_TYPES, OWNER_COLORS, getCategoryLabel
} from './utils/helpers'
import {
  Settings, ArrowUpRight, ArrowDownRight, Pencil, Trash2,
  Search, X as XIcon, Wheat, Printer, Users,
  LayoutList, Briefcase, Building2, Package, Receipt,
  Truck as TruckIcon, ShoppingBag
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

const CAT_COLOR = {
  SALARY:'#8B5CF6', LABOUR:'#F97316', BANK:'#06B6D4',
  DEPOT_EXP:'#EC4899', EXPENDITURE:'#EF4444', ASHOK_DEPOT:'#14B8A6',
  TRUCK:'#F59E0B', PADDY_PURCHASE:'#84CC16', ELECTRICITY:'#3B82F6',
  TRANSPORT:'#F59E0B', MACHINE_MAINTENANCE:'#64748B', GUNNY_BAGS:'#A78BFA',
  DIESEL_FUEL:'#F97316', MISCELLANEOUS:'#94A3B8',
}

const CATEGORY_TABS = new Set(['SALARY','LABOUR','BANK','DEPOT_EXP','EXPENDITURE','ASHOK_DEPOT','TRUCK'])

const NAV_MAIN = [
  { key: 'ALL',   label: 'All',     icon: LayoutList    },
  { key: 'IN',    label: 'Cash In', icon: ArrowUpRight  },
  { key: 'OUT',   label: 'Cash Out',icon: ArrowDownRight},
  { key: 'OWNER', label: 'Partner', icon: Users         },
]
const NAV_EXPENSE = [
  { key: 'SALARY',      label: 'Salary',  icon: Briefcase  },
  { key: 'LABOUR',      label: 'Labour',  icon: Briefcase  },
  { key: 'BANK',        label: 'Bank',    icon: Building2  },
  { key: 'DEPOT_EXP',   label: 'Depot',   icon: Package    },
  { key: 'EXPENDITURE', label: 'Expense', icon: Receipt    },
  { key: 'ASHOK_DEPOT', label: 'Ashok',   icon: ShoppingBag},
  { key: 'TRUCK',       label: 'Truck',   icon: TruckIcon  },
]

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMMM yyyy')
}

// ── Always-visible narrow sidebar ────────────────────────────────────────────
function Sidebar({ activeTab, onTabChange }) {
  return (
    <div
      className="fixed left-0 top-0 h-full z-30 flex flex-col overflow-y-auto"
      style={{ width: 68, background: '#0B1426', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Wheat size={16} color="#F59E0B" />
        </div>
      </div>

      {/* Main nav */}
      <div className="flex flex-col items-center py-2 gap-0.5">
        {NAV_MAIN.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className="flex flex-col items-center justify-center w-full py-2.5 gap-1 transition-all"
              style={active
                ? { background: 'rgba(99,102,241,0.2)', borderLeft: '3px solid #818CF8' }
                : { borderLeft: '3px solid transparent' }
              }>
              <Icon size={17} color={active ? '#A5B4FC' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: 9, fontWeight: 600, color: active ? '#C7D2FE' : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 8px' }} />

      {/* Expense nav */}
      <div className="flex flex-col items-center py-2 gap-0.5">
        {NAV_EXPENSE.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          const color = CAT_COLOR[item.key] || '#94A3B8'
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className="flex flex-col items-center justify-center w-full py-2.5 gap-1 transition-all"
              style={active
                ? { background: `${color}22`, borderLeft: `3px solid ${color}` }
                : { borderLeft: '3px solid transparent' }
              }>
              <Icon size={14} color={active ? color : 'rgba(255,255,255,0.3)'} />
              <span style={{ fontSize: 9, fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
function MainApp() {
  const { transactions, owners, settings, getCompanyBalance, getOwnerBalance, deleteTransaction } = useApp()

  const [tab, setTab]               = useState('ALL')
  const [search, setSearch]         = useState('')
  const [monthFilter, setMonthFilter] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [selectedPartner, setSelectedPartner] = useState(null)

  const balance = getCompanyBalance()

  const availableMonths = useMemo(() => {
    const seen = new Set()
    transactions.forEach(t => seen.add(t.date.slice(0, 7)))
    return Array.from(seen).sort().reverse()
      .map(key => ({ key, label: format(new Date(key + '-01'), 'MMM yy') }))
  }, [transactions])

  const { todayIn, todayOut } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const t2 = transactions.filter(t => t.date === today)
    return {
      todayIn:  t2.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0),
      todayOut: t2.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions])

  const { monthIn, monthOut } = useMemo(() => {
    if (!monthFilter) return { monthIn: 0, monthOut: 0 }
    const m = transactions.filter(t => t.date.startsWith(monthFilter))
    return {
      monthIn:  m.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0),
      monthOut: m.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions, monthFilter])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (monthFilter && !t.date.startsWith(monthFilter)) return false
      if (tab === 'IN')    { if (t.type !== TRANSACTION_TYPES.CASH_IN) return false }
      else if (tab === 'OUT')   { if (t.type !== TRANSACTION_TYPES.EXPENSE) return false }
      else if (tab === 'OWNER') {
        const isP = t.type === TRANSACTION_TYPES.OWNER_DEPOSIT || t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL
        const isL = t.partnerId && (t.type === TRANSACTION_TYPES.CASH_IN || t.type === TRANSACTION_TYPES.EXPENSE)
        if (!isP && !isL) return false
      }
      else if (CATEGORY_TABS.has(tab)) {
        if (t.type !== TRANSACTION_TYPES.EXPENSE || t.category !== tab) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        return t.description?.toLowerCase().includes(q) || getCategoryLabel(t.category)?.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))
  }, [transactions, tab, search, monthFilter])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(t => { if (!map[t.date]) map[t.date] = []; map[t.date].push(t) })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const switchTab = (key) => { setTab(key); setSearch('') }

  const handlePrint = () => {
    const allNav = [...NAV_MAIN, ...NAV_EXPENSE]
    const periodLabel = monthFilter
      ? format(new Date(monthFilter + '-01'), 'MMMM yyyy')
      : allNav.find(n => n.key === tab)?.label || 'All Transactions'
    const totalIn  = filtered.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0)
    const totalOut = filtered.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0)
    const rows = [...filtered].sort((a, b) => a.date.localeCompare(b.date)).map(t => {
      const partner = t.ownerId ? owners.find(o => o.id === t.ownerId)
                    : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
      const inflow = isInflow(t.type)
      return `<tr><td>${t.date}</td><td>${t.description||''}</td><td>${getCategoryLabel(t.category)||''}</td><td>${partner?.name||''}</td>
        <td style="color:#10B981;text-align:right">${inflow?'₹'+t.amount.toLocaleString('en-IN'):''}</td>
        <td style="color:#F43F5E;text-align:right">${!inflow?'₹'+t.amount.toLocaleString('en-IN'):''}</td></tr>`
    }).join('')
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>KRM Ledger</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}h2{margin:0 0 4px}
    .s{display:flex;gap:16px;margin:16px 0}.b{padding:12px 20px;border-radius:8px}
    table{width:100%;border-collapse:collapse}th{background:#1E293B;color:#fff;padding:8px;text-align:left;font-size:11px;text-transform:uppercase}
    td{padding:7px 8px;border-bottom:1px solid #E2E8F0}tr:nth-child(even) td{background:#F8FAFC}</style></head><body>
    <h2>${settings.companyName||'KRM Rice Mill'}</h2><p style="color:#64748B;margin:0 0 16px">${periodLabel} — ${format(new Date(),'dd MMM yyyy')}</p>
    <div class="s">
      <div class="b" style="background:#ECFDF5"><div style="font-size:10px;color:#059669;font-weight:bold">CASH IN</div><div style="font-size:18px;font-weight:bold;color:#10B981">₹${totalIn.toLocaleString('en-IN')}</div></div>
      <div class="b" style="background:#FFF1F2"><div style="font-size:10px;color:#E11D48;font-weight:bold">CASH OUT</div><div style="font-size:18px;font-weight:bold;color:#F43F5E">₹${totalOut.toLocaleString('en-IN')}</div></div>
      <div class="b" style="background:#EFF6FF"><div style="font-size:10px;color:#2563EB;font-weight:bold">NET</div><div style="font-size:18px;font-weight:bold;color:#3B82F6">₹${(totalIn-totalOut).toLocaleString('en-IN')}</div></div>
    </div>
    <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Partner</th><th style="text-align:right">Cash In</th><th style="text-align:right">Cash Out</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
  }

  const activeLabel = [...NAV_MAIN, ...NAV_EXPENSE].find(n => n.key === tab)?.label

  return (
    <div className="min-h-screen flex" style={{ background: '#F1F5F9' }}>

      {/* ── ALWAYS-VISIBLE SIDEBAR ───────────────────────────────────────── */}
      <Sidebar activeTab={tab} onTabChange={switchTab} />

      {/* ── MAIN CONTENT (offset by sidebar) ────────────────────────────── */}
      <div className="flex flex-col flex-1" style={{ marginLeft: 68 }}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5"
          style={{ background: '#0B1426', height: 48 }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white font-bold text-sm truncate">{settings.companyName || 'KRM Rice Mill'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handlePrint}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <Printer size={14} color="rgba(255,255,255,0.65)" />
            </button>
            <button onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <Settings size={14} color="rgba(255,255,255,0.65)" />
            </button>
          </div>
        </div>

        {/* ── BALANCE CARD ──────────────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-2">
          <div className="rounded-xl p-3" style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)' }}>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">Cash Balance</p>
            <p className={`font-bold mb-2.5 ${balance >= 0 ? 'text-white' : 'text-red-400'}`}
              style={{ fontSize: 28, lineHeight: 1 }}>
              {formatCurrency(balance, settings.currency)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <ArrowUpRight size={9} color="#10B981" />
                  <p className="text-slate-400" style={{ fontSize: 9 }}>
                    {monthFilter ? format(new Date(monthFilter+'-01'),'MMM')+' Kamai' : 'Aaj Ki Kamai'}
                  </p>
                </div>
                <p className="text-emerald-400 font-bold text-sm">{formatCurrency(monthFilter ? monthIn : todayIn, settings.currency)}</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <ArrowDownRight size={9} color="#F43F5E" />
                  <p className="text-slate-400" style={{ fontSize: 9 }}>
                    {monthFilter ? format(new Date(monthFilter+'-01'),'MMM')+' Kharcha' : 'Aaj Ka Kharcha'}
                  </p>
                </div>
                <p className="text-rose-400 font-bold text-sm">{formatCurrency(monthFilter ? monthOut : todayOut, settings.currency)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── INLINE ADD FORM (right next to sidebar, no popup) ─────────── */}
        <InlineAddForm
          key={tab}
          defaultMode={CATEGORY_TABS.has(tab) ? 'OUT' : tab === 'IN' ? 'IN' : tab === 'OWNER' ? 'OWNER' : 'IN'}
          defaultCategory={CATEGORY_TABS.has(tab) ? tab : ''}
        />

        {/* ── SECTION LABEL + SEARCH ────────────────────────────────────── */}
        <div className="px-3 pt-1 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full" style={{ background: CAT_COLOR[tab] || '#6366F1' }} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{activeLabel}</span>
            {monthFilter && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-auto"
                style={{ background: '#FEF3C7', color: '#92400E' }}>
                {format(new Date(monthFilter+'-01'), 'MMM yyyy')}
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-white rounded-xl text-sm text-gray-700 placeholder-gray-400 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <XIcon size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── MONTH FILTER ──────────────────────────────────────────────── */}
        {availableMonths.length > 0 && (
          <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-thin">
            <button onClick={() => setMonthFilter(null)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={monthFilter === null
                ? { background: '#1E293B', color: '#fff' }
                : { background: '#E2E8F0', color: '#64748B' }}>
              All
            </button>
            {availableMonths.map(m => (
              <button key={m.key} onClick={() => setMonthFilter(monthFilter === m.key ? null : m.key)}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={monthFilter === m.key
                  ? { background: '#F59E0B', color: '#fff' }
                  : { background: '#E2E8F0', color: '#64748B' }}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ── PARTNER CARDS ─────────────────────────────────────────────── */}
        {tab === 'OWNER' && (
          <div className="flex gap-2.5 px-3 pb-2 overflow-x-auto scrollbar-thin">
            {owners.map((owner, i) => {
              const bal = getOwnerBalance(owner.id)
              const color = owner.color || OWNER_COLORS[i]
              return (
                <div key={owner.id} onClick={() => setSelectedPartner(owner)}
                  className="flex-shrink-0 rounded-xl p-3 text-white cursor-pointer active:scale-95 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}BB)`, minWidth: 130 }}>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs mb-2">
                    {owner.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-xs text-white/90 truncate">{owner.name.split(' ')[0]}</p>
                  <p className="font-bold text-base mt-0.5">{formatCurrency(Math.abs(bal), settings.currency)}</p>
                  <p className="text-white/40 text-xs mt-0.5">Tap for details</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TRANSACTION LIST ──────────────────────────────────────────── */}
        <div className="flex-1 px-3 pb-6 space-y-3">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-gray-500 font-semibold text-sm">No entries found</p>
              <p className="text-gray-400 text-xs mt-1">Add entries using the form above</p>
            </div>
          ) : grouped.map(([date, txns]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dayLabel(date)}</p>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: txns.reduce((s,t) => s+(isInflow(t.type)?t.amount:-t.amount),0) >= 0 ? '#ECFDF5' : '#FFF1F2',
                    color:      txns.reduce((s,t) => s+(isInflow(t.type)?t.amount:-t.amount),0) >= 0 ? '#059669' : '#E11D48',
                  }}>
                  {formatCurrency(txns.reduce((s,t) => s+(isInflow(t.type)?t.amount:-t.amount),0), settings.currency)}
                </span>
              </div>

              <div className="space-y-1.5">
                {txns.map(t => {
                  const inflow   = isInflow(t.type)
                  const partner  = t.ownerId   ? owners.find(o => o.id === t.ownerId)
                                 : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
                  const catColor = CAT_COLOR[t.category] || (inflow ? '#10B981' : '#F43F5E')
                  return (
                    <div key={t.id} className="bg-white rounded-xl px-3 py-2.5 shadow-sm border border-gray-100 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: inflow ? '#ECFDF5' : '#FFF1F2' }}>
                        {inflow
                          ? <ArrowUpRight size={16} color="#10B981" />
                          : <ArrowDownRight size={16} color="#F43F5E" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-xs">{t.description}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {t.category && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${catColor}18`, color: catColor, fontSize: 9 }}>
                              {getCategoryLabel(t.category)}
                            </span>
                          )}
                          {t.paymentMode && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: '#F1F5F9', color: '#94A3B8', fontSize: 9 }}>
                              {t.paymentMode === 'CASH' ? '💵' : '📱'}
                            </span>
                          )}
                          {partner && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${partner.color||'#3B82F6'}15`, color: partner.color||'#3B82F6', fontSize: 9 }}>
                              {partner.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-bold text-sm" style={{ color: inflow ? '#10B981' : '#F43F5E' }}>
                          {inflow ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                        </p>
                        <div className="flex gap-1 mt-1 justify-end">
                          <button onClick={() => { setEditData(t); setShowEditForm(true) }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil size={10} />
                          </button>
                          <button onClick={() => setConfirmDel(t.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DELETE CONFIRM ────────────────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={22} color="#F43F5E" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Delete Entry?</p>
            <p className="text-gray-400 text-sm mb-5">This cannot be undone.</p>
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
          defaultTab="IN"
          defaultCategory=""
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {selectedPartner && (
        <PartnerDetail
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
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
