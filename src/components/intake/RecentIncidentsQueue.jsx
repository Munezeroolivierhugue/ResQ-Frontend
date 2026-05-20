import { useNavigate } from 'react-router-dom'
import { IntakePanel, PanelHeader, SeverityBadge } from './IntakeUi'

export default function RecentIncidentsQueue({ incidents, theme }) {
  const navigate = useNavigate()

  return (
    <IntakePanel className="flex flex-col flex-1 min-h-[280px] overflow-hidden">
      <div className="px-4 py-3 border-b border-(--border-subtle) shrink-0">
        <PanelHeader title="Dispatch queue" className="mb-0" />
        <p className="text-[11px] text-(--text-muted) m-0 mt-1">Recent logged incidents</p>
      </div>
      <ul className="overflow-y-auto flex-1 list-none m-0 p-2 md:p-3 space-y-2">
        {incidents.map((inc) => (
          <li key={inc.id}>
            <button
              type="button"
              className={`w-full text-left rounded-lg border transition-colors p-3 ${
                inc.active
                  ? `border-(--accent) bg-(--accent-ghost)${theme === 'dark' ? '' : ' shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]'}`
                  : 'border-(--border) bg-(--bg-elevated)/40 hover:bg-(--bg-elevated)'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-(--accent)" style={{ fontFamily: 'var(--font-mono)' }}>
                  {inc.id}
                </span>
                <SeverityBadge severity={inc.severity} />
              </div>
              <div className="text-[13px] font-semibold text-(--text-primary) leading-snug mb-0.5">
                {inc.title}
              </div>
              <p className="text-[11px] text-(--text-secondary) m-0 line-clamp-2 leading-snug">
                {inc.summary}
              </p>
              <div className="text-[10px] text-(--text-muted) mt-2" style={{ fontFamily: 'var(--font-mono)' }}>
                {inc.time}
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-3 border-t border-(--border-subtle) shrink-0">
        <button
          type="button"
          onClick={() => navigate('/dispatcher/history')}
          className="w-full py-2 rounded-lg border border-(--border) bg-transparent text-(--text-primary) text-[10px] font-bold tracking-[0.1em] uppercase cursor-pointer hover:bg-(--bg-elevated)"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          View all archives
        </button>
      </div>
    </IntakePanel>
  )
}
