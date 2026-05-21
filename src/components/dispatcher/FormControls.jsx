import FieldLabel from '../ui/FieldLabel'

export function FormSelect({ label, value, onChange, options, className = '' }) {
  return (
    <label className={`dispatcher-field ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <select
        className="dispatcher-input dispatcher-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}

export function FormTextarea({ label, value, onChange, placeholder, rows = 5, className = '' }) {
  return (
    <label className={`dispatcher-field ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className="dispatcher-input dispatcher-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  )
}

export function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  className = '',
}) {
  return (
    <label className={`dispatcher-field ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        className="dispatcher-input dispatcher-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
      />
    </label>
  )
}

/** Compact stat cell with editable value (incident report summary grid). */
export function EditableSummaryStat({ label, value, onChange, type = 'number', placeholder = '0' }) {
  return (
    <div className="dispatcher-summary-stat">
      <FieldLabel className="mb-0.5">{label}</FieldLabel>
      <input
        type={type}
        className="dispatcher-input dispatcher-summary-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={type === 'number' ? 0 : undefined}
      />
    </div>
  )
}
