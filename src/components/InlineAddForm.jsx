import { useState } from 'react'
import { Send } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, todayISO } from '../utils/helpers'

const MODES = [
  { key: 'IN',    label: '💰 Cash In'   },
  { key: 'OUT',   label: '💸 Cash Out'  },
  { key: 'OWNER', label: '👤 Partner'   },
]

export default function InlineAddForm({ defaultMode = 'IN' }) {
  const { owners, employees = [], addTransaction } = useApp()

  const [mode, setMode]           = useState(defaultMode === 'OWNER' ? 'OWNER' : defaultMode === 'OUT' ? 'OUT' : 'IN')
  const [amount, setAmount]       = useState('')
  const [description, setDesc]    = useState('')
  const [category, setCategory]   = useState('')
  const [payMode, setPayMode]     = useState('CASH')
  const [ownerId, setOwnerId]     = useState(owners[0]?.id || '')
  const [ownerAction, setAction]  = useState('DEPOSIT')
  const [ownerPaid, setOwnerPaid] = useState(false)
  const [ownerPaidId, setOwnerPaidId] = useState(owners[0]?.id || '')
  const [partnerId, setPartnerId] = useState('')
  const [date, setDate]           = useState(todayISO())
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')

  const switchMode = (m) => { setMode(m); setCategory(''); setOwnerPaid(false); setError('') }

  const reset = () => {
    setAmount(''); setDesc(''); setCategory(''); setOwnerPaid(false); setError('')
    setPayMode('CASH'); setDate(todayISO()); setPartnerId('')
  }

  const handleSave = () => {
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)                       return setError('Enter amount')
    if (!description.trim())                    return setError('Enter description')
    if (mode === 'OWNER' && !ownerId)           return setError('Select owner')
    if (mode === 'OUT' && ownerPaid && !ownerPaidId) return setError('Select which owner paid')

    if (mode === 'IN') {
      addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.CASH_IN, paymentMode: '', ownerId: null, partnerId: partnerId || null })
    }
    if (mode === 'OUT') {
      addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.EXPENSE, paymentMode: payMode, ownerId: null, partnerId: partnerId || null })
      if (ownerPaid && ownerPaidId) {
        addTransaction({
          date, amount: amt,
          description: `${owners.find(o => o.id === ownerPaidId)?.name} paid: ${description}`,
          category: '', type: TRANSACTION_TYPES.OWNER_DEPOSIT, paymentMode: '', ownerId: ownerPaidId,
        })
      }
    }
    if (mode === 'OWNER') {
      const type = ownerAction === 'DEPOSIT' ? TRANSACTION_TYPES.OWNER_DEPOSIT : TRANSACTION_TYPES.OWNER_WITHDRAWAL
      addTransaction({ date, amount: amt, description, category: '', type, paymentMode: '', ownerId })
    }

    setSuccess(true)
    reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const cats = mode === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="mx-4 my-3 rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-white">

      {/* Mode selector */}
      <div className="flex gap-1 p-2" style={{ background: '#F8FAFC' }}>
        {MODES.map(m => (
          <button key={m.key} type="button" onClick={() => switchMode(m.key)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all duration-150"
            style={mode === m.key
              ? { background: 'linear-gradient(135deg,#1E293B,#334155)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }
              : { color: '#94A3B8' }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2 space-y-3">

        {/* Amount + Date row */}
        <div className="flex gap-2">
          <input
            type="number" min="1" placeholder="₹ Amount"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          />
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-36 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        {/* Description */}
        <input
          type="text" placeholder="Description — what is this for?"
          value={description} onChange={e => setDesc(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        />

        {/* Cash In / Cash Out — category */}
        {(mode === 'IN' || mode === 'OUT') && (
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all">
            <option value="">Category (optional)</option>
            {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        )}

        {/* Link to Partner — optional for Cash In/Out */}
        {(mode === 'IN' || mode === 'OUT') && (
          <select value={partnerId} onChange={e => setPartnerId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all">
            <option value="">Link to Partner (optional)</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        {/* Employee quick-pick for Salary / Labour */}
        {mode === 'OUT' && (category === 'SALARY' || category === 'LABOUR') && (() => {
          const isSalary = category === 'SALARY'
          const pool = isSalary ? fixedEmps : variableEmps
          if (!pool.length) return null
          return (
            <div className="flex flex-wrap gap-2">
              {pool.map(emp => (
                <button key={emp.id} type="button"
                  onClick={() => {
                    setDesc(`${isSalary ? 'Salary' : 'Labour'} - ${emp.name}`)
                    if (isSalary && emp.salary) setAmount(String(emp.salary))
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{ borderColor: isSalary ? '#8B5CF6' : '#F97316', background: isSalary ? '#F5F3FF' : '#FFF7ED', color: isSalary ? '#7C3AED' : '#EA580C' }}
                >
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: isSalary ? '#8B5CF6' : '#F97316' }}>
                    {emp.name.charAt(0).toUpperCase()}
                  </span>
                  {emp.name}
                  {isSalary && emp.salary ? <span className="opacity-60">₹{Number(emp.salary).toLocaleString('en-IN')}</span> : null}
                </button>
              ))}
            </div>
          )
        })()}

        {/* Cash Out — pay mode + owner-paid */}
        {mode === 'OUT' && (
          <div className="flex flex-wrap gap-2 items-center">
            {[{ key: 'CASH', icon: '💵', label: 'Cash' }, { key: 'ONLINE', icon: '📱', label: 'Online' }].map(opt => (
              <button key={opt.key} type="button" onClick={() => setPayMode(opt.key)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
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

            {ownerPaid && (
              <select value={ownerPaidId} onChange={e => setOwnerPaidId(e.target.value)}
                className="flex-1 min-w-[130px] bg-amber-50 border-2 border-amber-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-800 focus:outline-none">
                {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Partner tab fields */}
        {mode === 'OWNER' && (
          <div className="flex gap-2 flex-wrap">
            <select value={ownerId} onChange={e => setOwnerId(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {[{ key: 'DEPOSIT', label: '⬆ Deposited' }, { key: 'WITHDRAWAL', label: '⬇ Personal' }].map(opt => (
              <button key={opt.key} type="button" onClick={() => setAction(opt.key)}
                className="px-3 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all"
                style={ownerAction === opt.key
                  ? opt.key === 'DEPOSIT'
                    ? { borderColor: '#10B981', background: '#ECFDF5', color: '#059669' }
                    : { borderColor: '#F43F5E', background: '#FFF1F2', color: '#E11D48' }
                  : { borderColor: '#E2E8F0', color: '#94A3B8' }
                }>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && <p className="text-xs text-red-500 font-semibold px-1">{error}</p>}

        {/* Save */}
        <button type="button" onClick={handleSave}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={success
            ? { background: '#10B981' }
            : { background: 'linear-gradient(135deg,#3B82F6,#6366F1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }
          }
        >
          {success ? '✓ Saved!' : <><Send size={15} /> Save Entry</>}
        </button>
      </div>
    </div>
  )
}
