import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, todayISO } from '../utils/helpers'

// Sidebar categories shown as "Also in" chips
const ALSO_IN_CATS = [
  { value: 'SALARY',       label: 'Salary'       },
  { value: 'LABOUR',       label: 'Labour'       },
  { value: 'BANK',         label: 'Bank'         },
  { value: 'DEPOT_EXP',    label: 'Depot'        },
  { value: 'EXPENDITURE',  label: 'Expenditure'  },
  { value: 'ASHOK_DEPOT',  label: 'Ashok Depot'  },
  { value: 'TRUCK',        label: 'Truck'        },
  { value: 'PANKAJ_PLASH', label: 'Pankaj Plash' },
  { value: 'AMAN_PLASH',   label: 'Aman Plash'   },
  { value: 'BROKEN_BUY',   label: 'Broken Buy'   },
  { value: 'BROKEN_SELL',  label: 'Broken Sell'  },
]

// Generate 2-3 char shortcut from employee name (e.g. "Ramesh Kumar" → "rk")
function getShortcut(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return parts.map(p => p[0]).join('').toLowerCase()
  return name.slice(0, 2).toLowerCase()
}

export default function InlineAddForm({ defaultMode = 'IN', defaultCategory = '', currentTab = '' }) {
  const { owners, employees = [], addTransaction } = useApp()

  const isOwnerMode = defaultMode === 'OWNER'

  const [amount, setAmount]           = useState('')
  const [description, setDesc]        = useState('')
  const [category, setCategory]       = useState(defaultCategory || '')
  const [payMode, setPayMode]         = useState('CASH')
  const [ownerId, setOwnerId]         = useState(owners[0]?.id || '')
  const [ownerPaid, setOwnerPaid]     = useState(false)
  const [ownerPaidId, setOwnerPaidId] = useState(owners[0]?.id || '')
  const [employeeId, setEmployeeId]     = useState('')
  const alsoInValues = ALSO_IN_CATS.map(c => c.value)
  const [linkedCategories, setLinkedCats] = useState(
    alsoInValues.includes(currentTab) ? [currentTab] : []
  )
  const [date, setDate]                = useState(todayISO())
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [lastAction, setLastAction]   = useState('')

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')
  const allEmps      = [...fixedEmps, ...variableEmps]

  const defaultLinked = alsoInValues.includes(currentTab) ? [currentTab] : []

  const reset = () => {
    setAmount(''); setDesc(''); setCategory(defaultCategory || ''); setOwnerPaid(false); setError('')
    setPayMode('CASH'); setDate(todayISO()); setEmployeeId(''); setLinkedCats(defaultLinked)
  }

  const toggleLinkedCat = (val) =>
    setLinkedCats(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])

  // Fill form from employee object — amount stays manual
  const fillEmployee = (emp) => {
    const isSalary = emp.type === 'FIXED'
    setDesc(`${isSalary ? 'Salary' : 'Labour'} - ${emp.name}`)
    setEmployeeId(emp.id)
    setCategory(isSalary ? 'SALARY' : 'LABOUR')
  }

  // Description change — check if typed text matches a shortcut
  const handleDescChange = (val) => {
    setDesc(val)
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

  const handleCashIn = () => {
    setError('')
    const amt = validate(); if (!amt) return
    addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.CASH_IN, paymentMode: payMode, ownerId: null, partnerId: null, linkedCategories: linkedCategories.length ? linkedCategories : null })
    setLastAction('IN'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const handleCashOut = () => {
    setError('')
    const amt = validate(); if (!amt) return
    if (ownerPaid && !ownerPaidId) { setError('Select which partner paid'); return }
    addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.EXPENSE, paymentMode: payMode, ownerId: null, partnerId: null, employeeId: employeeId || null, linkedCategories: linkedCategories.length ? linkedCategories : null })
    if (ownerPaid && ownerPaidId) {
      addTransaction({
        date, amount: amt,
        description: `${owners.find(o => o.id === ownerPaidId)?.name} paid: ${description}`,
        category: '', type: TRANSACTION_TYPES.OWNER_DEPOSIT, paymentMode: '', ownerId: ownerPaidId,
      })
    }
    setLastAction('OUT'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const handleOwnerSave = (action) => {
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)    { setError('Enter amount'); return }
    if (!description.trim()) { setError('Enter description'); return }
    if (!ownerId)            { setError('Select partner'); return }
    const type = action === 'DEPOSIT' ? TRANSACTION_TYPES.OWNER_DEPOSIT : TRANSACTION_TYPES.OWNER_WITHDRAWAL
    addTransaction({ date, amount: amt, description, category: '', type, paymentMode: '', ownerId })
    setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  // Placeholder shows available employee shortcuts
  const shortcutHints = allEmps.map(e => `${getShortcut(e.name)}=${e.name.split(' ')[0]}`).join(', ')
  const descPlaceholder = shortcutHints
    ? `Shortcut: ${shortcutHints}`
    : 'Details (bk, st, lb, tr)...'

  return (
    <div className="mx-4 my-3 overflow-hidden shadow border border-gray-200 bg-white rounded-lg">
      <div className="px-4 pb-4 pt-4 space-y-2.5">

        {/* Date + Amount */}
        <div className="flex gap-2">
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-36 bg-gray-50 border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
          />
          <input
            type="number" min="1" placeholder="Amount ₹"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded px-4 py-2.5 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          />
        </div>

        {/* Category */}
        {!isOwnerMode && (
          <select value={category} onChange={e => { setCategory(e.target.value); setLinkedCats(defaultLinked) }}
            className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all">
            <optgroup label="Cash In Categories">
              {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </optgroup>
            <optgroup label="Cash Out Categories">
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </optgroup>
          </select>
        )}

        {/* Also in → always visible multi-select */}
        {!isOwnerMode && (
          <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Also show in →</p>
            <div className="flex flex-wrap gap-1.5">
              {ALSO_IN_CATS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => toggleLinkedCat(c.value)}
                  className="px-2.5 py-1 rounded text-xs font-semibold border-2 transition-all"
                  style={linkedCategories.includes(c.value)
                    ? { borderColor: '#6366F1', background: '#6366F1', color: '#fff' }
                    : { borderColor: '#E2E8F0', background: '#fff', color: '#94A3B8' }
                  }>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <input
          type="text" placeholder={descPlaceholder}
          value={description} onChange={e => handleDescChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        />

        {/* Employee quick-pick for Salary / Labour — shows shortcut badge */}
        {!isOwnerMode && (category === 'SALARY' || category === 'LABOUR') && (() => {
          const isSalary = category === 'SALARY'
          const pool = isSalary ? fixedEmps : variableEmps
          if (!pool.length) return null
          return (
            <div className="flex flex-wrap gap-2">
              {pool.map(emp => {
                const sc = getShortcut(emp.name)
                const active = employeeId === emp.id
                return (
                  <button key={emp.id} type="button"
                    onClick={() => fillEmployee(emp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border-2 transition-all"
                    style={active
                      ? { borderColor: isSalary ? '#7C3AED' : '#EA580C', background: isSalary ? '#8B5CF6' : '#F97316', color: '#fff' }
                      : { borderColor: isSalary ? '#8B5CF6' : '#F97316', background: isSalary ? '#F5F3FF' : '#FFF7ED', color: isSalary ? '#7C3AED' : '#EA580C' }
                    }
                  >
                    <span className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: isSalary ? '#8B5CF6' : '#F97316' }}>
                      {emp.name.charAt(0).toUpperCase()}
                    </span>
                    {emp.name.split(' ')[0]}
                    {isSalary && emp.salary ? <span className="opacity-60">₹{Number(emp.salary).toLocaleString('en-IN')}</span> : null}
                    <span className="ml-0.5 px-1 py-0.5 rounded font-mono text-white"
                      style={{ background: 'rgba(0,0,0,0.2)', fontSize: 9 }}>
                      {sc}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* Pay mode + partner-paid */}
        {!isOwnerMode && (
          <div className="flex flex-wrap gap-2 items-center">
            {[{ key: 'CASH', icon: '💵', label: 'Cash' }, { key: 'ONLINE', icon: '📱', label: 'Online' }].map(opt => (
              <button key={opt.key} type="button" onClick={() => setPayMode(opt.key)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold border-2 transition-all"
                style={payMode === opt.key
                  ? { borderColor: '#3B82F6', background: '#EFF6FF', color: '#2563EB' }
                  : { borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                {opt.icon} {opt.label}
              </button>
            ))}
            <label className="flex items-center gap-2 cursor-pointer ml-1">
              <input type="checkbox" checked={ownerPaid} onChange={e => setOwnerPaid(e.target.checked)} className="accent-amber-500 w-4 h-4" />
              <span className="text-xs font-semibold text-gray-500">Partner paid?</span>
            </label>
            {ownerPaid && owners.map(o => (
              <button key={o.id} type="button" onClick={() => setOwnerPaidId(o.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border-2 transition-all"
                style={ownerPaidId === o.id
                  ? { borderColor: o.color || '#F59E0B', background: `${o.color || '#F59E0B'}18`, color: o.color || '#F59E0B' }
                  : { borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: o.color || '#F59E0B', fontSize: 9 }}>
                  {o.name.charAt(0)}
                </span>
                {o.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Partner select (OWNER mode only) */}
        {isOwnerMode && (
          <select value={ownerId} onChange={e => setOwnerId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        {/* Error */}
        {error && <p className="text-xs text-red-500 font-semibold px-1">{error}</p>}

        {/* Action buttons */}
        {isOwnerMode ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => handleOwnerSave('DEPOSIT')}
              className="flex-1 py-3 rounded text-sm font-bold text-white uppercase tracking-wide transition-all active:scale-95"
              style={{ background: success ? '#10B981' : 'linear-gradient(135deg,#10B981,#059669)' }}>
              {success ? '✓ Saved!' : '⬆ Deposited'}
            </button>
            <button type="button" onClick={() => handleOwnerSave('WITHDRAWAL')}
              className="flex-1 py-3 rounded text-sm font-bold text-white uppercase tracking-wide transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#F43F5E,#E11D48)' }}>
              ⬇ Personal
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={handleCashIn}
              className="flex-1 py-3 rounded text-sm font-bold text-white uppercase tracking-widest transition-all active:scale-95"
              style={success && lastAction === 'IN'
                ? { background: '#34D399' }
                : { background: '#16A34A' }}>
              {success && lastAction === 'IN' ? '✓ Saved!' : 'Cash In'}
            </button>
            <button type="button" onClick={handleCashOut}
              className="flex-1 py-3 rounded text-sm font-bold text-white uppercase tracking-widest transition-all active:scale-95"
              style={success && lastAction === 'OUT'
                ? { background: '#FB7185' }
                : { background: '#DC2626' }}>
              {success && lastAction === 'OUT' ? '✓ Saved!' : 'Cash Out'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
