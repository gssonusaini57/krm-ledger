import { useState, useMemo } from 'react'
import { Plus, ArrowUpRight, ArrowDownRight, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import TransactionForm from '../components/TransactionForm'
import {
  formatCurrency, formatDate, TRANSACTION_TYPES, OWNER_COLORS, computeRunningBalance
} from '../utils/helpers'

function OwnerCard({ owner, balance, deposits, withdrawals, isSelected, onSelect, currency }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        isSelected ? 'border-current shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={isSelected ? { borderColor: owner.color } : {}}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: owner.color }}
        >
          {owner.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{owner.name}</p>
          <p className="text-xs text-gray-400">{owner.sharePercent}% ownership share</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Deposited</span>
          <span className="text-green-600 font-medium">{formatCurrency(deposits, currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Personal Withdrawals</span>
          <span className="text-red-500 font-medium">{formatCurrency(withdrawals, currency)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2">
          <span>Net Balance</span>
          <span style={{ color: balance >= 0 ? '#16a34a' : '#ef4444' }}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance, currency)}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function OwnerAccounts() {
  const { transactions, owners, settings, getOwnerBalance } = useApp()
  const [selectedOwner, setSelectedOwner] = useState(owners[0]?.id || '')
  const [showForm, setShowForm] = useState(false)
  const [defaultType, setDefaultType] = useState(TRANSACTION_TYPES.OWNER_DEPOSIT)

  const openDeposit = () => { setDefaultType(TRANSACTION_TYPES.OWNER_DEPOSIT); setShowForm(true) }
  const openWithdrawal = () => { setDefaultType(TRANSACTION_TYPES.OWNER_WITHDRAWAL); setShowForm(true) }

  const getOwnerStats = (ownerId) => {
    const ownerTxns = transactions.filter(t => t.ownerId === ownerId)
    const deposits = ownerTxns
      .filter(t => t.type === TRANSACTION_TYPES.OWNER_DEPOSIT)
      .reduce((s, t) => s + t.amount, 0)
    const withdrawals = ownerTxns
      .filter(t => t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL)
      .reduce((s, t) => s + t.amount, 0)
    return { deposits, withdrawals }
  }

  const selectedOwnerObj = owners.find(o => o.id === selectedOwner)

  const ownerTxns = useMemo(() => {
    const txns = transactions.filter(t => t.ownerId === selectedOwner)
    return computeRunningBalance(txns)
  }, [transactions, selectedOwner])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Owner Accounts</h1>
        <div className="flex gap-2">
          <button
            onClick={openDeposit}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <ArrowUpRight size={15} />
            Deposit
          </button>
          <button
            onClick={openWithdrawal}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            <ArrowDownRight size={15} />
            Withdrawal
          </button>
        </div>
      </div>

      {/* Owner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {owners.map((owner, i) => {
          const { deposits, withdrawals } = getOwnerStats(owner.id)
          const balance = getOwnerBalance(owner.id)
          return (
            <OwnerCard
              key={owner.id}
              owner={{ ...owner, color: owner.color || OWNER_COLORS[i] }}
              balance={balance}
              deposits={deposits}
              withdrawals={withdrawals}
              isSelected={selectedOwner === owner.id}
              onSelect={() => setSelectedOwner(owner.id)}
              currency={settings.currency}
            />
          )
        })}
      </div>

      {/* Selected owner transactions */}
      {selectedOwnerObj && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: selectedOwnerObj.color }}
            >
              {selectedOwnerObj.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {selectedOwnerObj.name} — Transaction History
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deposit</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Withdrawal</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ownerTxns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        No transactions for {selectedOwnerObj.name} yet.
                      </td>
                    </tr>
                  ) : (
                    ownerTxns.map(t => {
                      const isDeposit = t.type === TRANSACTION_TYPES.OWNER_DEPOSIT
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(t.date)}</td>
                          <td className="px-4 py-3">
                            <p className="text-gray-900">{t.description}</p>
                            {t.notes && <p className="text-xs text-gray-400">{t.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {isDeposit ? formatCurrency(t.amount, settings.currency) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-red-500 font-medium">
                            {!isDeposit ? formatCurrency(t.amount, settings.currency) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${t.runningBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                            {formatCurrency(t.runningBalance, settings.currency)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Balance explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How Owner Balance works:</p>
        <ul className="space-y-1 text-blue-700 list-disc list-inside">
          <li><strong>Positive balance</strong>: Owner has deposited more than withdrawn — company owes this amount to the owner.</li>
          <li><strong>Negative balance</strong>: Owner has taken out more than deposited — owner owes this amount to the company.</li>
        </ul>
      </div>

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
