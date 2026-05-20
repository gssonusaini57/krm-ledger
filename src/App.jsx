import { useState, useMemo } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import InlineAddForm from './components/InlineAddForm'
import TransactionForm from './components/TransactionForm'
import SettingsModal from './components/SettingsModal'
import PartnerDetail from './components/PartnerDetail'
import EmployeeDetail from './components/EmployeeDetail'
import AdvancePaymentForm from './components/AdvancePaymentForm'
import {
  formatCurrency, formatDate, isInflow, computeRunningBalance, TRANSACTION_TYPES, OWNER_COLORS, getCategoryLabel, todayISO, DEPO_EXPENSE_CATEGORIES
} from './utils/helpers'
import {
  Settings, ArrowUpRight, ArrowDownRight, Pencil, Trash2,
  Search, X as XIcon, Wheat, Printer, Users, FileText,
  LayoutList, Briefcase, Building2, Package, Receipt,
  Truck as TruckIcon, ShoppingBag, TrendingDown, TrendingUp,
  ShieldAlert,
} from 'lucide-react'
import DepoExpenseForm from './components/DepoExpenseForm'
import DateInput from './components/DateInput'
import { format, isToday, isYesterday } from 'date-fns'

const CAT_COLOR = {
  SALARY:'#8B5CF6', LABOUR:'#F97316', BANK:'#06B6D4',
  DEPOT_EXP:'#EC4899', EXPENDITURE:'#EF4444', ASHOK_DEPOT:'#14B8A6',
  TRUCK:'#F59E0B', PANKAJ_PLASH:'#3B82F6', AMAN_PLASH:'#10B981',
  BROKEN_BUY:'#DC2626', BROKEN_SELL:'#16A34A',
  HUSK_SELL:'#F59E0B',  BRAN_SELL:'#92400E',
  PADDY_PURCHASE:'#84CC16', ELECTRICITY:'#3B82F6',
  TRANSPORT:'#F59E0B', MACHINE_MAINTENANCE:'#64748B', GUNNY_BAGS:'#A78BFA',
  DIESEL_FUEL:'#F97316', MISCELLANEOUS:'#94A3B8',
  // Depo Expense categories
  DEPO_LOADING:'#F97316', DEPO_TRANSPORT:'#06B6D4', DEPO_TOLL:'#8B5CF6',
  DEPO_LABOUR:'#EC4899',  DEPO_TEA:'#84CC16',       DEPO_MISC:'#94A3B8',
  // Advance transfer types
  ADVANCE_OUT:'#F59E0B', ADVANCE_RETURN:'#10B981', ADVANCE_EXPENSE:'#EF4444',
}

const CATEGORY_TABS       = new Set(['SALARY','LABOUR','BANK','EXPENDITURE','ASHOK_DEPOT','TRUCK','PANKAJ_PLASH','AMAN_PLASH','BROKEN_BUY'])
const INCOME_CATEGORY_TABS = new Set(['BROKEN_SELL', 'HUSK_SELL', 'BRAN_SELL'])

const NAV_MAIN = [
  { key: 'ALL',   label: 'All',     icon: LayoutList    },
  { key: 'IN',    label: 'Credit',  icon: ArrowUpRight  },
  { key: 'OUT',   label: 'Debit',   icon: ArrowDownRight},
  { key: 'OWNER', label: 'Partner', icon: Users         },
  { key: 'STAFF', label: 'Staff',   icon: Briefcase     },
]
const NAV_EXPENSE = [
  { key: 'SALARY',       label: 'Salary',       icon: Briefcase    },
  { key: 'LABOUR',       label: 'Labour',       icon: Briefcase    },
  { key: 'BANK',         label: 'Bank',         icon: Building2    },
  { key: 'EXPENDITURE',  label: 'Expense',      icon: Receipt      },
  { key: 'ASHOK_DEPOT',  label: 'Ashok',        icon: ShoppingBag  },
  { key: 'TRUCK',        label: 'Truck',        icon: TruckIcon    },
  { key: 'PANKAJ_PLASH', label: 'Pankaj Plash', icon: ShoppingBag  },
  { key: 'AMAN_PLASH',   label: 'Aman Plash',   icon: ShoppingBag  },
  { key: 'BROKEN_BUY',   label: 'Broken Buy',   icon: TrendingDown },
  { key: 'BROKEN_SELL',  label: 'Broken Sell',  icon: TrendingUp   },
  { key: 'HUSK_SELL',    label: 'Husk Sell',    icon: TrendingUp   },
  { key: 'BRAN_SELL',    label: 'Bran Sell',    icon: TrendingUp   },
]
const NAV_DEPO = [
  { key: 'DEPO_ADVANCE', label: 'Add Depo Advance', icon: ArrowUpRight },
  { key: 'DEPO_SETTLE',  label: 'Depo Settlement',  icon: FileText     },
]
const NAV_ADMIN = [
  { key: 'DELETE_APPROVALS', label: 'Trash Management', icon: ShieldAlert },
]

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd/MM/yyyy')
}

const SIDEBAR_W = 200
const REPORT_W  = 200

