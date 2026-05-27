import { useState } from 'react'
import { X, Pencil, Trash2, Check, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'

// These are hardcoded in InlineAddForm — they use the accounting engine
// and cannot be renamed/deleted without code changes.
const SYSTEM_CHIPS = [
  { value: 'SALARY',       label: 'Salary'      },
  { value: 'LABOUR',       label: 'Labour'      },
  { value: 'BANK',         label: 'Bank'        },
  { value: 'EXPENDITURE',  label: 'Expense'     },
  { value: 'ASHOK_DEPOT',  label: 'Ashok'       },
  { value: 'TRUCK',        label: 'Truck'       },
  { value: 'PANKAJ_PLASH', label: 'Pankaj'      },
  { value: 'AMAN_PLASH',   label: 'Aman'        },
  { value: 'BROKEN_BUY',   label: 'Broken Buy'  },
  { value: 'BROKEN_SELL',  label: 'Broken Sell' },
  { value: 'HUSK_SELL',    label: 'Husk Sell'   },
  { value: 'BRAN_SELL',    label: 'Bran Sell'   },
]

export default function ManageCategoriesModal({ onClose }) {
  const { customCategories, updateCustomCategory, deleteCustomCategory } = useApp()

  const [editingId,    setEditingId]    = useState(null)
  const [editLabel,    setEditLabel]    = useState('')
  const [confirmDelId, setConfirmDelId] = useState(null)

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditLabel(cat.label)
    setConfirmDelId(null)
  }

  const saveEdit = (cat) => {
    const label = editLabel.trim()
    if (!label) return
    updateCustomCategory({ ...cat, label })
    setEditingId(null)
  }

  const executeDelete = (id) => {
    deleteCustomCategory(id)
    setConfirmDelId(null)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <h2 className="text-base font-bold text-gray-900">Manage Categories</h2>
            <p className="text-xs text-gray-400 mt-0.5">Rename or remove your custom shortcuts</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Custom categories ── */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#6366F1' }}>
              Custom Shortcuts
              <span className="ml-1 font-semibold text-gray-400">({customCategories.length})</span>
            </p>

            {customCategories.length === 0 ? (
              <div className="text-center py-8 rounded-2xl text-gray-400 text-sm"
                style={{ background: '#F8FAFC', border: '1.5px dashed #E2E8F0' }}>
                No custom categories yet.
                <span className="block text-xs mt-1 text-gray-300">
                  Tap <strong className="text-indigo-400">+ New</strong> in the form to add one.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {customCategories.map(cat => (
                  <div key={cat.id}
                    className="px-3 py-2.5 rounded-xl"
                    style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>

                    {/* ── Inline rename mode ── */}
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: cat.color }} />
                        <input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveEdit(cat)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="flex-1 border border-blue-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(cat)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: '#059669' }}
                          title="Save (Enter)">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                          title="Cancel (Esc)">
                          <X size={12} />
                        </button>
                      </div>

                    /* ── Inline delete confirm ── */
                    ) : confirmDelId === cat.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex-1 text-xs font-semibold text-rose-600" style={{ minWidth: 120 }}>
                          Remove "<strong>{cat.label}</strong>"?
                          <span className="block font-normal text-gray-400 mt-0.5">
                            Existing transactions keep their category tag.
                          </span>
                        </span>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => executeDelete(cat.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                            style={{ background: '#EF4444' }}>
                            Delete
                          </button>
                          <button onClick={() => setConfirmDelId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200">
                            Cancel
                          </button>
                        </div>
                      </div>

                    /* ── Normal row ── */
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: cat.color }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {cat.type === 'EXPENSE' ? '💸 Expense' : '💰 Income'}
                          </span>
                        </div>
                        <button onClick={() => startEdit(cat)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Rename">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => { setConfirmDelId(cat.id); setEditingId(null) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── System (locked) categories ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lock size={10} className="text-gray-400" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Built-in (Locked)
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SYSTEM_CHIPS.map(c => (
                <span key={c.value}
                  className="px-2 py-1 rounded-lg text-xs font-semibold border"
                  style={{ background: '#F8FAFC', color: '#94A3B8', borderColor: '#E2E8F0' }}>
                  {c.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              These are core accounting categories used by the system and cannot be changed.
              Create new custom shortcuts above if you need a different name.
            </p>
          </div>

        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="px-5 pb-5 pt-3 flex-shrink-0"
          style={{ borderTop: '1px solid #F1F5F9' }}>
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
