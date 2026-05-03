import { useMemo } from 'react'
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TRANSACTION_TYPES, formatCurrency, isInflow, getCategoryLabel } from '../utils/helpers'
import { format, isToday, isYesterday } from 'date-fns'

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMMM yyyy')
}

export default function PartnerDetail({ partner, onClose }) {
  const { transactions, settings } = useApp()

  // All transactions belonging to this partner.
  // EXPENSE entries linked via partnerId are excluded — those are mill expenses
  // and should not appear as Debits in the partner's ledger. Only OWNER_DEPOSIT,
  // OWNER_WITHDRAWAL, and CASH_IN linked entries belong here.
  const partnerTxns = useMemo(() =>
    transactions
      .filter(t => {
        if (t.ownerId === partner.id) return true
        if (t.partnerId === partner.id && t.type !== TRANSACTION_TYPES.EXPENSE) return true
        return false
      })
      .sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt)),
    [transactions, partner.id]
  )

  // Summary — total in vs total out for this partner
  const summary = useMemo(() => {
    let totalIn = 0, totalOut = 0
    partnerTxns.forEach(t => {
      if (isInflow(t.type)) totalIn  += t.amount
      else                  totalOut += t.amount
    })
    return { totalIn, totalOut, net: totalIn - totalOut }
  }, [partnerTxns])

  // Group by date
  const grouped = useMemo(() => {
    const map = {}
    partnerTxns.forEach(t => {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [partnerTxns])

  const color = partner.color || '#3B82F6'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-5" style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                {partner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{partner.name}</p>
                <p className="text-xs font-medium mt-0.5"
                  style={{ color: summary.net >= 0 ? '#059669' : '#E11D48' }}>
                  {summary.net >= 0 ? 'Company owes' : 'Partner owes'} {formatCurrency(Math.abs(summary.net), settings.currency)}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-gray-400 shadow-sm">
              <X size={16} />
            </button>
          </div>

          {/* 2 summary boxes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight size={11} color="#10B981" />
                </div>
                <p className="text-xs text-gray-400 font-medium">Total Received</p>
              </div>
              <p className="font-bold text-emerald-600 text-lg">{formatCurrency(summary.totalIn, settings.currency)}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                  <ArrowDownRight size={11} color="#F43F5E" />
                </div>
                <p className="text-xs text-gray-400 font-medium">Total Paid Out</p>
              </div>
              <p className="font-bold text-rose-500 text-lg">{formatCurrency(summary.totalOut, settings.currency)}</p>
            </div>
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          ) : (
            grouped.map(([date, txns]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dayLabel(date)}</p>
                  <div className="flex-1 h-px bg-gray-100" />
                  <p className="text-xs text-gray-400 font-medium">
                    {formatCurrency(
                      txns.reduce((s, t) => s + (isInflow(t.type) ? t.amount : -t.amount), 0),
                      settings.currency
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  {txns.map(t => {
                    const inflow = isInflow(t.type)
                    const isLinked = t.partnerId === partner.id
                    const isBank = t.paymentMode === 'ONLINE'
                    const typeLabel =
                      t.type === TRANSACTION_TYPES.OWNER_DEPOSIT   ? (isBank ? '🏦 Deposited (Bank)' : '💵 Deposited (Cash)') :
                      t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL ? (isBank ? '🏦 Paid (Bank)'     : '💵 Paid (Cash)')      :
                      t.type === TRANSACTION_TYPES.CASH_IN          ? 'Linked Credit' :
                                                                       'Linked Debit'
                    return (
                      <div key={t.id} className="bg-gray-50 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: inflow ? '#ECFDF5' : '#FFF1F2' }}>
                          {inflow
                            ? <ArrowUpRight size={18} color="#10B981" />
                            : <ArrowDownRight size={18} color="#F43F5E" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{t.description}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: isLinked ? `${color}18` : '#F1F5F9', color: isLinked ? color : '#64748B' }}>
                              {typeLabel}
                            </span>
                            {t.category && (
                              <span className="text-xs text-gray-400">{getCategoryLabel(t.category)}</span>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-sm flex-shrink-0"
                          style={{ color: inflow ? '#10B981' : '#F43F5E' }}>
                          {inflow ? '+' : '-'}{formatCurrency(t.amount, settings.currency)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
