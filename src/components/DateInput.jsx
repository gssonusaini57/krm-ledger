import { useState, useRef, useEffect } from 'react'
import { CalendarDays } from 'lucide-react'

const toDisplay = v => v ? v.split('-').reverse().join('/') : ''
const toISO     = digits =>
  `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`

export default function DateInput({ value, onChange, required, className, style, min, max }) {
  const [text, setText]   = useState(toDisplay(value))
  const pickerRef         = useRef(null)

  // Sync when parent resets the value externally (e.g. form reset after save)
  useEffect(() => { setText(toDisplay(value)) }, [value])

  const handleChange = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)

    // Auto-insert slashes
    let fmt = digits
    if (digits.length > 2) fmt = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) fmt = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)

    setText(fmt)

    if (digits.length === 8) {
      const iso = toISO(digits)
      const d   = new Date(iso)
      // Validate: reject impossible dates like 31/02
      if (!isNaN(d) && d.toISOString().startsWith(iso)) {
        onChange({ target: { value: iso } })
      }
    } else if (digits.length === 0) {
      onChange({ target: { value: '' } })
    }
  }

  const handleKeyDown = e => {
    // Pass through: modifier combos (Ctrl+A/C/V/Z), navigation, editing keys
    if (e.ctrlKey || e.metaKey) return
    const nav = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (nav.includes(e.key)) return
    // Block anything that isn't a digit
    if (!/^\d$/.test(e.key)) e.preventDefault()
  }

  const openPicker = () => { try { pickerRef.current?.showPicker() } catch {} }

  return (
    <div className={className} style={{ position: 'relative', boxSizing: 'border-box', ...style }}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="DD/MM/YYYY"
        maxLength={10}
        required={required}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 'inherit',
          color: 'inherit',
          padding: 0,
          paddingRight: 18,
          fontFamily: 'inherit',
        }}
      />

      {/* Calendar icon — opens native picker */}
      <button
        type="button"
        onClick={openPicker}
        tabIndex={-1}
        style={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <CalendarDays size={12} />
      </button>

      {/* Hidden native date input — only used for the calendar picker */}
      <input
        ref={pickerRef}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        onChange={e => { onChange(e); setText(toDisplay(e.target.value)) }}
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, top: 0, left: 0 }}
      />
    </div>
  )
}
