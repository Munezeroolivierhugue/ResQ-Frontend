import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

/**
 * Reusable searchable select dropdown.
 *
 * options — string[] or { value, label, icon?: LucideComponent, color?: string, tag?: string }[]
 * value   — currently selected value string
 * onChange — (value: string) => void
 * placeholder — text shown in the search input and on the trigger when nothing is selected
 * className — extra class for the outer wrapper
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const normalized = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  const selected = normalized.find(o => o.value === value)
  const filtered = query
    ? normalized.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : normalized

  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }

  const handleSelect = opt => {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  const SelectedIcon = selected?.icon

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 8,
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {SelectedIcon && (
            <SelectedIcon
              size={13}
              style={{ flexShrink: 0, color: selected.color ?? 'var(--text-secondary)' }}
            />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-dropdown, 0 8px 24px rgba(0,0,0,0.18))',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <Search size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: 210, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No results
              </div>
            )}
            {filtered.map(opt => {
              const Icon = opt.icon
              const isSel = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 12px',
                    border: 'none',
                    background: isSel ? 'var(--accent-ghost)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!isSel) e.currentTarget.style.background = 'var(--bg-surface)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isSel ? 'var(--accent-ghost)' : 'transparent'
                  }}
                >
                  {Icon && (
                    <Icon
                      size={14}
                      style={{ flexShrink: 0, color: opt.color ?? 'var(--text-secondary)' }}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      color: 'var(--text-primary)',
                      fontWeight: isSel ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.tag && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}
                    >
                      {opt.tag}
                    </span>
                  )}
                  {isSel && (
                    <Check size={12} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
