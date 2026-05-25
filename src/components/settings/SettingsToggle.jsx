export function SettingsToggleRow({ label, description, on, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-label">
        <div className="text-[13px] font-medium text-(--text-primary)">{label}</div>
        {description && (
          <div className="text-[12px] text-(--text-secondary) mt-0.5 leading-snug">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="settings-toggle-control w-10 h-5.5 rounded-full relative transition-colors border-none cursor-pointer"
        style={{
          background: on ? 'var(--accent)' : 'var(--border)',
        }}
        onClick={() => onChange(!on)}
      >
        <span
          className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{
            background: on ? 'var(--text-on-accent)' : 'var(--bg-surface)',
            left: on ? 20 : 2,
          }}
        />
      </button>
    </div>
  )
}

export function SettingsGroup({ title, children }) {
  return (
    <div className="settings-group mb-5">
      {title && <div className="settings-group-label">{title}</div>}
      <div>{children}</div>
    </div>
  )
}
