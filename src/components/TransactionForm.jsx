import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, todayISO } from '../utils/helpers'

const MODES = [
  { key: 'IN',    label: '💰 Cash In'  },
  { key: 'OUT',   label: '💸 Cash Out' },
  { key: 'OWNER', label: '👤 Owner'    },
]

export default function TransactionForm({ onClose, editData = null, defaultTab = 'IN', defaultCategory = '' }) {
  const { owners, employees = [], addTransaction, updateTransaction } = useApp()

  const [tab, setTab]             = useState(defaultTab === 'OWNER' ? 'OWNER' : defaultTab === 'OUT' ? 'OUT' : 'IN')
  const [amount, setAmount]       = useState('')
  const [description, setDesc]    = useState('')
  const [category, setCategory]   = useState(defaultCategory)
  const [paymentMode, setPayment] = useState('CASH')
  const [ownerPaid, setOwnerPaid] = useState(false)
  const [ownerId, setOwnerId]     = useState(owners[0]?.id || '')
  const [ownerAction, setAction]  = useState('DEPOSIT')
  const [date, setDate]           = useState(todayISO())
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!editData) return
    if (editData.type === TRANSACTION_TYPES.CASH_IN)              setTab('IN')
    else if (editData.type === TRANSACTION_TYPES.EXPENSE)         setTab('OUT')
    else                                                           setTab('OWNER')
    setAmount(String(editData.amount))
    setDesc(editData.description || '')
    setCategory(editData.category || '')
    setPayment(editData.paymentMode === 'ONLINE' ? 'ONLINE' : 'CASH')
    setOwnerId(editData.ownerId || owners[0]?.id || '')
    setAction(editData.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL ? 'WITHDRAWAL' : 'DEPOSIT')
    setDate(editData.date || todayISO())
  }, [editData])

  const switchTab = (t) => { setTab(t); setOwnerPaid(false); setError('') }

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)                          return setError('Enter a valid amount')
    if (!description.trim())                       return setError('Enter a description')
    if (tab === 'OWNER' && !ownerId)               return setError('Select an owner')
    if (tab === 'OUT' && ownerPaid && !ownerId)    return setError('Select which owner paid')

    if (editData) {
      let type = TRANSACTION_TYPES.CASH_IN
      if (tab === 'OUT')   type = TRANSACTION_TYPES.EXPENSE
      if (tab === 'OWNER') type = ownerAction === 'DEPOSIT' ? TRANSACTION_TYPES.OWNER_DEPOSIT : TRANSACTION_TYPES.OWNER_WITHDRAWAL
      updateTransaction({ ...editData, date, amount: amt, description, category, paymentMode: tab === 'OUT' ? paymentMode : '', type, ownerId: tab === 'OWNER' ? ownerId : null })
      return onClose()
    }

    if (tab === 'IN') {
      addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.CASH_IN, paymentMode: '', ownerId: null })
    }
    if (tab === 'OUT') {
      addTransaction({ date, amount: amt, description, category, type: TRANSACTION_TYPES.EXPENSE, paymentMode, ownerId: null })
      if (ownerPaid && ownerId) {
        addTransaction({
          date, amount: amt,
          description: `${owners.find(o => o.id === ownerId)?.name} paid: ${description}`,
          category: '', type: TRANSACTION_TYPES.OWNER_DEPOSIT, paymentMode: '', ownerId,
        })
      }
    }
    if (tab === 'OWNER') {
      const type = ownerAction === 'DEPOSIT' ? TRANSACTION_TYPES.OWNER_DEPOSIT : TRANSACTION_TYPES.OWNER_WITHDRAWAL
      addTransaction({ date, amount: amt, description, category: '', type, paymentMode: '', ownerId })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">

        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{editData ? 'Edit Entry' : 'New Entry'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 pb-6 space-y-4">

          {/* Mode tabs */}
          {!editData && (
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#F1F5F9' }}>
              {MODES.map(m => (
                <button key={m.key} type="button" onClick={() => switchTab(m.key)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
                  style={tab === m.key
                    ? { background: 'linear-gradient(135deg, #1E293B, #334155)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                    : { color: '#94A3B8' }
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Date + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
              <input type="number" min="1" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
            <input type="text" placeholder="What is this for?" value={description} onChange={e => setDesc(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" />
          </div>

          {/* Category */}
          {(tab === 'IN' || tab === 'OUT') && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all">
                <option value="">Select category...</option>
                {(tab === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Employee picker — Salary or Labour category */}
          {tab === 'OUT' && (category === 'SALARY' || category === 'LABOUR') && (() => {
            const isSalary   = category === 'SALARY'
            const pool       = isSalary
              ? employees.filter(e => e.type === 'FIXED')
              : employees.filter(e => e.type === 'VARIABLE')
            if (pool.length === 0) return null
            return (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  {isSalary ? 'Select Employee' : 'Select Worker'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {pool.map(emp => (
                    <button key={emp.id} type="button"
                      onClick={() => {
                        setDesc(`${isSalary ? 'Salary' : 'Labour'} - ${emp.name}`)
                        if (isSalary && emp.salary) setAmount(String(emp.salary))
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                      style={{ borderColor: isSalary ? '#8B5CF6' : '#F97316', background: isSalary ? '#F5F3FF' : '#FFF7ED', color: isSalary ? '#7C3AED' : '#EA580C' }}
                    >
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: isSalary ? '#8B5CF6' : '#F97316' }}>
                        {emp.name.charAt(0).toUpperCase()}
                      </span>
                      {emp.name}
                      {isSalary && emp.salary ? <span className="text-xs opacity-60">₹{Number(emp.salary).toLocaleString('en-IN')}</span> : null}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Tap a name to auto-fill</p>
              </div>
            )
          })()}

          {/* Cash / Online — Cash Out only */}
          {tab === 'OUT' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Paid via</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ key: 'CASH', icon: '💵', label: 'Cash' }, { key: 'ONLINE', icon: '📱', label: 'Online' }].map(opt => (
                  <button key={opt.key} type="button" onClick={() => setPayment(opt.key)}
                    className="py-3 rounded-2xl text-sm font-bold border-2 transition-all"
                    style={paymentMode === opt.key
                      ? { borderColor: '#3B82F6', background: '#EFF6FF', color: '#2563EB' }
                      : { borderColor: '#E2E8F0', background: '#F8FAFC', color: '#94A3B8' }
                    }
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Owner paid this? — Cash Out only */}
          {tab === 'OUT' && !editData && (
            <div className="rounded-2xl border-2 p-4 transition-all"
              style={ownerPaid ? { borderColor: '#F59E0B', background: '#FFFBEB' } : { borderColor: '#E2E8F0', background: '#F8FAFC' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setOwnerPaid(v => !v)}
                  className="w-11 h-6 rounded-full relative cursor-pointer flex-shrink-0 transition-colors"
                  style={{ background: ownerPaid ? '#F59E0B' : '#CBD5E1' }}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${ownerPaid ? 'left-5' : 'left-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Owner paid from their pocket?</p>
                  <p className="text-xs text-gray-400 mt-0.5">e.g. owner paid truck driver directly</p>
                </div>
              </label>
              {ownerPaid && (
                <div className="mt-3">
                  <select value={ownerId} onChange={e => setOwnerId(e.target.value)}
                    className="w-full bg-white border-2 border-amber-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all">
                    <option value="">Select owner...</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                  {ownerId && (
                    <p className="text-xs text-amber-700 mt-2 font-medium">
                      ✓ Expense recorded · {owners.find(o => o.id === ownerId)?.name} will be credited automatically
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Owner fields */}
          {tab === 'OWNER' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Owner</label>
                <select value={ownerId} onChange={e => setOwnerId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all">
                  <option value="">Select owner...</option>
                  {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'DEPOSIT',    label: '⬆ Deposited',     active: { borderColor: '#10B981', background: '#ECFDF5', color: '#059669' } },
                  { key: 'WITHDRAWAL', label: '⬇ Personal Use',  active: { borderColor: '#F43F5E', background: '#FFF1F2', color: '#E11D48' } },
                ].map(opt => (
                  <button key={opt.key} type="button" onClick={() => setAction(opt.key)}
                    className="py-3 rounded-2xl text-xs font-bold border-2 transition-all"
                    style={ownerAction === opt.key
                      ? opt.active
                      : { borderColor: '#E2E8F0', background: '#F8FAFC', color: '#94A3B8' }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
