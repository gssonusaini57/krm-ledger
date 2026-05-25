import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, todayISO } from '../utils/helpers'
import DateInput from './DateInput'

const MODES = [
  { value: 'P_TO_RM',      label: 'P → Mill (Expense)',        hint: 'Partner funds a mill expense' },
  { value: 'P_TO_CASH',    label: 'P → Cash (Galle mein)',     hint: 'Partner gives cash to mill'   },
  { value: 'P_TO_BANK',    label: 'P → Bank (Deposit)',        hint: 'Partner deposits to bank'     },
  { value: 'MILL_TO_P',    label: 'Mill → P (Repayment)',      hint: 'Mill repays partner (cash)'   },
  { value: 'CASH_TO_P',    label: 'Cash → P (Galle se)',       hint: 'Cash from till to partner'    },
  { value: 'BANK_TO_P',    label: 'Bank → P (Payment)',        hint: 'Bank pays partner'            },
  { value: 'BANK_TO_CASH', label: 'Bank → Cash (Withdrawal)',  hint: 'Withdraw cash from bank'      },
  { value: 'CASH_TO_BANK', label: '🏦 Cash → Bank (Deposit)', hint: 'Deposit cash from galla into bank' },
]

const CATEGORY_CHIPS = [
  { value: 'LABOUR',       label: 'Labour'     },
  { value: 'SALARY',       label: 'Salary'     },
  { value: 'EXPENDITURE',  label: 'Expense'    },
  { value: 'TRUCK',        label: 'Truck'      },
  { value: 'DEPOT_EXP',    label: 'Depot'      },
  { value: 'ASHOK_DEPOT',  label: 'Ashok'      },
  { value: 'PANKAJ_PLASH', label: 'Pankaj'     },
  { value: 'AMAN_PLASH',   label: 'Aman'       },
  { value: 'BROKEN_BUY',   label: 'Broken Buy' },
]

function getShortcut(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return parts.map(p => p[0]).join('').toLowerCase()
  return name.slice(0, 2).toLowerCase()
}

