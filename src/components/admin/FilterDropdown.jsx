import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'

// Reusable "search + list" filter dropdown — same interaction pattern as
// Facebook's currency picker (search box on top, scrollable option list,
// single-select, closes on pick or outside-click). Used identically across
// Admin Users/Units/Agencies so every filter on those pages behaves the same.
export default function FilterDropdown({ label, value, options, onChange, getLabel = (o) => o.label, getValue = (o) => o.value, openUp = false, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = options.find((o) => getValue(o) === value)
  const filtered = query.trim()
    ? options.filter((o) => getLabel(o).toLowerCase().includes(query.trim().toLowerCase()))
    : options

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="dispatcher-input h-9 text-[12px] px-3 flex items-center gap-2 cursor-pointer min-w-[140px] justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{selected ? getLabel(selected) : label}</span>
        <ChevronDown size={14} className="text-(--text-muted) shrink-0" />
      </button>
      {open && (
        <div
          className={`absolute ${openUp ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]'} ${align === 'right' ? 'right-0' : 'left-0'} z-50 w-56 rounded-lg border border-(--border) bg-(--bg-surface) shadow-lg overflow-hidden`}
        >
          <div className="p-2 border-b border-(--border-subtle) flex items-center gap-2">
            <Search size={13} className="text-(--text-muted) shrink-0" />
            <input
              autoFocus
              className="flex-1 text-[12px] bg-transparent border-none outline-none"
              placeholder={`Search ${label.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-(--text-muted)">No matches.</div>
            )}
            {filtered.map((o) => {
              const v = getValue(o)
              const isSelected = v === value
              return (
                <button
                  key={v}
                  type="button"
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] text-left cursor-pointer hover:bg-(--bg-elevated)"
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}
                  onClick={() => { onChange(v); setOpen(false); setQuery('') }}
                >
                  <span className="truncate">{getLabel(o)}</span>
                  {isSelected && <Check size={13} style={{ color: 'var(--accent)' }} className="shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
