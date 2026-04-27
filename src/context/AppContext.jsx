import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import { isInflow, TRANSACTION_TYPES } from '../utils/helpers'

const AppContext = createContext()

const DEFAULT_OWNERS = [
  { id: 'owner-1', name: 'Karamjit Singh',   phone: '', sharePercent: 34, color: '#3B82F6' },
  { id: 'owner-2', name: 'Sukhwinder Singh', phone: '', sharePercent: 33, color: '#10B981' },
  { id: 'owner-3', name: 'Jaswinder Singh',  phone: '', sharePercent: 33, color: '#F59E0B' },
]

const DEFAULT_SETTINGS = {
  companyName: 'KRM Rice Mill',
  currency: '₹',
  openingBalance: 0,
}

export function AppProvider({ children }) {
  const [owners, setOwners]           = useState(DEFAULT_OWNERS)
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS)
  const [employees, setEmployees]     = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]         = useState(true)

  // Listen to config (owners, settings, employees)
  useEffect(() => {
    const configRef = doc(db, 'config', 'main')
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        let ownersData = data.owners || DEFAULT_OWNERS
        // Auto-migrate generic "Owner 1/2/3" names to real partner names
        if (ownersData.some(o => /^Owner \d$/.test(o.name))) {
          ownersData = ownersData.map((o, i) => ({ ...o, name: DEFAULT_OWNERS[i]?.name || o.name }))
          setDoc(configRef, { owners: ownersData }, { merge: true })
        }
        setOwners(ownersData)
        if (data.settings)  setSettings(data.settings)
        if (data.employees) setEmployees(data.employees)
      } else {
        setDoc(configRef, {
          owners: DEFAULT_OWNERS,
          settings: DEFAULT_SETTINGS,
          employees: [],
        })
      }
    })
    return () => unsub()
  }, [])

  // Listen to transactions
  useEffect(() => {
    const txnsRef = collection(db, 'transactions')
    const unsub = onSnapshot(txnsRef, (snap) => {
      const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setTransactions(txns)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const updateConfig = (updates) =>
    setDoc(doc(db, 'config', 'main'), updates, { merge: true })

  const addTransaction = (data) =>
    addDoc(collection(db, 'transactions'), { ...data, createdAt: new Date().toISOString() })

  const updateTransaction = ({ id, ...rest }) =>
    updateDoc(doc(db, 'transactions', id), rest)

  const deleteTransaction = (id) =>
    deleteDoc(doc(db, 'transactions', id))

  const updateOwner = (owner) => {
    const newOwners = owners.map(o => o.id === owner.id ? owner : o)
    setOwners(newOwners)
    updateConfig({ owners: newOwners })
  }

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings }
    setSettings(merged)
    updateConfig({ settings: merged })
  }

  const addEmployee = (emp) => {
    const newEmps = [...employees, { ...emp, id: uuidv4() }]
    setEmployees(newEmps)
    updateConfig({ employees: newEmps })
  }

  const updateEmployee = (emp) => {
    const newEmps = employees.map(e => e.id === emp.id ? emp : e)
    setEmployees(newEmps)
    updateConfig({ employees: newEmps })
  }

  const deleteEmployee = (id) => {
    const newEmps = employees.filter(e => e.id !== id)
    setEmployees(newEmps)
    updateConfig({ employees: newEmps })
  }

  const getCompanyBalance = (txns = transactions) => {
    const opening = settings.openingBalance || 0
    return txns.reduce((bal, t) => bal + (isInflow(t.type) ? t.amount : -t.amount), opening)
  }

  const getOwnerBalance = (ownerId) =>
    transactions
      .filter(t => t.ownerId === ownerId)
      .reduce((bal, t) => {
        if (t.type === TRANSACTION_TYPES.OWNER_DEPOSIT)    return bal + t.amount
        if (t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL) return bal - t.amount
        return bal
      }, 0)

  // Returns partner's own deposits/withdrawals + any Cash In/Out linked to them
  const getOwnerTransactions = (ownerId) =>
    transactions.filter(t => t.ownerId === ownerId || t.partnerId === ownerId)

  const getTotals = (txns) => {
    let inflow = 0, outflow = 0
    txns.forEach(t => {
      if (isInflow(t.type)) inflow += t.amount
      else outflow += t.amount
    })
    return { inflow, outflow, net: inflow - outflow }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F1F5F9' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#F59E0B' }}>
            <span className="text-3xl">🌾</span>
          </div>
          <p className="text-gray-600 font-semibold text-lg">KRM Ledger</p>
          <p className="text-gray-400 text-sm mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      owners, transactions, employees, settings,
      addTransaction, updateTransaction, deleteTransaction,
      updateOwner, updateSettings,
      addEmployee, updateEmployee, deleteEmployee,
      getCompanyBalance, getOwnerBalance, getOwnerTransactions, getTotals,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
