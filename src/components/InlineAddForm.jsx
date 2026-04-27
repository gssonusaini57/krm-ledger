import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, todayISO } from '../utils/helpers'

export default function InlineAddForm({ defaultMode = 'IN', defaultCategory = '' }) {
  const { owners, employees = [], addTransaction } = useApp()

  const isOwnerMode = defaultMode === 'OWNER'

  const [amount, setAmount]           = useState('')
  const [description, setDesc]        = useState('')
  const [category, setCategory]       = useState(defaultCategory || '')
  const [payMode, setPayMode]         = useState('CASH')
  const [ownerId, setOwnerId]         = useState(owners[0]?.id || '')
  const [ownerPaid, setOwnerPaid]     = useState(false)
  const [ownerPaidId, setOwnerPaidId] = useState(owners[0]?.id || '')
  const [partnerId, setPartnerId]     = useState('')
  const [date, setDate]               = useState(todayISO())
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [lastAction, setLastAction]   = useState('')

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')

  const reset = () => {
    setAmount(''); setDesc(''); setCategory(defaultCategory || ''); setOwnerPaid(false); setError('')
    setPayMode('CASH'); setDate(todayISO()); setPartnerId('')
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
    addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.CASH_IN, paymentMode: '', ownerId: null, partnerId: partnerId || null })
    setLastAction('IN'); setSuccess(true); reset()
    setTimeout(() => setSuccess(false), 1200)
  }

  const handleCashOut = () => {
    setError('')
    const amt = validate(); if (!amt) return
    if (ownerPaid && !ownerPaidId) { setError('Select which partner paid'); return }
    addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.EXPENSE, paymentMode: payMode, ownerId: null, partnerId: partnerId || null })
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

  return (
    <div className="mx-4 my-3 rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-white">
      <div className="px-4 pb-4 pt-4 space-y-3">

        {/* Date + Amount */}
        <div className="flex gap-2">
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-36 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
          />
          <input
            type="number" min="1" placeholder="Amount ₹"
            value={amount} onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          />
        </div>

        {/* Category — combined IN/OUT */}
        {!isOwnerMode && (
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all">
            <option value="">-- Direct Entry --</option>
            <optgroup label="Cash In Categories">
              {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </optgroup>
            <optgroup label="Cash Out Categories">
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </optgroup>
          </select>
        )}

        {/* Description */}
        <input
          type="text" placeholder="Details (bk, st, lb, tr)..."
          value={description} onChange={e => setDesc(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        />

        {/* Link to Partner */}
        {!isOwnerMode && (
          <select value={partnerId} onChange={e => setPartnerId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all">
            <option value="">Link to Partner (optional)</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        {/* Employee quick-pick for Salary / Labour */}
        {!isOwnerMode && (category === 'SALARY' || category === 'LABOUR') && (() => {
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

        {/* Pay mode + partner-paid */}
        {!isOwnerMode && (
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

        {/* Partner select (OWNER mode only) */}
        {isOwnerMode && (
          <select value={ownerId} onChange={e => setOwnerId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        {/* Error */}
        {error && <p className="text-xs text-red-500 font-semibold px-1">{error}</p>}

        {/* Action buttons */}
        {isOwnerMode ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => handleOwnerSave('DEPOSIT')}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: success ? '#10B981' : 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              {success ? '✓ Saved!' : '⬆ Deposited'}
            </button>
            <button type="button" onClick={() => handleOwnerSave('WITHDRAWAL')}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#F43F5E,#E11D48)', boxShadow: '0 4px 12px rgba(244,63,94,0.3)' }}>
              ⬇ Personal
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={handleCashIn}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white uppercase tracking-wide transition-all active:scale-95"
              style={success && lastAction === 'IN'
                ? { background: '#34D399' }
                : { background: 'linear-gradient(135deg,#16A34A,#15803D)', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
              {success && lastAction === 'IN' ? '✓ Saved!' : 'Cash In'}
            </button>
            <button type="button" onClick={handleCashOut}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white uppercase tracking-wide transition-all active:scale-95"
              style={success && lastAction === 'OUT'
                ? { background: '#FB7185' }
                : { background: 'linear-gradient(135deg,#DC2626,#B91C1C)', boxShadow: '0 4px 12px rgba(220,38,38,0.35)' }}>
              {success && lastAction === 'OUT' ? '✓ Saved!' : 'Cash Out'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
