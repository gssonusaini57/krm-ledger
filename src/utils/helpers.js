import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export const TRANSACTION_TYPES = {
  CASH_IN: 'CASH_IN',
  EXPENSE: 'EXPENSE',
  OWNER_DEPOSIT: 'OWNER_DEPOSIT',
  OWNER_WITHDRAWAL: 'OWNER_WITHDRAWAL',
  ADVANCE_OUT: 'ADVANCE_OUT',       // Main Cash → Munim (Stage 1)
  ADVANCE_EXPENSE: 'ADVANCE_EXPENSE', // Munim account → Depo expense (Stage 2)
  ADVANCE_RETURN: 'ADVANCE_RETURN',   // Munim → Main Cash (Stage 3)
}

export const TYPE_LABELS = {
  CASH_IN: 'Credit',
  EXPENSE: 'Expense',
  OWNER_DEPOSIT: 'Owner Deposit',
  OWNER_WITHDRAWAL: 'Owner Withdrawal',
  ADVANCE_OUT: 'Advance Given',
  ADVANCE_EXPENSE: 'Depo Expense',
  ADVANCE_RETURN: 'Advance Returned',
}

export const INCOME_CATEGORIES = [
  { value: 'RICE_SALES',      label: 'Rice Sales'      },
  { value: 'PADDY_SALES',     label: 'Paddy Sales'     },
  { value: 'BROKEN_SELL',     label: 'Broken Sell'     },
  { value: 'HUSK_SELL',       label: 'Husk Sell'       },
  { value: 'BRAN_SELL',       label: 'Bran Sell'       },
  { value: 'MILLING_CHARGES', label: 'Milling Charges' },
  { value: 'BRAN_SALES',      label: 'Bran / Husk Sales' },
  { value: 'LOAN_RECEIVED',   label: 'Loan Received'   },
  { value: 'OTHER_INCOME',    label: 'Other Income'    },
]

export const EXPENSE_CATEGORIES = [
  { value: 'SALARY',           label: 'Salary' },
  { value: 'LABOUR',           label: 'Labour' },
  { value: 'BANK',             label: 'Bank' },
  { value: 'DEPOT_EXP',        label: 'Depot Exp' },
  { value: 'EXPENDITURE',      label: 'Expenditure' },
  { value: 'ASHOK_DEPOT',      label: 'Ashok Depot' },
  { value: 'TRUCK',            label: 'Truck' },
  { value: 'PANKAJ_PLASH',     label: 'Pankaj Plash' },
  { value: 'AMAN_PLASH',       label: 'Aman Plash' },
  { value: 'BROKEN_BUY',       label: 'Broken Buy' },
  { value: 'PADDY_PURCHASE',   label: 'Paddy Purchase' },
  { value: 'LABOUR_SALARY',    label: 'Labour / Salary' },
  { value: 'ELECTRICITY',      label: 'Electricity Bill' },
  { value: 'TRANSPORT',        label: 'Transport / Freight' },
  { value: 'MACHINE_MAINTENANCE', label: 'Machine Maintenance' },
  { value: 'GUNNY_BAGS',       label: 'Gunny Bags / Packaging' },
  { value: 'DIESEL_FUEL',      label: 'Diesel / Fuel' },
  { value: 'WATER_CHARGES',    label: 'Water Charges' },
  { value: 'BANK_CHARGES',     label: 'Bank / Interest Charges' },
  { value: 'TAX_GOVT',         label: 'Tax / Govt Fees' },
  { value: 'MISCELLANEOUS',    label: 'Miscellaneous' },
]

export const DEPO_EXPENSE_CATEGORIES = [
  { value: 'DEPO_LOADING',   label: 'Loading' },
  { value: 'DEPO_TRANSPORT', label: 'Transport / Freight' },
  { value: 'DEPO_TOLL',      label: 'Toll Charges' },
  { value: 'DEPO_LABOUR',    label: 'Labour' },
  { value: 'DEPO_TEA',       label: 'Tea / Food' },
  { value: 'DEPO_MISC',      label: 'Miscellaneous' },
]

export const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / Online' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
  { value: 'CHEQUE', label: 'Cheque' },
]

export const OWNER_COLORS = ['#3B82F6', '#10B981', '#F59E0B']

export function formatCurrency(amount, currency = '₹') {
  if (amount === undefined || amount === null) return `${currency}0`
  const absAmount = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount)
  return `${currency}${formatted}`
}

export function formatDate(dateStr) {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr) {
  try {
    return format(new Date(dateStr), 'dd/MM/yy')
  } catch {
    return dateStr
  }
}

export function formatMonthYear(dateStr) {
  try {
    return format(new Date(dateStr), 'MMM yyyy')
  } catch {
    return dateStr
  }
}

export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isInflow(type) {
  return type === TRANSACTION_TYPES.CASH_IN || type === TRANSACTION_TYPES.OWNER_DEPOSIT
}

export function isOutflow(type) {
  return type === TRANSACTION_TYPES.EXPENSE || type === TRANSACTION_TYPES.OWNER_WITHDRAWAL
}

export function transactionEffect(transaction) {
  return isInflow(transaction.type) ? transaction.amount : -transaction.amount
}

export function computeRunningBalance(transactions) {
  const sorted = [...transactions].sort((a, b) => {
    const d = new Date(a.date) - new Date(b.date)
    if (d !== 0) return d
    return new Date(a.createdAt) - new Date(b.createdAt)
  })
  let balance = 0
  const withBalance = sorted.map(t => {
    balance += transactionEffect(t)
    return { ...t, runningBalance: balance }
  })
  return withBalance.reverse()
}

export function getThisMonthRange() {
  const now = new Date()
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
  }
}

export function getTodayRange() {
  const now = new Date()
  return {
    from: startOfDay(now),
    to: endOfDay(now),
  }
}

export function groupByMonth(transactions) {
  const groups = {}
  transactions.forEach(t => {
    const key = format(new Date(t.date), 'yyyy-MM')
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return groups
}

export function getLast12Months() {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMM yy'),
    })
  }
  return months
}

const ADVANCE_CAT_LABELS = {
  ADVANCE_OUT:    'Advance Given',
  ADVANCE_RETURN: 'Advance Returned',
}

export function getCategoryLabel(catValue) {
  if (ADVANCE_CAT_LABELS[catValue]) return ADVANCE_CAT_LABELS[catValue]
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...DEPO_EXPENSE_CATEGORIES]
  return all.find(c => c.value === catValue)?.label || catValue
}

export function getPaymentModeLabel(val) {
  return PAYMENT_MODES.find(p => p.value === val)?.label || val
}