// ── Always-visible sidebar ────────────────────────────────────────────────────
function Sidebar({ activeTab, onTabChange, companyName, navExpense, catColorMap }) {
  return (
    <div
      className="hidden md:flex flex-col fixed left-0 top-0 h-full z-30 overflow-y-auto"
      style={{ width: SIDEBAR_W, background: '#0F1923', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4"
        style={{ background: '#1B5C20', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Wheat size={15} color="#fff" />
        </div>
        <span className="text-white font-bold text-xs leading-tight truncate">
          {companyName || 'KRM Rice Mill'}
        </span>
      </div>

      {/* Main nav */}
      <div className="flex flex-col py-2">
        {NAV_MAIN.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className="flex items-center gap-3 w-full px-4 py-3 transition-all text-left"
              style={active
                ? { background: 'rgba(255,255,255,0.08)', borderLeft: '3px solid #818CF8', color: '#A5B4FC' }
                : { borderLeft: '3px solid transparent', color: 'rgba(255,255,255,0.5)' }
              }>
              <Icon size={16} color={active ? '#A5B4FC' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 12px' }} />
      <p style={{ fontSize: 10, color: 'rgba(255,200,0,0.45)', fontWeight: 700, letterSpacing: 1, padding: '8px 16px 4px', textTransform: 'uppercase' }}>
        🏭 Depo Management
      </p>

      {/* Depo nav */}
      <div className="flex flex-col">
        {NAV_DEPO.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className="flex items-center gap-3 w-full px-4 py-2.5 transition-all text-left"
              style={active
                ? { background: 'rgba(245,158,11,0.15)', borderLeft: '3px solid #F59E0B', color: '#FCD34D' }
                : { borderLeft: '3px solid transparent', color: 'rgba(255,255,255,0.45)' }
              }>
              <Icon size={14} color={active ? '#F59E0B' : 'rgba(255,255,255,0.3)'} />
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 12px 2px' }} />
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: 1, padding: '6px 16px 4px', textTransform: 'uppercase' }}>
        Categories
      </p>

      {/* Expense nav */}
      <div className="flex flex-col">
        {navExpense.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          const color = catColorMap[item.key] || '#94A3B8'
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className="flex items-center gap-3 w-full px-4 py-2.5 transition-all text-left"
              style={active
                ? { background: `${color}18`, borderLeft: `3px solid ${color}`, color: '#fff' }
                : { borderLeft: '3px solid transparent', color: 'rgba(255,255,255,0.45)' }
              }>
              <Icon size={14} color={active ? color : 'rgba(255,255,255,0.3)'} />
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 12px 2px' }} />
      <p style={{ fontSize: 10, color: 'rgba(239,68,68,0.6)', fontWeight: 700, letterSpacing: 1, padding: '6px 16px 4px', textTransform: 'uppercase' }}>
        🛡️ Admin
      </p>

      {/* Admin nav */}
      <div className="flex flex-col pb-4">
        {NAV_ADMIN.map(item => {
          const Icon = item.icon
          const active = activeTab === item.key
          return (
            <button key={item.key} onClick={() => onTabChange(item.key)}
              className="flex items-center gap-3 w-full px-4 py-2.5 transition-all text-left"
              style={active
                ? { background: 'rgba(239,68,68,0.15)', borderLeft: '3px solid #EF4444', color: '#FCA5A5' }
                : { borderLeft: '3px solid transparent', color: 'rgba(255,255,255,0.45)' }
              }>
              <Icon size={14} color={active ? '#EF4444' : 'rgba(255,255,255,0.3)'} />
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Checks both old linkedCategory (string) and new linkedCategories (array)
const hasLinked = (t, val) =>
  t.linkedCategory === val ||
  (Array.isArray(t.linkedCategories) && t.linkedCategories.includes(val))

const isBankTxn = (t) => t.paymentMode === 'ONLINE' || t.category === 'BANK' || hasLinked(t, 'BANK')

// ── Right Report Panel ───────────────────────────────────────────────────────
function ReportPanel({ owners, transactions, settings, onPartnerClick, isDrawer = false }) {

  const { bankIn, bankOut } = useMemo(() => ({
    bankIn:  transactions.filter(t => (t.type === 'CASH_IN' || t.type === 'OWNER_DEPOSIT')    && isBankTxn(t)).reduce((s, t) => s + t.amount, 0),
    bankOut: transactions.filter(t => (t.type === 'EXPENSE' || t.type === 'OWNER_WITHDRAWAL') && isBankTxn(t)).reduce((s, t) => s + t.amount, 0),
  }), [transactions])

  const partnerStats = useMemo(() =>
    owners.map(owner => {
      const txns     = transactions.filter(t => t.ownerId === owner.id || t.partnerId === owner.id)
      const isOnline = t => t.paymentMode === 'ONLINE'
      const isCash   = t => !t.paymentMode || t.paymentMode === 'CASH'
      const outTypes = t => t.type === 'OWNER_WITHDRAWAL' || t.type === 'EXPENSE'
      const cashIn   = txns.filter(t => t.type === 'OWNER_DEPOSIT' || t.type === 'CASH_IN').reduce((s, t) => s + t.amount, 0)
      const paidCash = txns.filter(t => outTypes(t) && isCash(t)).reduce((s, t) => s + t.amount, 0)
      const paidBank = txns.filter(t => outTypes(t) && isOnline(t)).reduce((s, t) => s + t.amount, 0)
      return { ...owner, cashIn, paidCash, paidBank, cashOut: paidCash + paidBank }
    }),
    [owners, transactions]
  )

  return (
    <div className={isDrawer ? "flex flex-col overflow-y-auto flex-1" : "hidden md:flex flex-col fixed right-0 top-0 h-full z-30 overflow-y-auto"}
      style={isDrawer ? { background: '#0F1923' } : { width: REPORT_W, background: '#0F1923', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

      {!isDrawer && (
      <div className="flex items-center justify-center"
        style={{ background: '#1B5C20', minHeight: 50, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="text-white font-bold uppercase tracking-widest text-sm">Report</span>
      </div>
      )}

      {/* Bank Balance */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-white/40 text-xs uppercase tracking-wide px-1 mb-2">Bank</p>
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
              style={{ background: '#3B82F6' }}>B</div>
            <p className="text-white/80 text-xs font-semibold">Bank Account</p>
          </div>
          <div className="space-y-1 pl-1">
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-xs">Bank In</span>
              <span className="font-bold text-xs text-emerald-400">{formatCurrency(bankIn, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-xs">Bank Out</span>
              <span className="font-bold text-xs text-rose-400">{formatCurrency(bankOut, settings.currency)}</span>
            </div>
            <div className="flex justify-between items-center pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-white/40 text-xs">Balance</span>
              <span className="font-bold text-xs" style={{ color: (bankIn - bankOut) >= 0 ? '#FBBF24' : '#FB7185' }}>
                {formatCurrency(bankIn - bankOut, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Balance — Received / Cash Paid / Bank Paid / Pending */}
      <div className="px-3 py-3 space-y-2">
        <p className="text-white/40 text-xs uppercase tracking-wide px-1">Partner Balance</p>
        {partnerStats.map((owner, i) => {
          const color   = owner.color || OWNER_COLORS[i]
          const pending = owner.cashIn - owner.cashOut
          return (
            <div key={owner.id} onClick={() => onPartnerClick(owner)}
              className="cursor-pointer rounded-lg p-2.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>

              {/* Name row */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ background: color }}>
                  {owner.name.charAt(0)}
                </div>
                <p className="text-white/80 text-xs font-semibold">{owner.name.split(' ')[0]}</p>
              </div>

              <div className="space-y-1 pl-1">
                {/* Received */}
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-xs">Received</span>
                  <span className="font-bold text-xs text-emerald-400">+{formatCurrency(owner.cashIn, settings.currency)}</span>
                </div>

                {/* Cash Paid — only when non-zero */}
                {owner.paidCash > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs">💵 Cash Paid</span>
                    <span className="font-bold text-xs text-rose-400">−{formatCurrency(owner.paidCash, settings.currency)}</span>
                  </div>
                )}

                {/* Bank Paid — only when non-zero */}
                {owner.paidBank > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs">🏦 Bank Paid</span>
                    <span className="font-bold text-xs text-rose-400">−{formatCurrency(owner.paidBank, settings.currency)}</span>
                  </div>
                )}

                {/* Pending */}
                <div className="flex justify-between items-center pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white/60 text-xs font-bold">Pending</span>
                  <span className="font-bold text-xs" style={{ color: pending >= 0 ? '#FBBF24' : '#FB7185' }}>
                    {formatCurrency(Math.abs(pending), settings.currency)}
                    {pending < 0 && <span className="ml-1 opacity-60">(cr)</span>}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Staff View ────────────────────────────────────────────────────────────────
// ── Staff View ────────────────────────────────────────────────────────────────
function StaffView({ employees, transactions, settings, onEmployeeClick }) {
  const { addTransaction, settleWageAccrual } = useApp()
  const cur = settings.currency || '₹'

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')

  const monthOptions = useMemo(() => {
    const opts = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      opts.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') })
    }
    return opts
  }, [])

  const [filterEmpId,   setFilterEmpId]   = useState('')
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)
  const [payDate,  setPayDate]  = useState(todayISO())
  const [payMode,  setPayMode]  = useState('CASH')
  const [amounts,  setAmounts]  = useState({})
  const [notes,    setNotes]    = useState({})
  const [processing, setProcessing] = useState(false)
  const [doneCount,  setDoneCount]  = useState(null)
  const [payingEntry, setPayingEntry] = useState(null)   // accrual being paid
  const [payEntryDate, setPayEntryDate] = useState(todayISO())
  const [payEntryMode, setPayEntryMode] = useState('CASH')
  const [payEntryLoading, setPayEntryLoading] = useState(false)

  const monthLabel   = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth
  const selectedEmp  = filterEmpId ? employees.find(e => e.id === filterEmpId) : null

  // For payout form: show all variable emps, or just the filtered one
  const payoutEmps = filterEmpId
    ? variableEmps.filter(e => e.id === filterEmpId)
    : variableEmps

  const getEmpTxns = (emp) =>
    transactions
      .filter(t => t.employeeId === emp.id && t.date.startsWith(selectedMonth))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''))

  const getEmpStats = (emp) => {
    const txns = getEmpTxns(emp)
    const paid = txns.reduce((s, t) => s + t.amount, 0)
    return { paid, count: txns.length, remaining: emp.type === 'FIXED' ? (emp.salary || 0) - paid : null }
  }

  // Full ledger for a selected employee — ALL months, no date filter
  // Month chip only filters the "All Employees" overview stats, not the individual ledger
  const buildLedger = (emp) => {
    const txns = transactions
      .filter(t => t.employeeId === emp.id &&
        (t.type === TRANSACTION_TYPES.WAGE_ACCRUAL || t.type === TRANSACTION_TYPES.EXPENSE))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''))
    let running = 0
    return txns.map(t => {
      const isAccrual = t.type === TRANSACTION_TYPES.WAGE_ACCRUAL
      const isPayment = t.type === TRANSACTION_TYPES.EXPENSE
      const credit = isAccrual ? t.amount : 0
      const debit  = isPayment ? t.amount : 0
      if (isAccrual) running += t.amount
      if (isPayment) running -= t.amount
      return { ...t, credit, debit, running }
    })
  }

  const handleSettlePay = async (entry) => {
    setPayEntryLoading(true)
    await settleWageAccrual(entry, payEntryDate, payEntryMode)
    setPayEntryLoading(false)
    setPayingEntry(null)
    setPayEntryDate(todayISO())
  }

  const handlePrint = (emp, ledger) => {
    const companyName = settings.companyName || 'KRM Rice Mill'
    const monthLabel  = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth
    const totalCredit = ledger.reduce((s, r) => s + r.credit, 0)
    const totalDebit  = ledger.reduce((s, r) => s + r.debit, 0)
    const closing     = ledger[ledger.length - 1]?.running ?? 0
    const fmt = (n) => `${cur}${Math.abs(n).toLocaleString('en-IN')}`

    const rows = ledger.map(r => `
      <tr>
        <td>${formatDate(r.date)}</td>
        <td>${r.description || '—'}</td>
        <td class="num credit">${r.credit > 0 ? fmt(r.credit) : '—'}</td>
        <td class="num debit">${r.debit  > 0 ? fmt(r.debit)  : '—'}</td>
        <td class="num balance">${fmt(r.running)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ledger – ${emp.name} – ${monthLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1E293B; padding: 24px; }
  .header { border-bottom: 2px solid #1E293B; padding-bottom: 12px; margin-bottom: 16px; }
  .company { font-size: 18px; font-weight: 800; color: #1B5C20; }
  .sub { font-size: 11px; color: #64748B; margin-top: 2px; }
  .emp-block { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .emp-name { font-size: 15px; font-weight: 700; }
  .emp-type { font-size: 11px; color: #64748B; margin-top: 2px; }
  .period-label { font-size: 11px; color: #64748B; text-align: right; }
  .period-val { font-size: 13px; font-weight: 700; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead tr { background: #1E293B; color: #fff; }
  thead th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  thead th.num { text-align: right; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11.5px; }
  .num { text-align: right; font-weight: 600; }
  .credit  { color: #059669; }
  .debit   { color: #E11D48; }
  .balance { color: #1E293B; font-weight: 700; }
  .totals-row { background: #F1F5F9 !important; font-weight: 700; border-top: 2px solid #CBD5E1; }
  .closing { margin-top: 16px; border-top: 2px solid #1E293B; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; }
  .closing-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .closing-val { font-size: 16px; font-weight: 800; color: ${closing > 0 ? '#EA580C' : '#059669'}; }
  .footer { margin-top: 20px; font-size: 10px; color: #94A3B8; text-align: center; }
  @media print {
    body { padding: 12px; }
    button { display: none !important; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="company">${companyName}</div>
  <div class="sub">Employee Wage Ledger Statement</div>
</div>
<div class="emp-block">
  <div>
    <div class="emp-name">${emp.name}</div>
    <div class="emp-type">${emp.type === 'FIXED' ? `Fixed Salary — ${cur}${Number(emp.salary||0).toLocaleString('en-IN')}/month` : 'Variable Labour'}</div>
  </div>
  <div>
    <div class="period-label">Statement Period</div>
    <div class="period-val">${monthLabel}</div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Particulars</th>
      <th class="num">Credit (+)</th>
      <th class="num">Debit (−)</th>
      <th class="num">Balance</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="totals-row">
      <td colspan="2">Total</td>
      <td class="num credit">${fmt(totalCredit)}</td>
      <td class="num debit">${fmt(totalDebit)}</td>
      <td class="num balance">${fmt(closing)}</td>
    </tr>
  </tbody>
</table>
<div class="closing">
  <span class="closing-label">Closing Balance (Outstanding)</span>
  <span class="closing-val">${closing > 0 ? `${fmt(closing)} Owed` : closing < 0 ? `${fmt(closing)} Overpaid` : 'Fully Settled ✓'}</span>
</div>
<div class="footer">Printed on ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })} — ${companyName}</div>
<script>window.onload = () => { window.print() }<\/script>
</body>
</html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  }

  const handleProcess = async () => {
    const toProcess = payoutEmps.filter(e => parseFloat(amounts[e.id]) > 0)
    if (!toProcess.length) return
    setProcessing(true)
    for (const emp of toProcess) {
      const amt  = parseFloat(amounts[emp.id])
      const note = (notes[emp.id] || '').trim()
      await addTransaction({
        date: payDate,
        amount: amt,
        description: note || `Labour – ${emp.name} (${monthLabel})`,
        category: 'LABOUR',
        type: TRANSACTION_TYPES.WAGE_ACCRUAL,
        employeeId: emp.id,
        ownerId: null, partnerId: null,
        linkedCategories: ['LABOUR'],
      })
    }
    setAmounts({})
    setNotes({})
    setProcessing(false)
    setDoneCount(toProcess.length)
    // Auto-navigate: if one worker was processed, jump straight to their ledger
    if (toProcess.length === 1) {
      setFilterEmpId(toProcess[0].id)
      setSelectedMonth(payDate.slice(0, 7))
      setPayingEntry(null)
    }
    setTimeout(() => setDoneCount(null), 3000)
  }

  if (employees.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <p className="text-gray-500 font-semibold text-sm">No staff added yet</p>
      <p className="text-gray-400 text-xs mt-1">Settings → Staff to add employees</p>
    </div>
  )

  return (
    <div className="px-3 pt-2 pb-8 space-y-3">

      {/* ── Labour Name chip row ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '2px solid #7C3AED' }}>
        {/* Section label bar */}
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
          <span className="text-xs font-black text-white uppercase tracking-widest">Select Worker</span>
          <span className="text-xs text-purple-200 font-medium">{employees.length} staff</span>
        </div>

        {/* Name buttons — always visible, never hidden */}
        <div className="bg-white px-3 py-3">
          <div className="flex flex-wrap gap-2">
            {/* All overview */}
            <button
              onClick={() => { setFilterEmpId(''); setPayingEntry(null) }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all"
              style={!filterEmpId
                ? { background: '#1E293B', borderColor: '#1E293B', color: '#fff', boxShadow: '0 3px 10px rgba(30,41,59,0.35)' }
                : { background: '#F8FAFC', borderColor: '#CBD5E1', color: '#475569' }}>
              All
            </button>

            {/* Fixed salary — purple chips */}
            {fixedEmps.map(e => (
              <button key={e.id}
                onClick={() => { setFilterEmpId(e.id); setPayingEntry(null) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all"
                style={filterEmpId === e.id
                  ? { background: '#7C3AED', borderColor: '#7C3AED', color: '#fff', boxShadow: '0 3px 10px rgba(124,58,237,0.4)' }
                  : { background: '#F5F3FF', borderColor: '#C4B5FD', color: '#5B21B6' }}>
                <span className="w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black"
                  style={filterEmpId === e.id ? { background: 'rgba(255,255,255,0.3)' } : { background: '#DDD6FE' }}>
                  {e.name.charAt(0).toUpperCase()}
                </span>
                {e.name}
              </button>
            ))}

            {/* Variable labour — orange chips */}
            {variableEmps.map(e => (
              <button key={e.id}
                onClick={() => { setFilterEmpId(e.id); setPayingEntry(null) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all"
                style={filterEmpId === e.id
                  ? { background: '#EA580C', borderColor: '#EA580C', color: '#fff', boxShadow: '0 3px 10px rgba(234,88,12,0.4)' }
                  : { background: '#FFF7ED', borderColor: '#FED7AA', color: '#9A3412' }}>
                <span className="w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black"
                  style={filterEmpId === e.id ? { background: 'rgba(255,255,255,0.3)' } : { background: '#FFEDD5' }}>
                  {e.name.charAt(0).toUpperCase()}
                </span>
                {e.name}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#7C3AED' }} />
              Fixed Salary
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#EA580C' }} />
              Variable Labour
            </span>
          </div>
        </div>
      </div>

      {/* ── Month chip row — filters All-Employees overview stats only ── */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '2px solid #1B5C20' }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#1B5C20,#166534)' }}>
          <span className="text-xs font-black text-white uppercase tracking-widest">Month</span>
          {selectedEmp && <span className="text-xs text-green-200 font-medium">Overview filter only — ledger shows full history</span>}
        </div>
        <div className="bg-white px-3 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {monthOptions.map(m => (
              <button key={m.value}
                onClick={() => { setSelectedMonth(m.value); setPayingEntry(null) }}
                className="flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-black border-2 transition-all whitespace-nowrap"
                style={selectedMonth === m.value
                  ? { background: '#1B5C20', borderColor: '#1B5C20', color: '#fff', boxShadow: '0 3px 10px rgba(27,92,32,0.4)' }
                  : { background: '#F0FDF4', borderColor: '#86EFAC', color: '#166534' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bank-statement view when specific employee is selected ── */}
      {selectedEmp && (() => {
        const ledger  = buildLedger(selectedEmp)
        const isFixed = selectedEmp.type === 'FIXED'
        const closing = ledger[ledger.length - 1]?.running ?? 0
        const totalCredit = ledger.reduce((s, r) => s + r.credit, 0)
        const totalDebit  = ledger.reduce((s, r) => s + r.debit, 0)
        return (
          <div>
            {/* Employee header + Print button */}
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
                style={{ background: isFixed ? '#EDE9FE' : '#FFF7ED', color: isFixed ? '#7C3AED' : '#EA580C' }}>
                {selectedEmp.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-sm">{selectedEmp.name}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: isFixed ? '#EDE9FE' : '#FFF7ED', color: isFixed ? '#7C3AED' : '#EA580C' }}>
                    {isFixed ? 'Fixed' : 'Variable'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {isFixed
                    ? `Base: ${cur}${Number(selectedEmp.salary||0).toLocaleString('en-IN')}/month`
                    : 'Variable labour — manual wage entry'}
                </p>
              </div>
              <button
                onClick={() => handlePrint(selectedEmp, ledger)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#1E293B,#334155)' }}>
                <Printer size={12} /> Print
              </button>
            </div>

            {/* Summary cards */}
            <div className={`grid gap-2 mb-3 ${isFixed ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {isFixed && (
                <div className="bg-purple-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Salary</p>
                  <p className="font-bold text-purple-700 text-xs">{cur}{Number(selectedEmp.salary||0).toLocaleString('en-IN')}</p>
                </div>
              )}
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Earned</p>
                <p className="font-bold text-emerald-600 text-xs">{cur}{totalCredit.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl p-2 text-center" style={{ background: '#FFF1F2' }}>
                <p className="text-xs text-gray-400 mb-0.5">Paid</p>
                <p className="font-bold text-rose-500 text-xs">{cur}{totalDebit.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl p-2 text-center"
                style={{ background: closing > 0 ? '#FFF7ED' : '#ECFDF5' }}>
                <p className="text-xs text-gray-400 mb-0.5">Due</p>
                <p className="font-bold text-xs" style={{ color: closing > 0 ? '#EA580C' : '#059669' }}>
                  {cur}{Math.abs(closing).toLocaleString('en-IN')}
                  {closing < 0 ? ' (overpaid)' : ''}
                </p>
              </div>
            </div>

            {/* Bank-statement table */}
            {ledger.length === 0 ? (
              <div className="text-center py-8 rounded-2xl bg-gray-50 text-gray-400 text-sm">
                No wage entries found for {selectedEmp?.name}.<br />
                <span className="text-xs">Use the Variable Labour form below to record wages.</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Column headers */}
                <div className="grid px-3 py-2 bg-gray-800 text-xs font-bold uppercase tracking-wider"
                  style={{ gridTemplateColumns: '0.85fr 2fr 0.9fr 0.9fr 0.9fr' }}>
                  <span className="text-gray-300">Date</span>
                  <span className="text-gray-300">Particulars</span>
                  <span className="text-emerald-400 text-right">Credit+</span>
                  <span className="text-rose-400 text-right">Debit−</span>
                  <span className="text-blue-300 text-right">Balance</span>
                </div>
                {/* Rows */}
                {ledger.map((entry, i) => {
                  const isPending = entry.type === TRANSACTION_TYPES.WAGE_ACCRUAL && !entry.settledAt
                  const isPaying  = payingEntry?.id === entry.id
                  return (
                    <div key={entry.id} className={i > 0 ? 'border-t border-gray-50' : ''}>
                      <div className="grid items-start px-3 py-2.5"
                        style={{ gridTemplateColumns: '0.85fr 2fr 0.9fr 0.9fr 0.9fr' }}>
                        {/* Date */}
                        <p className="text-xs font-semibold text-gray-700 leading-tight pt-0.5">{formatDate(entry.date)}</p>
                        {/* Particulars */}
                        <div className="min-w-0 pr-1">
                          <p className="text-xs text-gray-700 font-medium leading-tight truncate">{entry.description || '—'}</p>
                          {entry.type === TRANSACTION_TYPES.WAGE_ACCRUAL && (
                            <span className="inline-block mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md leading-none"
                              style={entry.settledAt
                                ? { background: '#ECFDF5', color: '#059669' }
                                : { background: '#FFF7ED', color: '#EA580C' }}>
                              {entry.settledAt ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          )}
                        </div>
                        {/* Credit */}
                        <p className="text-right text-xs font-bold" style={{ color: entry.credit > 0 ? '#059669' : '#D1D5DB' }}>
                          {entry.credit > 0 ? `${cur}${entry.credit.toLocaleString('en-IN')}` : '—'}
                        </p>
                        {/* Debit */}
                        <p className="text-right text-xs font-bold" style={{ color: entry.debit > 0 ? '#E11D48' : '#D1D5DB' }}>
                          {entry.debit > 0 ? `${cur}${entry.debit.toLocaleString('en-IN')}` : '—'}
                        </p>
                        {/* Balance + Pay Now */}
                        <div className="text-right">
                          <p className="text-xs font-black" style={{ color: entry.running > 0 ? '#1E293B' : '#059669' }}>
                            {cur}{Math.abs(entry.running).toLocaleString('en-IN')}
                          </p>
                          {isPending && !isPaying && (
                            <button onClick={() => { setPayingEntry(entry); setPayEntryDate(todayISO()) }}
                              className="text-xs font-bold mt-0.5 px-2 py-0.5 rounded-lg"
                              style={{ background: '#3B82F6', color: '#fff' }}>
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Inline Pay form */}
                      {isPaying && (
                        <div className="mx-3 mb-2.5 p-3 rounded-xl border border-blue-100 bg-blue-50 space-y-2">
                          <p className="text-xs font-bold text-blue-700">Record Payment — {cur}{entry.amount.toLocaleString('en-IN')}</p>
                          <div className="flex gap-2">
                            <DateInput value={payEntryDate} onChange={e => setPayEntryDate(e.target.value)}
                              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: 12, background: '#fff' }} />
                            <div className="flex gap-1">
                              {[{k:'CASH',l:'💵'},{k:'ONLINE',l:'📱'}].map(o=>(
                                <button key={o.k} type="button" onClick={() => setPayEntryMode(o.k)}
                                  className="w-9 h-9 rounded-lg text-sm border-2 transition-all"
                                  style={payEntryMode===o.k?{borderColor:'#3B82F6',background:'#EFF6FF'}:{borderColor:'#E2E8F0',background:'#fff'}}>
                                  {o.l}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setPayingEntry(null)}
                              className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-xs font-semibold text-gray-500">Cancel</button>
                            <button onClick={() => handleSettlePay(entry)} disabled={payEntryLoading}
                              className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                              style={{ background: payEntryLoading ? '#D1D5DB' : '#3B82F6' }}>
                              {payEntryLoading ? 'Saving…' : 'Mark as Paid'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Totals row */}
                <div className="grid px-3 py-2 bg-gray-50 border-t-2 border-gray-200 text-xs font-bold"
                  style={{ gridTemplateColumns: '0.85fr 2fr 0.9fr 0.9fr 0.9fr' }}>
                  <span className="text-gray-500 uppercase tracking-wider col-span-2">Total</span>
                  <span className="text-right text-emerald-600">{cur}{totalCredit.toLocaleString('en-IN')}</span>
                  <span className="text-right text-rose-500">{cur}{totalDebit.toLocaleString('en-IN')}</span>
                  <span className="text-right text-gray-800">{cur}{Math.abs(closing).toLocaleString('en-IN')}</span>
                </div>
                {/* Closing balance */}
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-200 bg-gray-800 rounded-b-2xl">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Closing Balance</span>
                  <span className="text-sm font-black" style={{ color: closing > 0 ? '#FB923C' : '#34D399' }}>
                    {closing > 0 ? `${cur}${closing.toLocaleString('en-IN')} Owed` : closing < 0 ? `${cur}${Math.abs(closing).toLocaleString('en-IN')} Overpaid` : 'Fully Settled ✓'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── All-employees view (no filter) ── */}
      {!selectedEmp && fixedEmps.length > 0 && (
        <div>
          <p className="text-xs font-bold px-1 mb-1.5 uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Fixed Salary</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {fixedEmps.map((emp, i) => {
              const { paid, remaining } = getEmpStats(emp)
              return (
                <div key={emp.id} onClick={() => onEmployeeClick(emp)}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer active:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400">Paid {cur}{paid.toLocaleString('en-IN')} / {cur}{Number(emp.salary||0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: '#7C3AED' }}>{cur}{Number(emp.salary||0).toLocaleString('en-IN')}</p>
                    <p className="text-xs font-semibold" style={{ color: remaining >= 0 ? '#059669' : '#E11D48' }}>
                      {remaining >= 0 ? `${cur}${remaining.toLocaleString('en-IN')} due` : 'Overpaid'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Variable Labour payout form ── */}
      {payoutEmps.length > 0 && (
        <div>
          <p className="text-xs font-bold px-1 mb-1.5 uppercase tracking-wider" style={{ color: '#F97316' }}>Variable Labour — Record Wages</p>

          {/* Pay date + mode */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-3 space-y-2">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Entry Date</label>
              <DateInput value={payDate} onChange={e => setPayDate(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, background: '#F9FAFB' }} />
            </div>
          </div>

          {/* Worker rows */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
            {payoutEmps.map((emp, i) => {
              const { paid, count } = getEmpStats(emp)
              const hasAmt = parseFloat(amounts[emp.id]) > 0
              return (
                <div key={emp.id} className={`px-3 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400">
                        {monthLabel}: {count > 0 ? `${cur}${paid.toLocaleString('en-IN')} logged` : 'No entries yet'}
                      </p>
                    </div>
                    <button onClick={() => onEmployeeClick(emp)} className="text-xs text-gray-400 whitespace-nowrap">History →</button>
                  </div>
                  <div className="mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1"
                      style={{ color: hasAmt ? '#F97316' : '#94A3B8' }}>Amount ({cur})</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{ background: hasAmt ? '#FFF7ED' : '#F9FAFB', borderColor: hasAmt ? '#F97316' : '#E2E8F0' }}>
                      <span className="font-black select-none" style={{ color: hasAmt ? '#F97316' : '#CBD5E1', fontSize: 16 }}>{cur}</span>
                      <input type="number" min="0" step="any" placeholder="Enter wages for this month"
                        value={amounts[emp.id] || ''}
                        onChange={e => setAmounts(a => ({ ...a, [emp.id]: e.target.value }))}
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 20, fontWeight: 800, color: '#1E293B', outline: 'none' }} />
                    </div>
                  </div>
                  <input type="text" placeholder="Note (optional)"
                    value={notes[emp.id] || ''}
                    onChange={e => setNotes(n => ({ ...n, [emp.id]: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 12, background: '#F9FAFB', outline: 'none', color: '#64748B' }} />
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-400 text-center mb-2">
            Wages recorded here appear as <strong>Pending Payable</strong> — cash deducted only when you click "Pay Now"
          </p>

          {doneCount !== null ? (
            <div className="py-3.5 rounded-2xl text-center text-sm font-bold text-white" style={{ background: '#10B981' }}>
              ✓ {doneCount} wage entr{doneCount !== 1 ? 'ies' : 'y'} recorded as Pending for {monthLabel}
            </div>
          ) : (
            <button onClick={handleProcess}
              disabled={processing || !payoutEmps.some(e => parseFloat(amounts[e.id]) > 0)}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
              style={{ background: (!processing && payoutEmps.some(e => parseFloat(amounts[e.id]) > 0))
                ? 'linear-gradient(135deg,#F97316,#EF4444)' : '#D1D5DB' }}>
              {processing ? 'Recording…' : 'Record as Wages Due (Pending)'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Depo Edit Modal ───────────────────────────────────────────────────────────
function DepoEditModal({ txn, onClose }) {
  const { requestEdit, settings, customCategories = [] } = useApp()
  const cur = settings.currency || '₹'
  const [date, setDate]               = useState(txn.date || '')
  const [amount, setAmount]           = useState(String(txn.amount || ''))
  const [description, setDescription] = useState(txn.description || '')
  const [category, setCategory]       = useState(txn.category || '')
  const [loading, setLoading]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setLoading(true)
    await requestEdit(txn.id, {
      date, amount: amt, description,
      ...(txn.type === TRANSACTION_TYPES.ADVANCE_EXPENSE ? { category } : {}),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-900">Edit Depo Entry</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
            <XIcon size={15} />
          </button>
        </div>
        <div className="mb-4 px-3 py-2 rounded-xl text-xs font-medium text-amber-700"
          style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          Changes will be sent for Admin approval before taking effect.
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
            <DateInput value={date} onChange={e => setDate(e.target.value)} required
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, background: '#F9FAFB' }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Amount ({cur})</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="any"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, background: '#F9FAFB', outline: 'none' }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, background: '#F9FAFB', outline: 'none' }} />
          </div>
          {txn.type === TRANSACTION_TYPES.ADVANCE_EXPENSE && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, background: '#F9FAFB', outline: 'none' }}>
                {DEPO_EXPENSE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: loading ? '#9CA3AF' : '#3B82F6' }}>
              {loading ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Depo View ─────────────────────────────────────────────────────────────────
function DepoView({ mode, transactions, settings }) {
  const { deleteTransaction, customCategories = [] } = useApp()
  const cur = settings.currency || '₹'
  const [confirmDel, setConfirmDel]       = useState(null)
  const [editTxn, setEditTxn]             = useState(null)
  const [filterFrom, setFilterFrom]       = useState('')
  const [filterTo, setFilterTo]           = useState('')
  const [filterType, setFilterType]       = useState('')
  const [filterSearch, setFilterSearch]   = useState('')
  const [selectedIds, setSelectedIds]     = useState(new Set())
  const [confirmBulkDel, setConfirmBulkDel] = useState(false)

  const TYPE_STYLE = {
    [TRANSACTION_TYPES.ADVANCE_OUT]:     { label: 'Advance Given',    bg: '#FFFBEB', color: '#D97706', icon: '→' },
    [TRANSACTION_TYPES.ADVANCE_EXPENSE]: { label: 'Depo Expense',     bg: '#FFF1F2', color: '#E11D48', icon: '↓' },
    [TRANSACTION_TYPES.ADVANCE_RETURN]:  { label: 'Returned to Main', bg: '#ECFDF5', color: '#059669', icon: '←' },
  }

  const allDepoTxns = transactions
    .filter(t => t.type === TRANSACTION_TYPES.ADVANCE_OUT || t.type === TRANSACTION_TYPES.ADVANCE_EXPENSE || t.type === TRANSACTION_TYPES.ADVANCE_RETURN)
    .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt||0) - new Date(a.createdAt||0))

  const depoTxns = allDepoTxns.filter(t => {
    if (filterFrom && t.date < filterFrom) return false
    if (filterTo   && t.date > filterTo)   return false
    if (filterType && t.type !== filterType) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      if (!t.description?.toLowerCase().includes(q) && !getCategoryLabel(t.category, customCategories)?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const allSelected = depoTxns.length > 0 && depoTxns.every(t => selectedIds.has(t.id))
  const hasFilters  = filterFrom || filterTo || filterType || filterSearch

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(depoTxns.map(t => t.id)))
  }

  const toggleOne = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteTransaction(id))
    setSelectedIds(new Set())
    setConfirmBulkDel(false)
  }

  const handlePrint = () => {
    const rows = [...depoTxns].reverse().map(t => {
      const s = TYPE_STYLE[t.type] || {}
      const catLabel = t.type === TRANSACTION_TYPES.ADVANCE_EXPENSE ? getCategoryLabel(t.category, customCategories) : ''
      const amtColor = t.type === TRANSACTION_TYPES.ADVANCE_RETURN ? '#059669' : t.type === TRANSACTION_TYPES.ADVANCE_EXPENSE ? '#E11D48' : '#D97706'
      return `<tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.description || ''}</td>
        <td><span style="padding:2px 8px;border-radius:999px;background:${s.color}18;color:${s.color};font-size:10px;font-weight:600">${s.label}</span></td>
        <td>${catLabel}</td>
        <td style="text-align:right;color:${amtColor};font-weight:700">${t.type === TRANSACTION_TYPES.ADVANCE_RETURN ? '+' : '−'}${formatCurrency(t.amount, cur)}</td>
      </tr>`
    }).join('')
    const totAdv = depoTxns.filter(t => t.type === TRANSACTION_TYPES.ADVANCE_OUT).reduce((s, t) => s + t.amount, 0)
    const totExp = depoTxns.filter(t => t.type === TRANSACTION_TYPES.ADVANCE_EXPENSE).reduce((s, t) => s + t.amount, 0)
    const totRet = depoTxns.filter(t => t.type === TRANSACTION_TYPES.ADVANCE_RETURN).reduce((s, t) => s + t.amount, 0)
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>Depo Settlement</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}h2{margin:0 0 4px}
    .s{display:flex;gap:14px;margin:14px 0;flex-wrap:wrap}.b{padding:10px 18px;border-radius:8px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#1E293B;color:#fff;padding:8px;text-align:left;font-size:11px;text-transform:uppercase}
    td{padding:7px 8px;border-bottom:1px solid #E2E8F0}tr:nth-child(even) td{background:#F8FAFC}</style></head><body>
    <h2>${settings.companyName || 'KRM Rice Mill'} — Depo Settlement Report</h2>
    <p style="color:#64748B;margin:2px 0 14px">${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
    <div class="s">
      <div class="b" style="background:#FFFBEB"><div style="font-size:10px;color:#D97706;font-weight:700">ADVANCE GIVEN</div><div style="font-size:20px;font-weight:800;color:#F59E0B">${formatCurrency(totAdv, cur)}</div></div>
      <div class="b" style="background:#FFF1F2"><div style="font-size:10px;color:#E11D48;font-weight:700">DEPO EXPENSES</div><div style="font-size:20px;font-weight:800;color:#F43F5E">${formatCurrency(totExp, cur)}</div></div>
      <div class="b" style="background:#ECFDF5"><div style="font-size:10px;color:#059669;font-weight:700">CASH RETURNED</div><div style="font-size:20px;font-weight:800;color:#10B981">${formatCurrency(totRet, cur)}</div></div>
      <div class="b" style="background:#EFF6FF"><div style="font-size:10px;color:#2563EB;font-weight:700">OUTSTANDING</div><div style="font-size:20px;font-weight:800;color:#3B82F6">${formatCurrency(totAdv - totExp - totRet, cur)}</div></div>
    </div>
    <table><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
  }

  return (
    <div>
      <DepoExpenseForm mode={mode} />

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 12px 10px' }}>
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300">
              <option value="">All Types</option>
              <option value={TRANSACTION_TYPES.ADVANCE_OUT}>Advance Given</option>
              <option value={TRANSACTION_TYPES.ADVANCE_EXPENSE}>Depo Expense</option>
              <option value={TRANSACTION_TYPES.ADVANCE_RETURN}>Cash Returned</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <DateInput value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50" />
            <span className="text-xs text-gray-400 font-medium">to</span>
            <DateInput value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50" />
            {hasFilters && (
              <button onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterType(''); setFilterSearch('') }}
                className="text-xs font-bold px-2 py-1.5 rounded-lg"
                style={{ color: '#EF4444', background: '#FFF1F2' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table Toolbar ──────────────────────────────────────────────────── */}
      <div style={{ padding: '0 12px 8px' }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>
            Depo History
          </p>
          <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 600 }}>({depoTxns.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button onClick={() => setConfirmBulkDel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: '#F43F5E' }}>
              <Trash2 size={11} /> Delete ({selectedIds.size})
            </button>
          )}
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: '#3B82F6' }}>
            <Printer size={11} /> Print
          </button>
        </div>
      </div>

      {/* ── Transaction List ───────────────────────────────────────────────── */}
      <div style={{ padding: '0 12px 32px' }}>
        {depoTxns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>
            {hasFilters ? 'No transactions match the filters' : 'No depo transactions yet'}
          </div>
        ) : (
          <>
            {/* Select All row */}
            <div className="flex items-center gap-2 px-1 pb-2">
              <input type="checkbox" checked={allSelected} onChange={toggleAll}
                className="w-4 h-4 cursor-pointer accent-rose-500" />
              <span className="text-xs font-semibold text-gray-400">
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {depoTxns.map(t => {
                const s = TYPE_STYLE[t.type] || {}
                const catColor  = CAT_COLOR[t.category] || CAT_COLOR[t.type] || '#94A3B8'
                const isSelected = selectedIds.has(t.id)
                return (
                  <div key={t.id}
                    className="bg-white rounded-xl px-3 py-2.5 shadow-sm border flex items-center gap-2.5"
                    style={{ borderColor: isSelected ? '#F43F5E' : '#F1F5F9', background: isSelected ? '#FFF8F8' : '#fff', cursor: 'pointer' }}
                    onClick={() => toggleOne(t.id)}>
                    <input type="checkbox" checked={isSelected}
                      onChange={() => toggleOne(t.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 flex-shrink-0 cursor-pointer accent-rose-500" />
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: s.color, fontWeight: 700, fontSize: 16 }}>
                      {s.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#111827', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</p>
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 999, background: `${s.color}18`, color: s.color }}>{s.label}</span>
                        {t.type === TRANSACTION_TYPES.ADVANCE_EXPENSE && (
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 999, background: `${catColor}18`, color: catColor }}>{getCategoryLabel(t.category, customCategories)}</span>
                        )}
                        <span style={{ fontSize: 9, color: '#9CA3AF' }}>{formatDate(t.date)}</span>
                        {t.status === 'pending_edit' && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: '#FEF3C7', color: '#D97706' }}>✏️ Pending Edit</span>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: s.color }}>
                        {t.type === TRANSACTION_TYPES.ADVANCE_RETURN ? '+' : '-'}{formatCurrency(t.amount, cur)}
                      </p>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditTxn(t) }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Request edit">
                          <Pencil size={10} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDel(t) }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          title="Request delete">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Single Delete Confirm ───────────────────────────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={22} color="#F43F5E" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Delete Entry?</p>
            <p className="text-gray-500 text-sm mb-1 truncate">{confirmDel.description}</p>
            <p className="text-gray-400 text-xs mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
              <button onClick={() => { deleteTransaction(confirmDel.id); setConfirmDel(null) }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: '#F43F5E' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirm ─────────────────────────────────────────────── */}
      {confirmBulkDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={22} color="#F43F5E" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Delete {selectedIds.size} {selectedIds.size === 1 ? 'Entry' : 'Entries'}?</p>
            <p className="text-gray-400 text-sm mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulkDel(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
              <button onClick={handleBulkDelete}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: '#F43F5E' }}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      {editTxn && <DepoEditModal txn={editTxn} onClose={() => setEditTxn(null)} />}
    </div>
  )
}

// ── Delete Approvals Admin View ───────────────────────────────────────────────
function DeleteApprovalsView({ settings }) {
  const {
    pendingDeletes, pendingEdits = [],
    approveDelete, recoverTransaction,
    approveEdit, rejectEdit,
    owners,
  } = useApp()
  const cur = settings.currency || '₹'
  const [subTab, setSubTab] = useState('delete') // 'delete' | 'edit'

  // ── Delete tab state ──────────────────────────────────────────────────────
  const [delSelectedIds, setDelSelectedIds] = useState(new Set())
  const [delConfirm, setDelConfirm]         = useState(null) // 'approve' | 'recover'

  const allDelSelected = pendingDeletes.length > 0 && pendingDeletes.every(t => delSelectedIds.has(t.id))
  const toggleDelAll   = () => allDelSelected
    ? setDelSelectedIds(new Set())
    : setDelSelectedIds(new Set(pendingDeletes.map(t => t.id)))
  const toggleDelOne = (id) => setDelSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const execDelAction = (action) => {
    const ids = [...delSelectedIds]
    if (action === 'approve') ids.forEach(id => approveDelete(id))
    else ids.forEach(id => recoverTransaction(id))
    setDelSelectedIds(new Set()); setDelConfirm(null)
  }
  const groupedDeletes = useMemo(() => {
    const map = {}
    pendingDeletes.forEach(t => {
      const key = (t.deletedAt || t.date || '').slice(0, 10)
      if (!map[key]) map[key] = []; map[key].push(t)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [pendingDeletes])

  // ── Edit tab state ────────────────────────────────────────────────────────
  const [editSelectedIds, setEditSelectedIds] = useState(new Set())
  const [editConfirm, setEditConfirm]         = useState(null) // 'approve' | 'reject'

  const allEditSelected = pendingEdits.length > 0 && pendingEdits.every(t => editSelectedIds.has(t.id))
  const toggleEditAll   = () => allEditSelected
    ? setEditSelectedIds(new Set())
    : setEditSelectedIds(new Set(pendingEdits.map(t => t.id)))
  const toggleEditOne = (id) => setEditSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const execEditAction = (action) => {
    const ids = [...editSelectedIds]
    if (action === 'approve') {
      ids.forEach(id => {
        const txn = pendingEdits.find(t => t.id === id)
        if (txn?.pendingEdit) approveEdit(id, txn.pendingEdit)
      })
    } else {
      ids.forEach(id => rejectEdit(id))
    }
    setEditSelectedIds(new Set()); setEditConfirm(null)
  }
  const groupedEdits = useMemo(() => {
    const map = {}
    pendingEdits.forEach(t => {
      const key = (t.pendingEdit?.requestedAt || t.date || '').slice(0, 10)
      if (!map[key]) map[key] = []; map[key].push(t)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [pendingEdits])

  const EDIT_FIELDS = [
    { key: 'date',        label: 'Date' },
    { key: 'amount',      label: 'Amount', fmt: v => formatCurrency(v, cur) },
    { key: 'description', label: 'Description' },
    { key: 'category',    label: 'Category' },
  ]

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">

      {/* Sub-tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <button onClick={() => setSubTab('delete')}
          className="flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: subTab === 'delete' ? '#EF4444' : 'transparent', color: subTab === 'delete' ? '#fff' : '#6B7280' }}>
          🗑️ Delete Requests
          {pendingDeletes.length > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-xs font-black"
              style={{ background: subTab === 'delete' ? 'rgba(255,255,255,0.25)' : '#FEE2E2', color: subTab === 'delete' ? '#fff' : '#EF4444' }}>
              {pendingDeletes.length}
            </span>
          )}
        </button>
        <button onClick={() => setSubTab('edit')}
          className="flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: subTab === 'edit' ? '#F59E0B' : 'transparent', color: subTab === 'edit' ? '#fff' : '#6B7280' }}>
          ✏️ Edit Requests
          {pendingEdits.length > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-xs font-black"
              style={{ background: subTab === 'edit' ? 'rgba(255,255,255,0.25)' : '#FEF3C7', color: subTab === 'edit' ? '#fff' : '#D97706' }}>
              {pendingEdits.length}
            </span>
          )}
        </button>
      </div>

      {/* ── DELETE TAB ───────────────────────────────────────────────────────── */}
      {subTab === 'delete' && (
        pendingDeletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="font-bold text-gray-700 text-base">No Pending Deletions</p>
            <p className="text-gray-400 text-sm mt-1">All clear — nothing awaiting approval.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FEF2F2,#FFF1F2)', border: '1px solid #FECACA' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-rose-700">Pending Approval</p>
                  <p className="text-3xl font-black text-rose-800 mt-0.5">{pendingDeletes.length}</p>
                  <p className="text-xs text-rose-500 mt-0.5">{pendingDeletes.length === 1 ? 'entry' : 'entries'} marked for deletion</p>
                </div>
                <span className="text-5xl">🗑️</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={allDelSelected} onChange={toggleDelAll} className="w-4 h-4 accent-rose-500 cursor-pointer" />
                <span className="text-xs font-semibold text-gray-600">Select All</span>
                {delSelectedIds.size > 0 && <span className="text-xs text-gray-400">({delSelectedIds.size} selected)</span>}
              </label>
              {delSelectedIds.size > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => setDelConfirm('recover')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#10B981' }}>↩ Restore ({delSelectedIds.size})</button>
                  <button onClick={() => setDelConfirm('approve')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#EF4444' }}>
                    <Trash2 size={11} /> Delete Forever ({delSelectedIds.size})
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {groupedDeletes.map(([date, txns]) => {
                const today = new Date().toISOString().slice(0, 10)
                const allDateSel = txns.every(t => delSelectedIds.has(t.id))
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={allDateSel} className="w-4 h-4 accent-rose-400 cursor-pointer"
                        onChange={() => setDelSelectedIds(prev => {
                          const next = new Set(prev)
                          if (allDateSel) txns.forEach(t => next.delete(t.id))
                          else txns.forEach(t => next.add(t.id))
                          return next
                        })} />
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                        Requested: {date === today ? 'Today' : date}
                      </p>
                      <div className="flex-1 h-px bg-rose-100" />
                      <span className="text-xs text-rose-400 font-medium">{txns.length} item{txns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {txns.map(t => {
                        const inflow    = isInflow(t.type)
                        const isSel     = delSelectedIds.has(t.id)
                        const partner   = t.ownerId   ? owners.find(o => o.id === t.ownerId)
                                        : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
                        return (
                          <div key={t.id} className="bg-white rounded-xl px-3 py-2.5 border flex items-center gap-2.5"
                            style={{ borderColor: isSel ? '#F87171' : '#FEE2E2', background: isSel ? '#FFF5F5' : '#fff' }}>
                            <input type="checkbox" checked={isSel} onChange={() => toggleDelOne(t.id)}
                              className="w-4 h-4 flex-shrink-0 accent-rose-500 cursor-pointer" />
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
                              <span style={{ fontSize: 16 }}>🗑️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-500 truncate text-xs line-through">{t.description || t.type?.replace(/_/g, ' ')}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-gray-400" style={{ fontSize: 9 }}>{formatDate(t.date)}</span>
                                {t.category && (
                                  <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 9 }}>
                                    {t.category.replace(/_/g, ' ')}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: inflow ? '#ECFDF5' : '#FFF1F2', color: inflow ? '#059669' : '#E11D48', fontSize: 9 }}>
                                  {inflow ? 'Credit' : 'Debit'}
                                </span>
                                {partner && (
                                  <span className="px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ background: `${partner.color || '#3B82F6'}18`, color: partner.color || '#3B82F6', fontSize: 9 }}>
                                    {partner.name.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                              <p className="font-bold text-sm opacity-60" style={{ color: inflow ? '#059669' : '#E11D48' }}>
                                {inflow ? '+' : '-'}{formatCurrency(t.amount, cur)}
                              </p>
                              <div className="flex gap-1">
                                <button onClick={() => recoverTransaction(t.id)} className="px-2 py-1 rounded-lg font-bold text-white" style={{ background: '#10B981', fontSize: 10 }}>↩ Restore</button>
                                <button onClick={() => approveDelete(t.id)} className="px-2 py-1 rounded-lg font-bold text-white" style={{ background: '#EF4444', fontSize: 10 }}>✓ Delete</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {delConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: delConfirm === 'approve' ? '#FEF2F2' : '#ECFDF5' }}>
                    {delConfirm === 'approve' ? <Trash2 size={22} color="#EF4444" /> : <span className="text-2xl">↩</span>}
                  </div>
                  <p className="font-bold text-gray-900 text-lg mb-1">
                    {delConfirm === 'approve'
                      ? `Permanently Delete ${delSelectedIds.size} ${delSelectedIds.size === 1 ? 'Entry' : 'Entries'}?`
                      : `Restore ${delSelectedIds.size} ${delSelectedIds.size === 1 ? 'Entry' : 'Entries'}?`}
                  </p>
                  <p className="text-gray-500 text-sm mb-5">
                    {delConfirm === 'approve'
                      ? 'This cannot be undone. Selected entries will be permanently removed.'
                      : 'Selected entries will be restored to the active ledger immediately.'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setDelConfirm(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
                    <button onClick={() => execDelAction(delConfirm)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                      style={{ background: delConfirm === 'approve' ? '#EF4444' : '#10B981' }}>
                      {delConfirm === 'approve' ? 'Delete Forever' : 'Restore to Ledger'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* ── EDIT TAB ─────────────────────────────────────────────────────────── */}
      {subTab === 'edit' && (
        pendingEdits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="font-bold text-gray-700 text-base">No Pending Edits</p>
            <p className="text-gray-400 text-sm mt-1">All clear — no changes awaiting review.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FEF3C7,#FFFBEB)', border: '1px solid #FDE68A' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Edit Review</p>
                  <p className="text-3xl font-black text-amber-800 mt-0.5">{pendingEdits.length}</p>
                  <p className="text-xs text-amber-600 mt-0.5">{pendingEdits.length === 1 ? 'edit request' : 'edit requests'} pending approval</p>
                </div>
                <span className="text-5xl">✏️</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={allEditSelected} onChange={toggleEditAll} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                <span className="text-xs font-semibold text-gray-600">Select All</span>
                {editSelectedIds.size > 0 && <span className="text-xs text-gray-400">({editSelectedIds.size} selected)</span>}
              </label>
              {editSelectedIds.size > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => setEditConfirm('reject')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#6B7280' }}>
                    ✗ Reject ({editSelectedIds.size})
                  </button>
                  <button onClick={() => setEditConfirm('approve')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#10B981' }}>
                    ✓ Approve ({editSelectedIds.size})
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {groupedEdits.map(([date, txns]) => {
                const today = new Date().toISOString().slice(0, 10)
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Requested: {date === today ? 'Today' : date}</p>
                      <div className="flex-1 h-px bg-amber-100" />
                      <span className="text-xs text-amber-500 font-medium">{txns.length} item{txns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-3">
                      {txns.map(t => {
                        const pe  = t.pendingEdit || {}
                        const isSel = editSelectedIds.has(t.id)
                        return (
                          <div key={t.id} className="bg-white rounded-2xl border overflow-hidden"
                            style={{ borderColor: isSel ? '#F59E0B' : '#FDE68A' }}>
                            {/* Card header */}
                            <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: isSel ? '#FFFBEB' : '#FFFDF0' }}>
                              <input type="checkbox" checked={isSel} onChange={() => toggleEditOne(t.id)} className="w-4 h-4 flex-shrink-0 accent-amber-500 cursor-pointer" />
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
                                <span style={{ fontSize: 14 }}>✏️</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-xs truncate">{t.description || pe.description || '—'}</p>
                                <p className="text-amber-600 font-semibold" style={{ fontSize: 9 }}>
                                  {t.type?.replace(/_/g, ' ')} · {(pe.requestedAt || '').slice(0, 16).replace('T', ' ')}
                                </p>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button onClick={() => rejectEdit(t.id)} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: '#6B7280', fontSize: 10 }}>✗ Reject</button>
                                <button onClick={() => approveEdit(t.id, pe)} className="px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: '#10B981', fontSize: 10 }}>✓ Approve</button>
                              </div>
                            </div>
                            {/* Old vs New grid */}
                            <div className="grid grid-cols-2 divide-x divide-gray-100">
                              <div className="p-3" style={{ background: '#FFF1F2' }}>
                                <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-2">Old Data</p>
                                {EDIT_FIELDS.map(({ key, label, fmt }) => {
                                  const oldV = t[key]; const newV = pe[key]
                                  if (oldV === undefined && newV === undefined) return null
                                  const changed = newV !== undefined && String(oldV) !== String(newV)
                                  return (
                                    <div key={key} className="mb-1.5">
                                      <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 8 }}>{label}</p>
                                      <p className={`text-xs font-semibold ${changed ? 'text-rose-700 line-through' : 'text-gray-700'}`}>
                                        {oldV !== undefined ? (fmt ? fmt(oldV) : String(oldV)) : '—'}
                                      </p>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="p-3" style={{ background: '#ECFDF5' }}>
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">New Data</p>
                                {EDIT_FIELDS.map(({ key, label, fmt }) => {
                                  const oldV = t[key]; const newV = pe[key]
                                  if (newV === undefined) return null
                                  const changed = String(oldV) !== String(newV)
                                  return (
                                    <div key={key} className="mb-1.5">
                                      <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: 8 }}>{label}</p>
                                      <p className={`text-xs font-semibold ${changed ? 'text-emerald-700 font-black' : 'text-gray-700'}`}>
                                        {fmt ? fmt(newV) : String(newV)}
                                        {changed && <span className="ml-1 text-emerald-400" style={{ fontSize: 9 }}>← changed</span>}
                                      </p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {editConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: editConfirm === 'approve' ? '#ECFDF5' : '#F3F4F6' }}>
                    <span className="text-2xl">{editConfirm === 'approve' ? '✓' : '✗'}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-lg mb-1">
                    {editConfirm === 'approve'
                      ? `Approve ${editSelectedIds.size} Edit ${editSelectedIds.size === 1 ? 'Request' : 'Requests'}?`
                      : `Reject ${editSelectedIds.size} Edit ${editSelectedIds.size === 1 ? 'Request' : 'Requests'}?`}
                  </p>
                  <p className="text-gray-500 text-sm mb-5">
                    {editConfirm === 'approve'
                      ? 'New data will overwrite the originals in the ledger.'
                      : 'Edit requests will be discarded. Original entries remain unchanged.'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setEditConfirm(null)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
                    <button onClick={() => execEditAction(editConfirm)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                      style={{ background: editConfirm === 'approve' ? '#10B981' : '#6B7280' }}>
                      {editConfirm === 'approve' ? 'Approve All' : 'Reject All'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
function MainApp() {
  const { transactions, owners, employees = [], settings, getCompanyBalance, getOwnerBalance, deleteTransaction, getMunimBalance, customCategories = [] } = useApp()

  const [tab, setTab]               = useState('ALL')
  const [search, setSearch]         = useState('')
  const [monthFilter, setMonthFilter] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editData, setEditData]     = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [showMobileReport, setShowMobileReport] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmBulkDel, setConfirmBulkDel] = useState(false)
  const [selectedPartner, setSelectedPartner]   = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [fromDate, setFromDate]     = useState(todayISO())
  const [toDate, setToDate]         = useState(todayISO())
  const [appliedFrom, setAppliedFrom] = useState(null)
  const [appliedTo, setAppliedTo]   = useState(null)
  const [mobileForm, setMobileForm] = useState('simple')

  const isCashTxn = (t) => !t.paymentMode || t.paymentMode === 'CASH'

  const cashInHand = useMemo(() =>
    transactions.reduce((sum, t) => {
      if (!isCashTxn(t)) return sum
      if (t.type === TRANSACTION_TYPES.CASH_IN || t.type === TRANSACTION_TYPES.OWNER_DEPOSIT || t.type === TRANSACTION_TYPES.ADVANCE_RETURN) return sum + t.amount
      if (t.type === TRANSACTION_TYPES.EXPENSE  || t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL || t.type === TRANSACTION_TYPES.ADVANCE_OUT) return sum - t.amount
      // ADVANCE_EXPENSE does not touch Main Cash (deducted from Munim account)
      return sum
    }, 0),
    [transactions]
  )

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
      todayIn:  t2.filter(t => (t.type === TRANSACTION_TYPES.CASH_IN || t.type === TRANSACTION_TYPES.OWNER_DEPOSIT || t.type === TRANSACTION_TYPES.ADVANCE_RETURN) && isCashTxn(t)).reduce((s, t) => s + t.amount, 0),
      todayOut: t2.filter(t => (t.type === TRANSACTION_TYPES.EXPENSE  || t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL || t.type === TRANSACTION_TYPES.ADVANCE_OUT) && isCashTxn(t)).reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions])

  const { monthIn, monthOut } = useMemo(() => {
    if (!monthFilter) return { monthIn: 0, monthOut: 0 }
    const m = transactions.filter(t => t.date.startsWith(monthFilter))
    return {
      monthIn:  m.filter(t => (t.type === TRANSACTION_TYPES.CASH_IN || t.type === TRANSACTION_TYPES.OWNER_DEPOSIT) && isCashTxn(t)).reduce((s, t) => s + t.amount, 0),
      monthOut: m.filter(t => (t.type === TRANSACTION_TYPES.EXPENSE  || t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL) && isCashTxn(t)).reduce((s, t) => s + t.amount, 0),
    }
  }, [transactions, monthFilter])

  // Dynamic category maps/sets that update when custom categories are added
  // Declared before `filtered` so they are available in its deps array and callback
  const catColorMap = useMemo(() => ({
    ...CAT_COLOR,
    ...Object.fromEntries(customCategories.map(c => [c.value, c.color])),
  }), [customCategories])

  const categoryTabsSet = useMemo(() => new Set([
    ...CATEGORY_TABS,
    ...customCategories.filter(c => c.type === 'EXPENSE').map(c => c.value),
  ]), [customCategories])

  const incomeCategoryTabsSet = useMemo(() => new Set([
    ...INCOME_CATEGORY_TABS,
    ...customCategories.filter(c => c.type === 'INCOME').map(c => c.value),
  ]), [customCategories])

  const navExpense = useMemo(() => [
    ...NAV_EXPENSE,
    ...customCategories.filter(c => c.type === 'EXPENSE').map(c => ({ key: c.value, label: c.label, icon: Package })),
    ...customCategories.filter(c => c.type === 'INCOME').map(c => ({ key: c.value, label: c.label, icon: TrendingUp })),
  ], [customCategories])

  const getLabel = (cat) => getCategoryLabel(cat, customCategories)

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (appliedFrom) {
        if (t.date < appliedFrom || t.date > appliedTo) return false
      } else if (monthFilter && !t.date.startsWith(monthFilter)) return false
      if (tab === 'IN')    { if (t.type !== TRANSACTION_TYPES.CASH_IN && t.type !== TRANSACTION_TYPES.OWNER_DEPOSIT) return false }
      else if (tab === 'OUT')   { if (t.type !== TRANSACTION_TYPES.EXPENSE) return false }
      else if (tab === 'OWNER') {
        const isP = t.type === TRANSACTION_TYPES.OWNER_DEPOSIT || t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL
        const isL = (t.partnerId || t.ownerId) && (t.type === TRANSACTION_TYPES.CASH_IN || t.type === TRANSACTION_TYPES.EXPENSE)
        if (!isP && !isL) return false
      }
      else if (categoryTabsSet.has(tab)) {
        if (tab === 'BANK') {
          if (!isBankTxn(t)) return false
        } else {
          const byCategory = t.type === TRANSACTION_TYPES.EXPENSE && t.category === tab
          const byLink = hasLinked(t, tab)
          if (!byCategory && !byLink) return false
        }
      }
      else if (incomeCategoryTabsSet.has(tab)) {
        const byCategory = t.type === TRANSACTION_TYPES.CASH_IN && t.category === tab
        const byLink = hasLinked(t, tab)
        if (!byCategory && !byLink) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        return t.description?.toLowerCase().includes(q) || getCategoryLabel(t.category, customCategories)?.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))
  }, [transactions, tab, search, monthFilter, appliedFrom, appliedTo, categoryTabsSet, incomeCategoryTabsSet, customCategories])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(t => { if (!map[t.date]) map[t.date] = []; map[t.date].push(t) })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  // Bank statement: running balance over all bank transactions (unfiltered, for the banner)
  const bankBalance = useMemo(() =>
    transactions.filter(isBankTxn).reduce((s, t) => s + (isInflow(t.type) ? t.amount : -t.amount), 0),
    [transactions]
  )
  // Bank statement rows: filtered bank transactions with per-row running balance
  const bankStatement = useMemo(() =>
    tab === 'BANK' ? computeRunningBalance(filtered) : [],
    [filtered, tab]
  )

  const switchTab = (key) => { setTab(key); setSearch(''); setSelectedIds(new Set()) }

  const handleFilterApply = () => {
    setAppliedFrom(fromDate)
    setAppliedTo(toDate)
    setMonthFilter(null)
  }
  const handleFilterReset = () => {
    setAppliedFrom(null)
    setAppliedTo(null)
    setFromDate(todayISO())
    setToDate(todayISO())
  }

  const buildReportHTML = () => {
    const allNav = [...NAV_MAIN, ...navExpense]
    const periodLabel = appliedFrom
      ? `${appliedFrom} to ${appliedTo}`
      : monthFilter
        ? format(new Date(monthFilter + '-01'), 'MMMM yyyy')
        : allNav.find(n => n.key === tab)?.label || 'All Transactions'
    const totalIn  = filtered.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0)
    const totalOut = filtered.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0)
    const rows = [...filtered].sort((a, b) => a.date.localeCompare(b.date)).map(t => {
      const partner = t.ownerId ? owners.find(o => o.id === t.ownerId)
                    : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
      const inflow = isInflow(t.type)
      return `<tr><td>${formatDate(t.date)}</td><td>${t.description||''}</td><td>${getLabel(t.category)||''}</td><td>${partner?.name||''}</td>
        <td style="color:#10B981;text-align:right">${inflow?'₹'+t.amount.toLocaleString('en-IN'):''}</td>
        <td style="color:#F43F5E;text-align:right">${!inflow?'₹'+t.amount.toLocaleString('en-IN'):''}</td></tr>`
    }).join('')
    return `<!DOCTYPE html><html><head><title>${settings.companyName||'KRM Ledger'}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}h2{margin:0 0 4px}
    .s{display:flex;gap:16px;margin:16px 0}.b{padding:12px 20px;border-radius:8px}
    table{width:100%;border-collapse:collapse}th{background:#1E293B;color:#fff;padding:8px;text-align:left;font-size:11px;text-transform:uppercase}
    td{padding:7px 8px;border-bottom:1px solid #E2E8F0}tr:nth-child(even) td{background:#F8FAFC}</style></head><body>
    <h2>${settings.companyName||'KRM Rice Mill'}</h2><p style="color:#64748B;margin:0 0 16px">${periodLabel} — ${format(new Date(),'dd/MM/yyyy')}</p>
    <div class="s">
      <div class="b" style="background:#ECFDF5"><div style="font-size:10px;color:#059669;font-weight:bold">CREDIT</div><div style="font-size:18px;font-weight:bold;color:#10B981">₹${totalIn.toLocaleString('en-IN')}</div></div>
      <div class="b" style="background:#FFF1F2"><div style="font-size:10px;color:#E11D48;font-weight:bold">DEBIT</div><div style="font-size:18px;font-weight:bold;color:#F43F5E">₹${totalOut.toLocaleString('en-IN')}</div></div>
      <div class="b" style="background:#EFF6FF"><div style="font-size:10px;color:#2563EB;font-weight:bold">NET</div><div style="font-size:18px;font-weight:bold;color:#3B82F6">₹${(totalIn-totalOut).toLocaleString('en-IN')}</div></div>
    </div>
    <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Partner</th><th style="text-align:right">Credit</th><th style="text-align:right">Debit</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(buildReportHTML())
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
  }

  const handlePDF = () => {
    const win = window.open('', '_blank')
    win.document.write(buildReportHTML())
    win.document.close(); win.focus()
  }

  const handleDayPrint = (date, txns) => {
    const totalIn  = txns.filter(t => t.type === TRANSACTION_TYPES.CASH_IN).reduce((s, t) => s + t.amount, 0)
    const totalOut = txns.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((s, t) => s + t.amount, 0)
    const rows = [...txns].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(t => {
      const partner = t.ownerId ? owners.find(o => o.id === t.ownerId)
                    : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
      const inf = isInflow(t.type)
      return `<tr><td>${t.description||''}</td><td>${getLabel(t.category)||''}</td><td>${partner?.name||''}</td>
        <td style="color:#10B981;text-align:right">${inf?'₹'+t.amount.toLocaleString('en-IN'):''}</td>
        <td style="color:#F43F5E;text-align:right">${!inf?'₹'+t.amount.toLocaleString('en-IN'):''}</td></tr>`
    }).join('')
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>KRM Ledger - ${date}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px}h2{margin:0 0 4px}
    .s{display:flex;gap:16px;margin:12px 0}.b{padding:10px 16px;border-radius:8px}
    table{width:100%;border-collapse:collapse}th{background:#1E293B;color:#fff;padding:8px;text-align:left;font-size:11px;text-transform:uppercase}
    td{padding:7px 8px;border-bottom:1px solid #E2E8F0}tr:nth-child(even) td{background:#F8FAFC}</style></head><body>
    <h2>${settings.companyName||'KRM Rice Mill'} — ${format(new Date(date),'dd/MM/yyyy')}</h2>
    <div class="s">
      <div class="b" style="background:#ECFDF5"><div style="font-size:10px;color:#059669;font-weight:bold">CREDIT</div><div style="font-size:18px;font-weight:bold;color:#10B981">₹${totalIn.toLocaleString('en-IN')}</div></div>
      <div class="b" style="background:#FFF1F2"><div style="font-size:10px;color:#E11D48;font-weight:bold">DEBIT</div><div style="font-size:18px;font-weight:bold;color:#F43F5E">₹${totalOut.toLocaleString('en-IN')}</div></div>
      <div class="b" style="background:#EFF6FF"><div style="font-size:10px;color:#2563EB;font-weight:bold">NET</div><div style="font-size:18px;font-weight:bold;color:#3B82F6">₹${(totalIn-totalOut).toLocaleString('en-IN')}</div></div>
    </div>
    <table><thead><tr><th>Description</th><th>Category</th><th>Partner</th><th style="text-align:right">Credit</th><th style="text-align:right">Debit</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
  }

  const isDepoTab   = tab === 'DEPO_ADVANCE' || tab === 'DEPO_SETTLE'
  const isAdminTab  = tab === 'DELETE_APPROVALS'
  const activeLabel = [...NAV_MAIN, ...navExpense, ...NAV_DEPO, ...NAV_ADMIN].find(n => n.key === tab)?.label

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>

      {/* ── ALWAYS-VISIBLE SIDEBAR ───────────────────────────────────────── */}
      <Sidebar activeTab={tab} onTabChange={switchTab} companyName={settings.companyName} navExpense={navExpense} catColorMap={catColorMap} />

      {/* ── RIGHT REPORT PANEL ───────────────────────────────────────────── */}
      <ReportPanel
        owners={owners}
        transactions={transactions}
        settings={settings}
        onPartnerClick={setSelectedPartner}
      />

      {/* ── MAIN CONTENT (between both sidebars) ────────────────────────── */}
      <div className="md:ml-[200px] md:mr-[200px]">

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20" style={{ background: '#1B5C20' }}>
          <div className="flex items-center justify-center px-12 py-3 text-center" style={{ minHeight: 54 }}>
            <span className="text-white font-bold uppercase tracking-widest text-sm leading-snug">
              {settings.companyName || 'KRM Rice Mill'}
            </span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button onClick={() => setShowMobileReport(true)}
                className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <span className="text-white font-bold text-xs">R</span>
              </button>
              <button onClick={() => setShowSettings(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Settings size={14} color="rgba(255,255,255,0.85)" />
              </button>
            </div>
          </div>
          {/* Mobile-only horizontal tab scroll */}
          <div className="flex md:hidden overflow-x-auto gap-1.5 px-3 pb-2 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}>
            {[...NAV_MAIN, ...navExpense, ...NAV_DEPO, ...NAV_ADMIN].map(item => {
              const active = tab === item.key
              const color = catColorMap[item.key] || '#818CF8'
              return (
                <button key={item.key} onClick={() => switchTab(item.key)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={active
                    ? { background: '#fff', color: '#1B5C20' }
                    : { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }
                  }>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── ADMIN VIEW ────────────────────────────────────────────────── */}
        {isAdminTab && <DeleteApprovalsView settings={settings} />}

        {/* ── DEPO VIEW ─────────────────────────────────────────────────── */}
        {isDepoTab && <DepoView mode={tab === 'DEPO_ADVANCE' ? 'advance' : 'settle'} transactions={transactions} settings={settings} />}

        {/* ── CASH IN HAND BANNER ───────────────────────────────────────── */}
        {tab !== 'STAFF' && !isDepoTab && !isAdminTab && (
          <div className="mx-3 mt-3 rounded-lg px-3 py-2.5 flex items-center justify-between"
            style={{ background: '#1B5C20' }}>
            <div>
              <p className="text-white/60 uppercase tracking-widest font-bold" style={{ fontSize: 10 }}>
                {tab === 'BANK' ? 'Bank Balance' : monthFilter ? format(new Date(monthFilter+'-01'), 'MMMM yyyy') : 'Cash in Hand'}
              </p>
              <p className="font-bold text-yellow-400" style={{ fontSize: 22, lineHeight: 1.15 }}>
                {formatCurrency(tab === 'BANK' ? bankBalance : cashInHand, settings.currency)}
              </p>
            </div>
            <div className="text-right text-white/50 text-xs">
              {tab === 'BANK' ? (
                <>
                  <div>Total In ↑ <span className="text-emerald-400 font-bold">{formatCurrency(bankStatement.reduce((s,t)=>isInflow(t.type)?s+t.amount:s,0), settings.currency)}</span></div>
                  <div>Total Out ↓ <span className="text-rose-400 font-bold">{formatCurrency(bankStatement.reduce((s,t)=>!isInflow(t.type)?s+t.amount:s,0), settings.currency)}</span></div>
                </>
              ) : (
                <>
                  <div>Today ↑ <span className="text-emerald-400 font-bold">{formatCurrency(todayIn, settings.currency)}</span></div>
                  <div>Today ↓ <span className="text-rose-400 font-bold">{formatCurrency(todayOut, settings.currency)}</span></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── ENTRY FORMS (tab-switch on mobile, side-by-side on desktop) ── */}
        {tab !== 'STAFF' && !isDepoTab && !isAdminTab && (
          <div className="mx-3 mt-2 mb-3">
            {/* Mobile form tab switcher */}
            <div className="flex md:hidden gap-1.5 mb-2">
              {[{ key: 'simple', label: '💵 Simple' }, { key: 'partner', label: '⚡ Partner' }].map(f => (
                <button key={f.key} type="button" onClick={() => setMobileForm(f.key)}
                  className="flex-1 py-1.5 rounded text-xs font-bold transition-all"
                  style={mobileForm === f.key
                    ? { background: f.key === 'simple' ? '#16A34A' : '#7C3AED', color: '#fff' }
                    : { background: '#E2E8F0', color: '#64748B' }}>
                  {f.label}
                </button>
              ))}
            </div>
            {/* Forms grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:items-stretch">
              <div className={mobileForm === 'simple' ? 'block' : 'hidden md:block'}>
                <InlineAddForm
                  key={tab}
                  defaultCategory={categoryTabsSet.has(tab) || incomeCategoryTabsSet.has(tab) ? tab : ''}
                  currentTab={tab}
                />
              </div>
              <div className={mobileForm === 'partner' ? 'block' : 'hidden md:block'}>
                <AdvancePaymentForm key={`adv-${tab}`} />
              </div>
            </div>
          </div>
        )}

        {/* ── STAFF VIEW ────────────────────────────────────────────────── */}
        {tab === 'STAFF' && (
          <StaffView
            employees={employees}
            transactions={transactions}
            settings={settings}
            onEmployeeClick={setSelectedEmployee}
          />
        )}

        {/* ── SEARCH + DATE FILTER + PDF/PRINT ─────────────────────────── */}
        {tab !== 'STAFF' && !isDepoTab && !isAdminTab && (<><div className="px-3 pt-2 pb-1">
          {/* Section label */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded" style={{ background: catColorMap[tab] || '#1B5C20' }} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{activeLabel}</span>
            {appliedFrom && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold ml-auto"
                style={{ background: '#DCFCE7', color: '#166534' }}>
                {appliedFrom} – {appliedTo}
              </span>
            )}
            {!appliedFrom && monthFilter && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold ml-auto"
                style={{ background: '#FEF3C7', color: '#92400E' }}>
                {format(new Date(monthFilter+'-01'), 'MMM yyyy')}
              </span>
            )}
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2.5">
            {/* Row 1: Search (full-width) + action buttons below on mobile */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search description..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <XIcon size={13} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handlePDF}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-bold text-white"
                  style={{ background: '#DC2626' }}>
                  <FileText size={13} /> PDF
                </button>
                <button onClick={handlePrint}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-bold text-white"
                  style={{ background: '#3B82F6' }}>
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            {/* Row 2: Date range filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700" />
              <span className="text-xs text-gray-400 font-medium">to</span>
              <DateInput value={toDate} onChange={e => setToDate(e.target.value)}
                className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700" />
              <button onClick={handleFilterApply}
                className="px-4 py-1.5 rounded text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: '#1B5C20' }}>
                Filter
              </button>
              <button onClick={handleFilterReset}
                className="px-2 py-1.5 text-xs font-bold transition-all"
                style={{ color: '#1B5C20' }}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── MONTH FILTER ──────────────────────────────────────────────── */}
        {availableMonths.length > 0 && (
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-thin">
            <button onClick={() => { setMonthFilter(null); handleFilterReset() }}
              className="flex-shrink-0 px-2.5 py-1 rounded text-xs font-semibold transition-all"
              style={!monthFilter && !appliedFrom
                ? { background: '#1B5C20', color: '#fff' }
                : { background: '#E2E8F0', color: '#64748B' }}>
              All
            </button>
            {availableMonths.map(m => (
              <button key={m.key} onClick={() => { setMonthFilter(monthFilter === m.key ? null : m.key); setAppliedFrom(null); setAppliedTo(null) }}
                className="flex-shrink-0 px-2.5 py-1 rounded text-xs font-semibold transition-all"
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
          <div className="grid grid-cols-3 gap-2 px-3 pb-2 md:flex md:gap-2.5 md:overflow-x-auto md:scrollbar-thin">
            {owners.map((owner, i) => {
              const bal = getOwnerBalance(owner.id)
              const color = owner.color || OWNER_COLORS[i]
              return (
                <div key={owner.id} onClick={() => setSelectedPartner(owner)}
                  className="rounded-xl p-2.5 text-white cursor-pointer active:scale-95 transition-transform md:flex-shrink-0 md:min-w-[130px]"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}BB)` }}>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs mb-1.5">
                    {owner.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-xs text-white/90 truncate">{owner.name.split(' ')[0]}</p>
                  <p className="font-bold text-sm mt-0.5">{formatCurrency(Math.abs(bal), settings.currency)}</p>
                  <p className="text-white/40 text-xs mt-0.5 hidden md:block">Tap for details</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ── BANK STATEMENT TABLE ──────────────────────────────────────── */}
        {tab === 'BANK' && (
          <div className="px-3 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
            {bankStatement.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                  <span className="text-2xl">🏦</span>
                </div>
                <p className="text-gray-500 font-semibold text-sm">No bank transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                <table className="w-full border-collapse" style={{ fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1E293B', color: '#fff' }}>
                      <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ fontSize: 11 }}>Date</th>
                      <th className="px-3 py-2.5 text-left font-semibold" style={{ fontSize: 11 }}>Description</th>
                      <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap" style={{ fontSize: 11, color: '#6EE7B7' }}>Credit (+)</th>
                      <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap" style={{ fontSize: 11, color: '#FCA5A5' }}>Debit (−)</th>
                      <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap" style={{ fontSize: 11, color: '#FCD34D' }}>Balance</th>
                      <th className="px-3 py-2.5" style={{ fontSize: 11, width: 56 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankStatement.map((t, idx) => {
                      const inflow  = isInflow(t.type)
                      const partner = t.ownerId   ? owners.find(o => o.id === t.ownerId)
                                    : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
                      const isEven  = idx % 2 === 0
                      return (
                        <tr key={t.id} style={{ background: isEven ? '#fff' : '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                          <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap" style={{ fontSize: 11 }}>
                            {formatDate(t.date)}
                          </td>
                          <td className="px-3 py-2.5" style={{ maxWidth: 200 }}>
                            <p className="font-semibold text-gray-900 truncate" style={{ fontSize: 12 }}>{t.description}</p>
                            {(t.category || partner) && (
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {t.category && (
                                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 999, background: `${catColorMap[t.category]||'#94A3B8'}18`, color: catColorMap[t.category]||'#94A3B8' }}>
                                    {getLabel(t.category)}
                                  </span>
                                )}
                                {partner && (
                                  <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 999, background: `${partner.color||'#3B82F6'}15`, color: partner.color||'#3B82F6' }}>
                                    {partner.name.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: '#059669', fontSize: 12 }}>
                            {inflow ? formatCurrency(t.amount, settings.currency) : ''}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: '#E11D48', fontSize: 12 }}>
                            {!inflow ? formatCurrency(t.amount, settings.currency) : ''}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap" style={{ color: t.runningBalance >= 0 ? '#1E293B' : '#DC2626', fontSize: 12 }}>
                            {formatCurrency(t.runningBalance, settings.currency)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => { setEditData(t); setShowEditForm(true) }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                <Pencil size={10} />
                              </button>
                              <button onClick={() => setConfirmDel(t.id)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {/* Closing balance row */}
                    <tr style={{ background: '#1E293B', color: '#fff' }}>
                      <td colSpan={2} className="px-3 py-2.5 font-bold" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Closing Balance
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold" style={{ color: '#6EE7B7', fontSize: 12 }}>
                        {formatCurrency(bankStatement.reduce((s,t)=>isInflow(t.type)?s+t.amount:s,0), settings.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold" style={{ color: '#FCA5A5', fontSize: 12 }}>
                        {formatCurrency(bankStatement.reduce((s,t)=>!isInflow(t.type)?s+t.amount:s,0), settings.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold" style={{ color: '#FCD34D', fontSize: 13 }}>
                        {bankStatement.length > 0 ? formatCurrency(bankStatement[0].runningBalance, settings.currency) : '—'}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTION LIST ──────────────────────────────────────────── */}
        {tab !== 'BANK' && <div className="px-3 pb-6 space-y-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          {grouped.length > 0 && (
            <div className="flex items-center justify-between py-1.5 px-1 border-b border-gray-200 mb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                  checked={filtered.length > 0 && filtered.every(t => selectedIds.has(t.id))}
                  onChange={() => {
                    if (filtered.every(t => selectedIds.has(t.id))) setSelectedIds(new Set())
                    else setSelectedIds(new Set(filtered.map(t => t.id)))
                  }}
                />
                <span className="text-xs font-semibold text-gray-500">Select All</span>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-gray-400">({selectedIds.size} selected)</span>
                )}
              </label>
              {selectedIds.size > 0 && (
                <button onClick={() => setConfirmBulkDel(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform"
                  style={{ background: '#F43F5E' }}>
                  <Trash2 size={11} /> Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}
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
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-rose-500 cursor-pointer flex-shrink-0"
                  checked={txns.length > 0 && txns.every(t => selectedIds.has(t.id))}
                  title={`Select all entries for ${dayLabel(date)}`}
                  onChange={() => {
                    const allSelected = txns.every(t => selectedIds.has(t.id))
                    setSelectedIds(prev => {
                      const next = new Set(prev)
                      if (allSelected) txns.forEach(t => next.delete(t.id))
                      else txns.forEach(t => next.add(t.id))
                      return next
                    })
                  }}
                />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dayLabel(date)}</p>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: txns.reduce((s,t) => s+(isInflow(t.type)?t.amount:-t.amount),0) >= 0 ? '#ECFDF5' : '#FFF1F2',
                    color:      txns.reduce((s,t) => s+(isInflow(t.type)?t.amount:-t.amount),0) >= 0 ? '#059669' : '#E11D48',
                  }}>
                  {formatCurrency(txns.reduce((s,t) => s+(isInflow(t.type)?t.amount:-t.amount),0), settings.currency)}
                </span>
                <button onClick={() => handleDayPrint(date, txns)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                  title="Print this day">
                  <Printer size={11} />
                </button>
              </div>

              <div className="space-y-1.5">
                {txns.map(t => {
                  const inflow   = isInflow(t.type) || t.type === TRANSACTION_TYPES.ADVANCE_RETURN
                  const isTransfer = t.type === TRANSACTION_TYPES.ADVANCE_OUT || t.type === TRANSACTION_TYPES.ADVANCE_RETURN
                  const partner  = t.ownerId   ? owners.find(o => o.id === t.ownerId)
                                 : t.partnerId ? owners.find(o => o.id === t.partnerId) : null
                  const catColor = catColorMap[t.category] || catColorMap[t.type] || (inflow ? '#10B981' : '#F43F5E')
                  return (
                    <div key={t.id}
                      className="bg-white rounded-xl px-3 py-2.5 shadow-sm border flex items-center gap-2.5 transition-all"
                      style={{ borderColor: selectedIds.has(t.id) ? '#F43F5E' : '#F1F5F9', background: selectedIds.has(t.id) ? '#FFF8F8' : '#fff' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => setSelectedIds(prev => {
                          const next = new Set(prev)
                          next.has(t.id) ? next.delete(t.id) : next.add(t.id)
                          return next
                        })}
                        className="w-4 h-4 flex-shrink-0 accent-rose-500 cursor-pointer"
                      />
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
                          {isTransfer && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#FEF3C7', color: '#92400E', fontSize: 9 }}>
                              🏭 Depo Transfer
                            </span>
                          )}
                          {t.category && !isTransfer && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${catColor}18`, color: catColor, fontSize: 9 }}>
                              {getLabel(t.category)}
                            </span>
                          )}
                          {t.type === TRANSACTION_TYPES.ADVANCE_EXPENSE && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 9 }}>
                              🏭 {getLabel(t.category)}
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
        </div>}</>)}

      </div>

      {/* ── MOBILE REPORT DRAWER ────────────────────────────────────────── */}
      {showMobileReport && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileReport(false)} />
          <div className="absolute right-0 top-0 h-full w-72 flex flex-col overflow-hidden"
            style={{ background: '#0F1923' }}>
            <div className="flex items-center justify-between px-4 flex-shrink-0"
              style={{ background: '#1B5C20', minHeight: 54 }}>
              <span className="text-white font-bold text-sm uppercase tracking-widest">Report</span>
              <button onClick={() => setShowMobileReport(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <XIcon size={16} color="#fff" />
              </button>
            </div>
            <ReportPanel isDrawer owners={owners} transactions={transactions} settings={settings}
              onPartnerClick={(p) => { setSelectedPartner(p); setShowMobileReport(false) }} />
          </div>
        </div>
      )}


      {/* ── BULK DELETE CONFIRM ───────────────────────────────────────────── */}
      {confirmBulkDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={22} color="#F43F5E" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">Delete {selectedIds.size} {selectedIds.size === 1 ? 'Entry' : 'Entries'}?</p>
            <p className="text-gray-500 text-sm mb-1">Are you sure you want to delete all {selectedIds.size} selected {selectedIds.size === 1 ? 'entry' : 'entries'}?</p>
            <p className="text-gray-400 text-xs mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulkDel(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button onClick={() => {
                selectedIds.forEach(id => deleteTransaction(id))
                setSelectedIds(new Set()); setConfirmBulkDel(false)
              }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: '#F43F5E' }}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

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

      {selectedEmployee && (
        <EmployeeDetail
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
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
