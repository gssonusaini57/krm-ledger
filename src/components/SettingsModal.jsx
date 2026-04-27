import { useState } from 'react'
import { X, Plus, Trash2, Pencil, Check, User, Mail } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { OWNER_COLORS } from '../utils/helpers'

const BLANK_EMP = { name: '', type: 'FIXED', salary: '' }

export default function SettingsModal({ onClose }) {
  const { owners, settings, employees = [], updateOwner, updateSettings, addEmployee, updateEmployee, deleteEmployee } = useApp()
  const { signOut, updateUserEmail, user } = useAuth()

  const [section, setSection]       = useState('company')   // 'company' | 'employees' | 'account'
  const [companyName, setCompanyName] = useState(settings.companyName)
  const [ownerEdits, setOwnerEdits] = useState(owners.map(o => ({ ...o })))
  const [saved, setSaved]           = useState(false)

  // email change form
  const [newEmail, setNewEmail]     = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [emailUpdating, setEmailUpdating] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  // employee form
  const [empForm, setEmpForm]       = useState(null)   // null = closed, {} = new, {id} = edit
  const [editingId, setEditingId]   = useState(null)

  const setOwnerField = (id, field, value) =>
    setOwnerEdits(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o))

  const handleSave = () => {
    updateSettings({ companyName })
    ownerEdits.forEach(o => updateOwner(o))
    setSaved(true)
    setTimeout(() => { setSaved(false) }, 1500)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const result = await signOut()
      if (result.success) {
        onClose()
      } else {
        console.error('Sign out failed:', result.error)
        setSigningOut(false)
        // You could show an error message here if needed
      }
    } catch (error) {
      console.error('Sign out error:', error)
      setSigningOut(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !currentPassword.trim()) return
    
    setEmailUpdating(true)
    setEmailError('')
    
    const result = await updateUserEmail(newEmail.trim(), currentPassword)
    
    if (result.success) {
      setNewEmail('')
      setCurrentPassword('')
      setEmailError('Email updated successfully!')
      setTimeout(() => setEmailError(''), 3000)
    } else {
      setEmailError(result.error)
    }
    
    setEmailUpdating(false)
  }

  const openNewEmp  = () => setEmpForm({ ...BLANK_EMP })
  const openEditEmp = (e) => { setEmpForm({ ...e, salary: String(e.salary || '') }); setEditingId(e.id) }
  const closeEmpForm = () => { setEmpForm(null); setEditingId(null) }

  const saveEmployee = () => {
    if (!empForm.name.trim()) return
    if (editingId) {
      updateEmployee({ ...empForm, id: editingId, salary: parseFloat(empForm.salary) || 0 })
    } else {
      addEmployee({ ...empForm, salary: parseFloat(empForm.salary) || 0 })
    }
    closeEmpForm()
  }

  const fixedEmps    = employees.filter(e => e.type === 'FIXED')
  const variableEmps = employees.filter(e => e.type === 'VARIABLE')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>

        {/* Section tabs */}
        <div className="grid grid-cols-3 gap-1 mx-6 mt-4 p-1 rounded-2xl bg-gray-100 flex-shrink-0">
          {[
            { key: 'company', label: 'Company', icon: User },
            { key: 'account', label: 'Account', icon: Mail },
            { key: 'employees', label: 'Staff', icon: User }
          ].map(s => {
            const IconComponent = s.icon
            return (
              <button key={s.key} onClick={() => setSection(s.key)}
                className="py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
                style={section === s.key
                  ? { background: 'linear-gradient(135deg,#1E293B,#334155)', color: '#fff' }
                  : { color: '#94A3B8' }
                }
              >
                <IconComponent size={14} />
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* ── COMPANY & OWNERS ── */}
          {section === 'company' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Owner Names</label>
                <div className="space-y-3">
                  {ownerEdits.map((owner, i) => (
                    <div key={owner.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: owner.color || OWNER_COLORS[i] }}>
                        {(owner.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <input type="text" placeholder={`Owner ${i + 1}`} value={owner.name}
                        onChange={e => setOwnerField(owner.id, 'name', e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSave}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: saved ? '#10B981' : 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                {saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </>
          )}

          {/* ── ACCOUNT ── */}
          {section === 'account' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Current Email</label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700">
                  {user?.email || 'Not available'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Change Email Address</label>
                <input
                  type="email"
                  placeholder="New email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 mb-3"
                />
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {emailError && (
                <div className={`text-sm text-center p-3 rounded-xl ${
                  emailError.includes('successfully') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {emailError}
                </div>
              )}

              <button
                onClick={handleUpdateEmail}
                disabled={emailUpdating || !newEmail.trim() || !currentPassword.trim()}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
              >
                {emailUpdating ? 'Updating...' : 'Update Email'}
              </button>

              <div className="pt-4 border-t border-gray-100">
                <button onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#EF4444,#F97316)' }}>
                  {signingOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            </>
          )}

          {section === 'employees' && (
            <>
              {/* Fixed salary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Fixed Salary</p>
                    <p className="text-xs text-gray-400">Permanent staff with monthly salary</p>
                  </div>
                  <button onClick={openNewEmp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                    <Plus size={13} /> Add
                  </button>
                </div>

                {fixedEmps.length === 0 ? (
                  <div className="text-center py-6 rounded-2xl bg-gray-50 text-gray-400 text-sm">
                    No fixed salary employees yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fixedEmps.map(emp => (
                      <div key={emp.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">₹{Number(emp.salary).toLocaleString('en-IN')} / month</p>
                        </div>
                        <button onClick={() => openEditEmp(emp)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variable labour */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Variable Labour</p>
                    <p className="text-xs text-gray-400">Daily workers, paid per day/task</p>
                  </div>
                  <button onClick={() => setEmpForm({ name: '', type: 'VARIABLE', salary: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#F97316,#EF4444)' }}>
                    <Plus size={13} /> Add
                  </button>
                </div>

                {variableEmps.length === 0 ? (
                  <div className="text-center py-6 rounded-2xl bg-gray-50 text-gray-400 text-sm">
                    No variable workers yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variableEmps.map(emp => (
                      <div key={emp.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">Variable pay</p>
                        </div>
                        <button onClick={() => openEditEmp(emp)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Employee form modal ── */}
      {empForm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-base mb-4">
              {editingId ? 'Edit Employee' : 'Add Employee'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
                <input type="text" placeholder="Employee name" value={empForm.name}
                  onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'FIXED',    label: '📋 Fixed Salary'   },
                    { key: 'VARIABLE', label: '📅 Variable Labour' },
                  ].map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setEmpForm(f => ({ ...f, type: opt.key }))}
                      className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                      style={empForm.type === opt.key
                        ? { borderColor: '#3B82F6', background: '#EFF6FF', color: '#2563EB' }
                        : { borderColor: '#E2E8F0', color: '#94A3B8' }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {empForm.type === 'FIXED' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monthly Salary (₹)</label>
                  <input type="number" placeholder="0" value={empForm.salary}
                    onChange={e => setEmpForm(f => ({ ...f, salary: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={closeEmpForm}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-500">
                Cancel
              </button>
              <button onClick={saveEmployee}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