export default function AdvancePaymentForm() {
  const { owners, employees = [], addTransaction } = useApp()

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')
  const allEmps      = [...fixedEmps, ...variableEmps]

  const [mode, setMode]         = useState('P_TO_RM')
  const [date, setDate]         = useState(todayISO())
  const [amount, setAmount]     = useState('')
  const [partnerId, setPartner] = useState(owners[0]?.id || '')
  const [description, setDesc]  = useState('')
  const [category, setCat]      = useState('')
  const [employeeId, setEmpId]  = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const partner  = owners.find(o => o.id === partnerId)

  const needsPartner  = mode !== 'BANK_TO_CASH' && mode !== 'CASH_TO_BANK'
  const needsCategory = mode === 'P_TO_RM'
  const hasSalaryLabour = needsCategory && (category === 'SALARY' || category === 'LABOUR')
  const empPool = category === 'SALARY' ? fixedEmps : variableEmps

  const handleModeChange = (val) => {
    setMode(val); setCat(''); setEmpId(''); setError('')
  }

  const fillEmployee = (emp) => {
    setDesc(`${emp.type === 'FIXED' ? 'Salary' : 'Labour'} - ${emp.name}`)
    setEmpId(emp.id)
    setCat(emp.type === 'FIXED' ? 'SALARY' : 'LABOUR')
  }

  const handleDescChange = (val) => {
    setDesc(val); setEmpId('')
    const lower = val.toLowerCase().trim()
    if (!lower || !needsCategory) return
    const match = allEmps.find(e => {
      const sc = getShortcut(e.name)
      return lower === sc || lower === e.name.split(' ')[0].toLowerCase()
    })
    if (match) fillEmployee(match)
  }

  const reset = () => {
    setAmount(''); setDesc(''); setCat(''); setEmpId(''); setError(''); setDate(todayISO())
  }

  const validate = () => {
    const amt = parseFloat(amount)
    if (needsPartner && !partnerId)   { setError('Select a partner'); return null }
    if (!amt || amt <= 0)             { setError('Enter amount'); return null }
    if (!description.trim())          { setError('Enter description'); return null }
    return amt
  }

  const handleSubmit = () => {
    setError('')
    const amt = validate()
    if (!amt) return

    const pName = partner?.name || ''

    switch (mode) {
      case 'P_TO_RM':
        addTransaction({
          date, amount: amt,
          description: `Advance by ${pName}: ${description}`,
          type: TRANSACTION_TYPES.OWNER_DEPOSIT,
          ownerId: partnerId, partnerId: null,
          category: '', paymentMode: 'CASH',
        })
        addTransaction({
          date, amount: amt,
          description: `${description} (Advance: ${pName})`,
          type: TRANSACTION_TYPES.EXPENSE,
          ownerId: null, partnerId: null,
          category: category || 'EXPENDITURE',
          employeeId: employeeId || null,
          paymentMode: 'CASH',
        })
        break

      case 'P_TO_CASH':
        addTransaction({
          date, amount: amt, description,
          type: TRANSACTION_TYPES.OWNER_DEPOSIT,
          ownerId: partnerId, partnerId: null,
          category: '', paymentMode: 'CASH',
        })
        break

      case 'P_TO_BANK':
        addTransaction({
          date, amount: amt, description,
          type: TRANSACTION_TYPES.OWNER_DEPOSIT,
          ownerId: partnerId, partnerId: null,
          category: '', paymentMode: 'ONLINE',
        })
        break

      case 'MILL_TO_P':
        addTransaction({
          date, amount: amt, description,
          type: TRANSACTION_TYPES.OWNER_WITHDRAWAL,
          ownerId: partnerId, partnerId: null,
          category: '', paymentMode: 'CASH',
        })
        break

      case 'CASH_TO_P':
        addTransaction({
          date, amount: amt, description,
          type: TRANSACTION_TYPES.OWNER_WITHDRAWAL,
          ownerId: partnerId, partnerId: null,
          category: '', paymentMode: 'CASH',
        })
        break

      case 'BANK_TO_P':
        addTransaction({
          date, amount: amt, description,
          type: TRANSACTION_TYPES.OWNER_WITHDRAWAL,
          ownerId: partnerId, partnerId: null,
          category: '', paymentMode: 'ONLINE',
        })
        break

      case 'BANK_TO_CASH':
        addTransaction({
          date, amount: amt,
          description: description || 'Bank to Cash',
          type: TRANSACTION_TYPES.CASH_IN,
          ownerId: null, partnerId: null,
          category: '', paymentMode: 'CASH',
        })
        addTransaction({
          date, amount: amt,
          description: description || 'Cash Withdrawal from Bank',
          type: TRANSACTION_TYPES.EXPENSE,
          ownerId: null, partnerId: null,
          category: 'BANK', paymentMode: 'ONLINE',
        })
        break

      case 'CASH_TO_BANK':
        addTransaction({
          date, amount: amt,
          description: description || 'Cash deposited to bank (Galle se Bank)',
          type: TRANSACTION_TYPES.CASH_TO_BANK,
          ownerId: null, partnerId: null,
          category: 'BANK', paymentMode: 'ONLINE',
        })
        break

      default: break
    }

    setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  // Flow preview
  const fromLabel = (mode === 'BANK_TO_CASH' || mode === 'BANK_TO_P') ? 'Bank'
    : (mode === 'CASH_TO_BANK' || mode === 'CASH_TO_P') ? 'Cash'
    : mode === 'MILL_TO_P' ? 'Mill'
    : partner ? partner.name.split(' ')[0] : 'Partner'

  const toLabel = mode === 'BANK_TO_CASH' ? 'Cash'
    : mode === 'CASH_TO_BANK' ? 'Bank'
    : mode === 'P_TO_CASH' ? 'Cash'
    : mode === 'P_TO_BANK' ? 'Bank'
    : mode === 'P_TO_RM'   ? 'Mill → Expense'
    : partner ? partner.name.split(' ')[0] : 'Partner'

  const fromColor = (mode === 'MILL_TO_P' || mode === 'CASH_TO_P' || mode === 'CASH_TO_BANK') ? '#D97706'
    : (mode === 'BANK_TO_P' || mode === 'BANK_TO_CASH') ? '#3B82F6'
    : partner?.color || '#7C3AED'

  const toColor = (mode === 'P_TO_CASH' || mode === 'BANK_TO_CASH') ? '#D97706'
    : (mode === 'P_TO_BANK' || mode === 'CASH_TO_BANK') ? '#3B82F6'
    : mode === 'P_TO_RM'   ? '#059669'
    : partner?.color || '#7C3AED'

  return (
    <div className="overflow-hidden shadow border border-gray-200 bg-white rounded-lg flex flex-col md:h-full"
      style={{ borderTop: '4px solid #7C3AED' }}>

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0" style={{ background: '#F5F3FF' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>⚡ Partner Form</p>
        <p className="text-xs text-gray-400">All partner transactions</p>
      </div>

      <div className="px-3 pt-3 pb-3 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-2">

        {/* Flow preview */}
        <div className="flex items-center gap-1 text-xs">
          <span className="flex-1 py-1 px-1.5 rounded text-center font-bold truncate"
            style={{ background: fromColor + '22', color: fromColor }}>
            {fromLabel}
          </span>
          <ArrowRight size={11} className="text-gray-300 flex-shrink-0" />
          <span className="flex-1 py-1 px-1.5 rounded text-center font-bold truncate"
            style={{ background: toColor + '22', color: toColor }}>
            {toLabel}
          </span>
        </div>

        {/* Date + Amount */}
        <div className="flex gap-1.5">
          <DateInput value={date} onChange={e => setDate(e.target.value)}
            className="w-28 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-xs text-gray-700" />
          <input type="number" min="1" placeholder="₹ Amount"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>

        {/* Mode selector */}
        <select value={mode} onChange={e => handleModeChange(e.target.value)}
          className="w-full bg-gray-50 border border-purple-200 rounded px-2 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
          style={{ color: '#6D28D9' }}>
          {MODES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Hint */}
        <p className="text-xs text-gray-400 -mt-1 px-0.5">
          {MODES.find(m => m.value === mode)?.hint}
        </p>

        {/* Partner chips */}
        {needsPartner && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
              Partner <span className="text-red-400">*</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {owners.map(o => {
                const active = partnerId === o.id
                return (
                  <button key={o.id} type="button" onClick={() => setPartner(o.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border-2 transition-all"
                    style={active
                      ? { borderColor: o.color || '#7C3AED', background: o.color || '#7C3AED', color: '#fff' }
                      : { borderColor: (o.color || '#7C3AED') + '40', background: (o.color || '#7C3AED') + '10', color: o.color || '#7C3AED' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: active ? 'rgba(255,255,255,0.3)' : o.color || '#7C3AED', fontSize: 9 }}>
                      {o.name.charAt(0)}
                    </span>
                    {o.name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <input type="text" placeholder="Description..."
          value={description} onChange={e => handleDescChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200" />

        {/* Category chips (P_TO_RM only) */}
        {needsCategory && (
          <div className="flex flex-wrap gap-1">
            {CATEGORY_CHIPS.map(c => {
              const active = category === c.value
              return (
                <button key={c.value} type="button" onClick={() => { setCat(active ? '' : c.value); setEmpId('') }}
                  className="px-2 py-0.5 rounded text-xs font-semibold border-2 transition-all"
                  style={active
                    ? { borderColor: '#7C3AED', background: '#7C3AED', color: '#fff' }
                    : { borderColor: '#E2E8F0', background: '#fff', color: '#94A3B8' }}>
                  {c.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Employee quick-pick */}
        {hasSalaryLabour && empPool.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {empPool.map(emp => {
              const active   = employeeId === emp.id
              const isSalary = emp.type === 'FIXED'
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
        )}

        </div>

        {/* ── Button (always at bottom) ─────────────────────────────────── */}
        <div className="space-y-1.5">
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <button type="button" onClick={handleSubmit}
            className="w-full py-2.5 rounded text-xs font-bold text-white uppercase tracking-widest transition-all active:scale-95"
            style={{ background: success ? '#34D399' : '#7C3AED' }}>
            {success ? '✓ Saved!' : 'Submit'}
          </button>
        </div>

      </div>
    </div>
  )
}
