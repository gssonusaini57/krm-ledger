import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, todayISO, TRANSACTION_TYPES, DEPO_EXPENSE_CATEGORIES } from '../utils/helpers'
import { Plus, Trash2 } from 'lucide-react'
import DateInput from './DateInput'

export default function DepoExpenseForm({ mode = 'advance' }) {
  const { addTransaction, getMunimBalance, settings } = useApp()
  const cur = settings.currency || '₹'
  const munimBalance = getMunimBalance()

  // stage: 1=advance, 2=log expenses, 3=return cash
  const [stage, setStage]     = useState(mode === 'settle' ? 2 : 1)

  // sync stage when mode prop changes (e.g. user clicks different sidebar item)
  useEffect(() => {
    setStage(mode === 'settle' ? 2 : 1)
  }, [mode])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState('')   // brief success flash

  // Stage 1
  const [advDate,   setAdvDate]   = useState(todayISO())
  const [advAmount, setAdvAmount] = useState('')
  const [advNote,   setAdvNote]   = useState('Cash to Munim')

  // Stage 2
  const [expDate, setExpDate] = useState(todayISO())
  const [items,   setItems]   = useState([{ category: '', amount: '', note: '' }])

  // Stage 3
  const [retDate,   setRetDate]   = useState(todayISO())
  const [retAmount, setRetAmount] = useState('')

  // Keep return amount synced when munim balance changes or stage switches to 3
  useEffect(() => {
    if (stage === 3) setRetAmount(munimBalance > 0 ? String(Math.round(munimBalance)) : '')
  }, [munimBalance, stage])

  // ── Item helpers ──────────────────────────────────────────────────────────
  const addItem    = () => setItems(p => [...p, { category: '', amount: '', note: '' }])
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i))
  const updateItem = (i, field, val) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const validItems  = items.filter(it => it.category && parseFloat(it.amount) > 0)
  const totalExpAmt = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0)

  const flash = (msg) => { setSaved(msg); setTimeout(() => setSaved(''), 2500) }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStage1 = async (e) => {
    e.preventDefault()
    const amt = parseFloat(advAmount)
    if (!amt || amt <= 0) return
    setLoading(true)
    await addTransaction({
      type: TRANSACTION_TYPES.ADVANCE_OUT,
      amount: amt,
      date: advDate,
      description: advNote || 'Advance to Munim',
      category: 'ADVANCE_OUT',
      paymentMode: 'CASH',
    })
    setAdvAmount('')
    setAdvNote('Cash to Munim')
    setLoading(false)
    flash(`✓ ${formatCurrency(amt, cur)} given to Munim`)
  }

  const handleStage2 = async (e) => {
    e.preventDefault()
    if (!validItems.length) return
    setLoading(true)
    for (const it of validItems) {
      const label = DEPO_EXPENSE_CATEGORIES.find(c => c.value === it.category)?.label || it.category
      await addTransaction({
        type: TRANSACTION_TYPES.ADVANCE_EXPENSE,
        amount: parseFloat(it.amount),
        date: expDate,
        description: it.note || label,
        category: it.category,
        paymentMode: 'CASH',
      })
    }
    setItems([{ category: '', amount: '', note: '' }])
    setLoading(false)
    flash(`✓ ${validItems.length} expense(s) recorded from Munim account`)
  }

  const handleStage3 = async (e) => {
    e.preventDefault()
    const amt = parseFloat(retAmount)
    if (!amt || amt <= 0) return
    setLoading(true)
    await addTransaction({
      type: TRANSACTION_TYPES.ADVANCE_RETURN,
      amount: amt,
      date: retDate,
      description: 'Cash returned from Munim',
      category: 'ADVANCE_RETURN',
      paymentMode: 'CASH',
    })
    setRetAmount('')
    setLoading(false)
    flash(`✓ ${formatCurrency(amt, cur)} returned to Main Cash`)
  }

  return (
    <div style={{ margin: '0 12px 16px' }}>

      {/* ── Munim Balance Card ─────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 mb-3 flex items-center justify-between"
        style={{
          background: munimBalance > 0 ? '#FFFBEB' : '#ECFDF5',
          border: `1px solid ${munimBalance > 0 ? '#FDE68A' : '#A7F3D0'}`,
        }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
            Munim / Depo Advance
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: munimBalance > 0 ? '#D97706' : '#059669', lineHeight: 1.1 }}>
            {formatCurrency(munimBalance, cur)}
          </p>
          <p style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>
            {munimBalance > 0 ? 'Outstanding with Munim' : 'Fully settled ✓'}
          </p>
        </div>
        <div style={{ fontSize: 36 }}>{munimBalance > 0 ? '🧾' : '✅'}</div>
      </div>

      {/* ── Settle: 2-button sub-tab (Log Expenses | Return Cash) ────────── */}
      {mode === 'settle' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[
            { id: 2, label: '📋 Log Expenses', color: '#EF4444' },
            { id: 3, label: '← Return Cash',  color: '#10B981' },
          ].map(s => (
            <button key={s.id} onClick={() => setStage(s.id)}
              className="rounded-xl py-2.5 px-3 text-center font-bold text-sm transition-all"
              style={stage === s.id
                ? { background: s.color, color: '#fff', border: `2px solid ${s.color}` }
                : { background: '#F8FAFC', color: '#64748B', border: '2px solid #E2E8F0' }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Success Flash ─────────────────────────────────────────────────── */}
      {saved && (
        <div className="rounded-xl px-4 py-2.5 mb-3 text-center text-sm font-semibold"
          style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
          {saved}
        </div>
      )}

      {/* ── Stage 1: Give Advance ─────────────────────────────────────────── */}
      {stage === 1 && (
        <form onSubmit={handleStage1}
          className="bg-white rounded-xl p-4 shadow-sm space-y-3"
          style={{ border: '1px solid #FDE68A' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1 }}>
            Give Advance to Munim
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
              <DateInput value={advDate} onChange={e => setAdvDate(e.target.value)} required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#F9FAFB' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount ({cur})</label>
              <input type="number" value={advAmount} onChange={e => setAdvAmount(e.target.value)}
                placeholder="0" min="1" required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#F9FAFB', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Note</label>
            <input type="text" value={advNote} onChange={e => setAdvNote(e.target.value)}
              placeholder="e.g. Advance for Depo work"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#F9FAFB', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl py-2.5 font-bold text-white text-sm transition-all active:scale-95"
            style={{ background: loading ? '#9CA3AF' : '#F59E0B' }}>
            {loading ? 'Recording…' : `Give ${advAmount ? formatCurrency(parseFloat(advAmount), cur) : 'Advance'} to Munim →`}
          </button>
        </form>
      )}

      {/* ── Stage 2: Log Expenses ─────────────────────────────────────────── */}
      {stage === 2 && (
        <form onSubmit={handleStage2}
          className="bg-white rounded-xl p-4 shadow-sm space-y-3"
          style={{ border: '1px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: 1 }}>
              Log Depo Expenses
            </p>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
              Munim holds:{' '}
              <span style={{ fontWeight: 700, color: munimBalance > 0 ? '#D97706' : '#DC2626' }}>
                {formatCurrency(munimBalance, cur)}
              </span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
            <DateInput value={expDate} onChange={e => setExpDate(e.target.value)} required
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#F9FAFB' }} />
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 1.5fr 28px', gap: 6 }}>
            {['Category', 'Amount', 'Note / Description', ''].map(h => (
              <p key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</p>
            ))}
          </div>

          {/* Line items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 1.5fr 28px', gap: 6, alignItems: 'center' }}>
                <select value={it.category} onChange={e => updateItem(i, 'category', e.target.value)} required
                  style={{ padding: '7px 8px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, background: '#F9FAFB', outline: 'none' }}>
                  <option value="">Select…</option>
                  {DEPO_EXPENSE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input type="number" value={it.amount} onChange={e => updateItem(i, 'amount', e.target.value)}
                  placeholder="0" min="0" required
                  style={{ padding: '7px 8px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, background: '#F9FAFB', outline: 'none', width: '100%' }} />
                <input type="text" value={it.note} onChange={e => updateItem(i, 'note', e.target.value)}
                  placeholder="Optional note"
                  style={{ padding: '7px 8px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, background: '#F9FAFB', outline: 'none', width: '100%' }} />
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                  style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: items.length === 1 ? 'transparent' : '#FEE2E2', cursor: items.length === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {items.length > 1 && <Trash2 size={12} color="#F43F5E" />}
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ border: '2px dashed #E2E8F0', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#F43F5E' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#94A3B8' }}>
            <Plus size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Add Expense Line
          </button>

          {/* Totals */}
          {totalExpAmt > 0 && (
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Total Expenses</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>{formatCurrency(totalExpAmt, cur)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Munim Remaining</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: munimBalance - totalExpAmt >= 0 ? '#D97706' : '#DC2626' }}>
                  {formatCurrency(Math.max(0, munimBalance - totalExpAmt), cur)}
                </span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !validItems.length}
            className="w-full rounded-xl py-2.5 font-bold text-white text-sm transition-all active:scale-95"
            style={{ background: loading || !validItems.length ? '#9CA3AF' : '#EF4444' }}>
            {loading ? 'Recording…' : `Record ${validItems.length} Expense${validItems.length !== 1 ? 's' : ''} from Munim Account`}
          </button>
        </form>
      )}

      {/* ── Stage 3: Return Cash ──────────────────────────────────────────── */}
      {stage === 3 && (
        <form onSubmit={handleStage3}
          className="bg-white rounded-xl p-4 shadow-sm space-y-3"
          style={{ border: '1px solid #A7F3D0' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 1 }}>
            Return Cash to Main
          </p>

          {/* Outstanding balance display */}
          <div style={{ borderRadius: 10, padding: '12px 14px', background: munimBalance > 0 ? '#FFFBEB' : '#ECFDF5', border: `1px solid ${munimBalance > 0 ? '#FDE68A' : '#A7F3D0'}` }}>
            <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Munim Outstanding Balance</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: munimBalance > 0 ? '#D97706' : '#059669' }}>
              {formatCurrency(munimBalance, cur)}
            </p>
            {munimBalance <= 0 && (
              <p style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>Nothing to return — account is settled.</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
              <DateInput value={retDate} onChange={e => setRetDate(e.target.value)} required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#F9FAFB' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Return Amount ({cur})</label>
              <input type="number" value={retAmount} onChange={e => setRetAmount(e.target.value)}
                placeholder={String(munimBalance > 0 ? Math.round(munimBalance) : 0)}
                min="0" max={munimBalance} required
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: '#F9FAFB', outline: 'none' }} />
            </div>
          </div>

          <button type="submit" disabled={loading || munimBalance <= 0}
            className="w-full rounded-xl py-2.5 font-bold text-white text-sm transition-all active:scale-95"
            style={{ background: loading ? '#9CA3AF' : munimBalance <= 0 ? '#9CA3AF' : '#10B981' }}>
            {loading
              ? 'Recording…'
              : munimBalance <= 0
                ? 'Account already settled'
                : `← Return ${retAmount ? formatCurrency(parseFloat(retAmount), cur) : formatCurrency(munimBalance, cur)} to Main Cash`}
          </button>
        </form>
      )}
    </div>
  )
}
