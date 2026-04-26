import { useState } from 'react'
import { Save, AlertTriangle, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { OWNER_COLORS } from '../utils/helpers'

function InputField({ label, value, onChange, type = 'text', placeholder, min, max }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default function Settings() {
  const { owners, settings, updateOwner, updateSettings } = useApp()
  const [saved, setSaved] = useState(false)
  const [showClear, setShowClear] = useState(false)

  const [companyName, setCompanyName] = useState(settings.companyName)
  const [currency, setCurrency] = useState(settings.currency)
  const [openingBalance, setOpeningBalance] = useState(String(settings.openingBalance || 0))

  const [ownerEdits, setOwnerEdits] = useState(
    owners.map(o => ({ ...o }))
  )

  const setOwnerField = (id, field, value) => {
    setOwnerEdits(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o))
  }

  const handleSave = () => {
    updateSettings({
      companyName,
      currency,
      openingBalance: parseFloat(openingBalance) || 0,
    })
    ownerEdits.forEach(o => updateOwner(o))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleClearData = () => {
    localStorage.removeItem('krm-ledger-v2')
    window.location.reload()
  }

  const totalShare = ownerEdits.reduce((s, o) => s + (parseFloat(o.sharePercent) || 0), 0)

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Company settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Company Details</h2>
        <InputField
          label="Company Name"
          value={companyName}
          onChange={setCompanyName}
          placeholder="Your Rice Mill Name"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Currency Symbol"
            value={currency}
            onChange={setCurrency}
            placeholder="₹"
          />
          <InputField
            label="Opening Balance (₹)"
            value={openingBalance}
            onChange={setOpeningBalance}
            type="number"
            placeholder="0"
          />
        </div>
      </div>

      {/* Owner settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Owner Details</h2>
          {Math.abs(totalShare - 100) > 0.1 && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              Shares total: {totalShare.toFixed(1)}% (should be 100%)
            </span>
          )}
        </div>

        {ownerEdits.map((owner, i) => (
          <div key={owner.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: owner.color || OWNER_COLORS[i] }}
              >
                {(owner.name || '?').charAt(0).toUpperCase()}
              </div>
              <p className="font-medium text-sm text-gray-700">Owner {i + 1}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Name"
                value={owner.name}
                onChange={v => setOwnerField(owner.id, 'name', v)}
                placeholder="Full Name"
              />
              <InputField
                label="Phone Number"
                value={owner.phone || ''}
                onChange={v => setOwnerField(owner.id, 'phone', v)}
                placeholder="+91 XXXXX XXXXX"
              />
              <InputField
                label="Share %"
                value={String(owner.sharePercent)}
                onChange={v => setOwnerField(owner.id, 'sharePercent', parseFloat(v) || 0)}
                type="number"
                min="0"
                max="100"
                placeholder="33.33"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={owner.color || OWNER_COLORS[i]}
                    onChange={e => setOwnerField(owner.id, 'color', e.target.value)}
                    className="w-10 h-9 border border-gray-300 rounded-lg p-0.5 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400">Pick owner color</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Save size={16} />
          Save Changes
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved successfully!</span>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-600" />
          <h2 className="text-sm font-semibold text-red-800">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-700 mb-3">
          Clear all transactions and reset the app. This cannot be undone.
        </p>
        {showClear ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowClear(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              <Trash2 size={14} />
              Yes, Clear All Data
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowClear(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            <Trash2 size={14} />
            Clear All Data
          </button>
        )}
      </div>
    </div>
  )
}
