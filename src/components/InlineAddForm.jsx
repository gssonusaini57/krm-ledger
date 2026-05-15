import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, todayISO } from '../utils/helpers'
import DateInput from './DateInput'
import CategoryModal from './CategoryModal'

const CATEGORY_CHIPS = [
  { value: 'SALARY',       label: 'Salary'     },
  { value: 'LABOUR',       label: 'Labour'     },
  { value: 'BANK',         label: 'Bank'       },
  { value: 'EXPENDITURE',  label: 'Expense'    },
  { value: 'ASHOK_DEPOT',  label: 'Ashok'      },
  { value: 'TRUCK',        label: 'Truck'      },
  { value: 'PANKAJ_PLASH', label: 'Pankaj'     },
  { value: 'AMAN_PLASH',   label: 'Aman'       },
  { value: 'BROKEN_BUY',   label: 'Broken Buy' },
  { value: 'BROKEN_SELL',  label: 'Broken Sell' },
  { value: 'HUSK_SELL',    label: 'Husk Sell'   },
  { value: 'BRAN_SELL',    label: 'Bran Sell'   },
]

function getShortcut(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return parts.map(p => p[0]).join('').toLowerCase()
  return name.slice(0, 2).toLowerCase()
}

export default function InlineAddForm({ defaultCategory = '', currentTab = '' }) {
  const { employees = [], addTransaction, customCategories = [] } = useApp()

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')
  const allEmps      = [...fixedEmps, ...variableEmps]

  const allChips = useMemo(() => [
    ...CATEGORY_CHIPS,
    ...customCategories.map(c => ({ value: c.value, label: c.label })),
  ], [customCategories])

  const [date, setDate]             = useState(todayISO())
  const [amount, setAmount]         = useState('')
  const [description, setDesc]      = useState('')
  const [payMode, setPayMode]       = useState('CASH')
  const [selected, setSelected]     = useState(() => {
    const s = new Set()
    if (defaultCategory) s.add(defaultCategory)
    else if (currentTab) s.add(currentTab)
    return s
  })
  const [employeeId, setEmpId]      = useState('')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [lastAction, setLastAction] = useState('')
  const [showCatModal, setShowCatModal] = useState(false)

  const reset = () => {
    setAmount(''); setDesc(''); setError(''); setEmpId('')
    setPayMode('CASH'); setDate(todayISO())
    const s = new Set()
    if (defaultCategory) s.add(defaultCategory)
    else if (currentTab) s.add(currentTab)
    setSelected(s)
  }

  const toggleCat = (val) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(val) ? next.delete(val) : next.add(val)
      return next
    })

  const fillEmployee = (emp) => {
    const isSalary = emp.type === 'FIXED'
    setDesc(`${isSalary ? 'Salary' : 'Labour'} - ${emp.name}`)
    setEmpId(emp.id)
    setSelected(prev => {
      const next = new Set(prev)
      next.add(isSalary ? 'SALARY' : 'LABOUR')
      return next
    })
  }

  const handleDescChange = (val) => {
    setDesc(val); setEmpId('')
    const typed = val.trim().toLowerCase()
    if (!typed) return
    const match = allEmps.find(e => getShortcut(e.name) === typed)
    if (match) fillEmployee(match)
  }

  const validate = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)    { setError('Enter amount'); return null }
    if (!description.trim()) { setError('Enter description'); return null }
    return amt
  }

  const buildFields = () => {
    const cats = [...selected]
    return { category: cats[0] || '', linkedCategories: cats.length ? cats : null }
  }

  const handleCredit = () => {
    setError('')
    const amt = validate(); if (!amt) return
    const { category, linkedCategories } = buildFields()
    addTransaction({
      date, amount: amt, description, category,
      type: TRANSACTION_TYPES.CASH_IN,
      paymentMode: payMode,
      ownerId: null, partnerId: null, linkedCategories,
    })
    setLastAction('IN'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const handleDebit = () => {
    setError('')
    const amt = validate(); if (!amt) return
    const { category, linkedCategories } = buildFields()
    addTransaction({
      date, amount: amt, description, category,
      type: TRANSACTION_TYPES.EXPENSE,
      paymentMode: payMode,
      ownerId: null, partnerId: null,
      employeeId: employeeId || null, linkedCategories,
    })
    setLastAction('OUT'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const hasSalaryLabour = selected.has('SALARY') || selected.has('LABOUR')
  const shortcutHints   = allEmps.map(e => `${getShortcut(e.name)}=${e.name.split(' ')[0]}`).join(', ')

  return (
    <div className="overflow-hidden shadow border border-gray-200 bg-white rounded-lg flex flex-col md:h-full"
      style={{ borderTop: '4px solid #16A34A' }}>

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0" style={{ background: '#F0FDF4' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#16A34A' }}>💵 Simple Form</p>
        <p className="text-xs text-gray-400">Cash in Hand</p>
      </div>

      <div className="px-3 pt-3 pb-3 flex flex-col flex-1 justify-between gap-3">

        {/* ── Fields ───────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {/* Date + Amount */}
          <div className="flex gap-1.5">
            <DateInput value={date} onChange={e => setDate(e.target.value)}
              className="w-28 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-xs text-gray-700" />
            <input type="number" min="1" placeholder="₹ Amount"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-200" />
          </div>

          {/* Description */}
          <input type="text"
            placeholder={shortcutHints ? `Shortcut: ${shortcutHints}` : 'Description...'}
            value={description} onChange={e => handleDescChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-200" />

          {/* Category chips */}
          <div className="flex flex-wrap gap-1">
            {allChips.map(c => {
              const active = selected.has(c.value)
              return (
                <button key={c.value} type="button" onClick={() => toggleCat(c.value)}
                  className="px-2 py-0.5 rounded text-xs font-semibold border-2 transition-all"
                  style={active
                    ? { borderColor: '#6366F1', background: '#6366F1', color: '#fff' }
                    : { borderColor: '#E2E8F0', background: '#fff', color: '#94A3B8' }}>
                  {c.label}
                </button>
              )
            })}
            <button type="button" onClick={() => setShowCatModal(true)}
              className="px-2 py-0.5 rounded text-xs font-semibold border-2 transition-all"
              style={{ borderColor: '#6366F1', background: '#fff', color: '#6366F1', borderStyle: 'dashed' }}>
              + New
            </button>
          </div>

          {showCatModal && <CategoryModal onClose={() => setShowCatModal(false)} />}

          {/* Employee quick-pick */}
          {hasSalaryLabour && (() => {
            const isSalary = selected.has('SALARY')
            const pool     = isSalary ? fixedEmps : variableEmps
            if (!pool.length) return null
            return (
              <div className="flex flex-wrap gap-1">
                {pool.map(emp => {
                  const active = employeeId === emp.id
                  return (
                    <button key={emp.id} type="button" onClick={() => fillEmployee(emp)}
                      className="px-2 py-1 rounded text-xs font-bold border-2 transition-all"
                      style={active
                        ? { borderColor: isSalary ? '#7C3AED' : '#EA580C', background: isSalary ? '#8B5CF6' : '#F97316', color: '#fff' }
                        : { borderColor: isSalary ? '#8B5CF6' : '#F97316', background: isSalary ? '#F5F3FF' : '#FFF7ED', color: isSalary ? '#7C3AED' : '#EA580C' }}>
                      {emp.name.split(' ')[0]}
                      {isSalary && emp.salary ? <span className="opacity-60 ml-1">₹{Number(emp.salary).toLocaleString('en-IN')}</span> : null}
                    </button>
                  )
                })}
              </div>
            )
          })()}

          {/* Pay mode */}
          <div className="flex gap-1.5">
            {[{ key: 'CASH', icon: '💵', label: 'Cash' }, { key: 'ONLINE', icon: '📱', label: 'Online' }].map(opt => (
              <button key={opt.key} type="button" onClick={() => setPayMode(opt.key)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border-2 transition-all"
                style={payMode === opt.key
                  ? { borderColor: '#3B82F6', background: '#EFF6FF', color: '#2563EB' }
                  : { borderColor: '#E2E8F0', color: '#94A3B8' }}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Buttons (always at bottom) ────────────────────────────────── */}
        <div className="space-y-1.5">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="flex gap-1.5">
            <button type="button" onClick={handleCredit}
              className="flex-1 py-2.5 rounded text-xs font-bold text-white uppercase tracking-widest transition-all active:scale-95"
              style={{ background: success && lastAction === 'IN' ? '#34D399' : '#16A34A' }}>
              {success && lastAction === 'IN' ? '✓ Saved!' : 'Credit'}
            </button>
            <button type="button" onClick={handleDebit}
              className="flex-1 py-2.5 rounded text-xs font-bold text-white uppercase tracking-widest transition-all active:scale-95"
              style={{ background: success && lastAction === 'OUT' ? '#FB7185' : '#DC2626' }}>
              {success && lastAction === 'OUT' ? '✓ Saved!' : 'Debit'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
