import { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { isInflow, isOutflow, TRANSACTION_TYPES } from '../utils/helpers'

const AppContext = createContext()

const DEFAULT_OWNERS = [
  { id: 'owner-1', name: 'Owner 1', phone: '', sharePercent: 40, color: '#3B82F6' },
  { id: 'owner-2', name: 'Owner 2', phone: '', sharePercent: 35, color: '#10B981' },
  { id: 'owner-3', name: 'Owner 3', phone: '', sharePercent: 25, color: '#F59E0B' },
]

const DEFAULT_SETTINGS = {
  companyName: 'KRM Rice Mill',
  currency: '₹',
  openingBalance: 0,
}

function buildInitialState() {
  return {
    owners: DEFAULT_OWNERS,
    transactions: [],
    employees: [],
    settings: DEFAULT_SETTINGS,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }
    case 'UPDATE_OWNER':
      return { ...state, owners: state.owners.map(o => (o.id === action.payload.id ? action.payload : o)) }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...(state.employees || []), action.payload] }
    case 'UPDATE_EMPLOYEE':
      return { ...state, employees: (state.employees || []).map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DELETE_EMPLOYEE':
      return { ...state, employees: (state.employees || []).filter(e => e.id !== action.payload) }
    default:
      return state
  }
}

function loadState() {
  try {
    localStorage.removeItem('krm-ledger-v1') // clear old seed data
    const raw = localStorage.getItem('krm-ledger-v2')
    if (raw) return JSON.parse(raw)
  } catch {}
  return buildInitialState()
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem('krm-ledger-v2', JSON.stringify(state))
  }, [state])

  const addTransaction = data =>
    dispatch({ type: 'ADD_TRANSACTION', payload: { ...data, id: uuidv4(), createdAt: new Date().toISOString() } })

  const updateTransaction = data => dispatch({ type: 'UPDATE_TRANSACTION', payload: data })
  const deleteTransaction = id => dispatch({ type: 'DELETE_TRANSACTION', payload: id })
  const updateOwner    = data => dispatch({ type: 'UPDATE_OWNER', payload: data })
  const updateSettings = data => dispatch({ type: 'UPDATE_SETTINGS', payload: data })
  const addEmployee    = data => dispatch({ type: 'ADD_EMPLOYEE', payload: { ...data, id: uuidv4() } })
  const updateEmployee = data => dispatch({ type: 'UPDATE_EMPLOYEE', payload: data })
  const deleteEmployee = id   => dispatch({ type: 'DELETE_EMPLOYEE', payload: id })

  const getCompanyBalance = (txns = state.transactions) => {
    const opening = state.settings.openingBalance || 0
    return txns.reduce((bal, t) => bal + (isInflow(t.type) ? t.amount : -t.amount), opening)
  }

  const getOwnerBalance = ownerId => {
    return state.transactions
      .filter(t => t.ownerId === ownerId)
      .reduce((bal, t) => {
        if (t.type === TRANSACTION_TYPES.OWNER_DEPOSIT) return bal + t.amount
        if (t.type === TRANSACTION_TYPES.OWNER_WITHDRAWAL) return bal - t.amount
        return bal
      }, 0)
  }

  const getOwnerTransactions = ownerId =>
    state.transactions.filter(t => t.ownerId === ownerId)

  const getTotals = (txns) => {
    let inflow = 0, outflow = 0
    txns.forEach(t => {
      if (isInflow(t.type)) inflow += t.amount
      else outflow += t.amount
    })
    return { inflow, outflow, net: inflow - outflow }
  }

  return (
    <AppContext.Provider value={{
      ...state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateOwner,
      updateSettings,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      getCompanyBalance,
      getOwnerBalance,
      getOwnerTransactions,
      getTotals,
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
