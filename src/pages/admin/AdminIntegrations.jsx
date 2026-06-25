import { useState } from 'react'
import { Plug, Settings, Wifi, List } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { ADMIN_INTEGRATION_CARDS } from '../../data/mockAdminData'

export default function AdminIntegrations() {
  const [expandedMap, setExpandedMap] = useState({ gps: true })

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Integration Management"
        subtitle="External data connections and API configurations."
        eyebrow="Super Admin Portal"
        badge="Live Connections"
        actions={
          <button type="button" className="dispatcher-btn-primary inline-flex items-center gap-2">
            <Plug size={16} />
            Add New Integration
          </button>
        }
      />

      {ADMIN_INTEGRATION_CARDS.map((card) => {
        const border = card.status === 'OPERATIONAL' ? 'var(--status-low)' : 'var(--status-medium)'
        const expanded = expandedMap[card.id]
        return (
          <div key={card.id} className="dispatcher-surface p-5" style={{ borderLeft: `4px solid ${border}` }}>
            <div className="flex flex-wrap justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: border }} />
                <span className="text-[16px] font-bold">{card.name}</span>
                <StatusBadge label={card.status} variant={card.status === 'OPERATIONAL' ? 'resolved' : 'handover'} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"><Settings size={12} />Configure</button>
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"><Wifi size={12} />Test Connection</button>
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"><List size={12} />View Logs</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              {[
                ['Endpoint', card.endpoint],
                ['Auth Type', card.auth],
                ['Sync Frequency', card.frequency],
                ['Last Sync', card.lastSync],
                ['Avg Response', card.response],
                ['Error Rate', card.errorRate],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="font-mono text-[10px] uppercase text-(--text-muted)">{label}</div>
                  <div className="text-[13px] font-mono truncate">{val}</div>
                </div>
              ))}
            </div>
            {card.mappings?.length > 0 && (
              <>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-(--accent) bg-transparent border-none cursor-pointer mb-2"
                  onClick={() => setExpandedMap((m) => ({ ...m, [card.id]: !expanded }))}
                >
                  Field Mappings {expanded ? '▴' : '▾'}
                </button>
                {expanded && (
                  <table className="w-full text-[12px] mb-2">
                    <tbody>
                      {card.mappings.map(([ext, resq]) => (
                        <tr key={ext} className="border-b border-(--border-subtle)">
                          <td className="py-1 font-mono">{ext}</td>
                          <td className="py-1 text-center text-(--text-muted)">→</td>
                          <td className="py-1 font-mono">{resq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
            {card.errors && (
              <div className="rounded-lg p-3 mt-2" style={{ background: 'var(--status-medium-bg)', border: '1px solid var(--status-medium)' }}>
                {card.errors.map((err) => (
                  <div key={err} className="font-mono text-[12px] py-0.5">{err}</div>
                ))}
                <div className="text-right mt-2">
                  <a href="#" className="text-[11px] font-semibold text-(--accent) no-underline">View Full Error Log →</a>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
