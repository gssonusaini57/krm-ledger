import { useState } from 'react'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, todayISO } from '../utils/helpers'

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

  const [date, setDate]         = useState(todayISO())
  const [amount, setAmount]     = useState('')
  const [partnerId, setPartner] = useState('')
  const [description, setDesc]  = useState('')
  const [category, setCat]      = useState('')
  const [employeeId, setEmpId]  = useState('')
  const [payMode, setPayMode]   = useState('CASH')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [lastAction, setLastAction] = useState('')

  const partner = owners.find(o => o.id === partnerId)

  const reset = () => {
    setAmount(''); setDesc(''); setCat('')
    setEmpId(''); setError(''); setDate(todayISO()); setPayMode('CASH')
  }

  const handleDescChange = (val) => {
    setDesc(val); setEmpId('')
    const lower = val.toLowerCase().trim()
    if (!lower) return
    const match = allEmps.find(e => {
      const sc = getShortcut(e.name)
      return lower === sc || lower === e.name.split(' ')[0].toLowerCase()
    })
    if (match) {
      setDesc(`${match.type === 'FIXED' ? 'Salary' : 'Labour'} - ${match.name}`)
      setEmpId(match.id)
      setCat(match.type === 'FIXED' ? 'SALARY' : 'LABOUR')
    }
  }

  const fillEmployee = (emp) => {
    setDesc(`${emp.type === 'FIXED' ? 'Salary' : 'Labour'} - ${emp.name}`)
    setEmpId(emp.id)
    setCat(emp.type === 'FIXED' ? 'SALARY' : 'LABOUR')
  }

  const validate = () => {
    const amt = parseFloat(amount)
    if (!partnerId)          { setError('Select a partner'); return null }
    if (!amt || amt <= 0)    { setError('Enter amount'); return null }
    if (!description.trim()) { setError('Enter description'); return null }
    return amt
  }

  // Credit: partner gives money to mill.
  // If a category is selected → advance flow (partner funds an expense):
  //   two entries: OWNER_DEPOSIT (credit partner) + EXPENSE (mill pays out).
  // If no category → simple deposit: one OWNER_DEPOSIT entry only.
  const handleCredit = () => {
    setError('')
    const amt = validate(); if (!amt) return
    const partnerName = partner?.name || ''

    addTransaction({
      date, amount: amt,
      description: category
        ? `Advance by ${partnerName}: ${description}`
        : description,
      type: TRANSACTION_TYPES.OWNER_DEPOSIT,
      ownerId: partnerId, partnerId: null,
      category: '', paymentMode: payMode,
    })

    if (category) {
      addTransaction({
        date, amount: amt,
        description: `${description} (Advance: ${partnerName})`,
        type: TRANSACTION_TYPES.EXPENSE,
        ownerId: null, partnerId: null,
        category,
        employeeId: employeeId || null,
        paymentMode: payMode,
      })
    }

    setLastAction('CREDIT'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  // Debit: mill pays partner back via cash or bank — OWNER_WITHDRAWAL only.
  const handleDebit = () => {
    setError('')
    const amt = validate(); if (!amt) return

    addTransaction({
      date, amount: amt,
      description,
      type: TRANSACTION_TYPES.OWNER_WITHDRAWAL,
      ownerId: partnerId, partnerId: null,
      category: '', paymentMode: payMode,
    })

    setLastAction('DEBIT'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const hasSalaryLabour = category === 'SALARY' || category === 'LABOUR'
  const empPool         = category === 'SALARY' ? fixedEmps : variableEmps
  const isAdvance       = !!category

  return (
    <div className="overflow-hidden shadow border border-gray-200 bg-white rounded-lg"
      style={{ borderTop: '4px solid #7C3AED' }}>

      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100" style={{ background: '#F5F3FF' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>⚡ Partner Form</p>
        <p className="text-xs text-gray-400">All partner transactions</p>
      </div>

      <div className="px-3 pt-3 pb-3 space-y-2">

        {/* Flow preview — updates live */}
        <div className="flex items-center gap-1 text-xs">
          <span className="flex-1 py-1 px-1.5 rounded text-center font-bold truncate"
            style={{ background: partner ? (partner.color || '#7C3AED') + '22' : '#F1F5F9', color: partner ? partner.color || '#7C3AED' : '#94A3B8' }}>
            {partner ? partner.name.split(' ')[0] : 'Partner'}
          </span>
          {isAdvance ? (
            <>
              <ArrowRight size={11} className="text-gray-300 flex-shrink-0" />
              <span className="flex-1 py-1 px-1.5 rounded text-center font-bold"
                style={{ background: '#ECFDF5', color: '#059669' }}>Mill</span>
              <ArrowRight size={11} className="text-gray-300 flex-shrink-0" />
              <span className="flex-1 py-1 px-1.5 rounded text-center font-bold truncate"
                style={{ background: '#FEF3C7', color: '#92400E' }}>
                {description.trim() ? description.split(' ').slice(0, 2).join(' ') : 'Recipient'}
              </span>
            </>
          ) : (
            <>
              <ArrowLeftRight size={11} className="text-gray-300 flex-shrink-0" />
              <span className="flex-1 py-1 px-1.5 rounded text-center font-bold"
                style={{ background: '#ECFDF5', color: '#059669' }}>Mill</span>
            </>
          )}
        </div>

        {/* Date + Amount */}
        <div className="flex gap-1.5">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-28 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200" />
          <input type="number" min="1" placeholder="₹ Amount"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-2 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>

        {/* Partner chips */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Partner <span className="text-red-400">*</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {owners.map(o => {
              const active = partnerId === o.id
              return (
                <button key={o.id} type="button" onClick={() => setPartner(active ? '' : o.id)}
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

        {/* Description */}
        <input type="text" placeholder="Description / recipient..."
          value={description} onChange={e => handleDescChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200" />

        {/* Category chips — selecting one enables advance (two-entry) mode */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Category
            {isAdvance && <span className="ml-1 text-purple-500 normal-case font-semibold">(advance mode)</span>}
          </p>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_CHIPS.map(c => {
              const active = category === c.value
              return (
                <button key={c.value} type="button" onClick={() => setCat(active ? '' : c.value)}
                  className="px-2 py-0.5 rounded text-xs font-semibold border-2 transition-all"
                  style={active
                    ? { borderColor: '#7C3AED', background: '#7C3AED', color: '#fff' }
                    : { borderColor: '#E2E8F0', background: '#fff', color: '#94A3B8' }}>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

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

        {/* Pay mode */}
        <div className="flex gap-1.5">
          {[{ key: 'CASH', icon: '💵', label: 'Cash' }, { key: 'ONLINE', icon: '📱', label: 'Online' }].map(opt => (
            <button key={opt.key} type="button" onClick={() => setPayMode(opt.key)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border-2 transition-all"
              style={payMode === opt.key
                ? { borderColor: '#7C3AED', background: '#EDE9FE', color: '#6D28D9' }
                : { borderColor: '#E2E8F0', color: '#94A3B8' }}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

        {/* Credit / Debit */}
        <div className="flex gap-1.5 pt-1">
          <button type="button" onClick={handleCredit}
            className="flex-1 py-2.5 rounded text-xs font-bold text-white uppercase tracking-widest transition-all active:scale-95"
            style={{ background: success && lastAction === 'CREDIT' ? '#34D399' : '#16A34A' }}>
            {success && lastAction === 'CREDIT' ? '✓ Saved!' : 'Credit'}
          </button>
          <button type="button" onClick={handleDebit}
            className="flex-1 py-2.5 rounded text-xs font-bold text-white uppercase tracking-widest transition-all active:scale-95"
            style={{ background: success && lastAction === 'DEBIT' ? '#FB7185' : '#DC2626' }}>
            {success && lastAction === 'DEBIT' ? '✓ Saved!' : 'Debit'}
          </button>
        </div>
      </div>
    </div>
  )
}
