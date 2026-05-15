import { useState } from 'react'
import { X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useApp } from '../context/AppContext'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F43F5E', '#DC2626', '#65A30D', '#0EA5E9',
]

export default function CategoryModal({ onClose }) {
  const { addCustomCategory } = useApp()
  const [name, setName]   = useState('')
  const [type, setType]   = useState('EXPENSE')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [error, setError] = useState('')

  const handleSave = () => {
    const label = name.trim()
    if (!label) return setError('Enter a category name')
    const slug  = label.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    const value = `CUSTOM_${slug}_${Date.now()}`
    addCustomCategory({ id: uuidv4(), value, label, type, color })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">New Category</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              placeholder="e.g. Maintenance, Rice Export..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'EXPENSE', label: '💸 Expense' },
                { key: 'INCOME',  label: '💰 Income'  },
              ].map(t => (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  className="py-3 rounded-2xl text-sm font-bold border-2 transition-all"
                  style={type === t.key
                    ? t.key === 'EXPENSE'
                      ? { borderColor: '#EF4444', background: '#FFF1F2', color: '#DC2626' }
                      : { borderColor: '#10B981', background: '#ECFDF5', color: '#059669' }
                    : { borderColor: '#E2E8F0', background: '#F8FAFC', color: '#94A3B8' }
                  }>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-xl transition-all"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg flex-shrink-0" style={{ background: color }} />
              <span className="text-xs text-gray-500 font-mono">{color}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${color}20`, color }}>
                Preview
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSave}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
