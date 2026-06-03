import { useState } from 'react'
import { useParams, NavLink, Navigate } from 'react-router-dom'
import { Settings, Bell, Database, Save, Megaphone } from 'lucide-react'
import SettingsNavLayout from '../../components/settings/SettingsNavLayout'
import { SettingsToggleRow, SettingsGroup } from '../../components/settings/SettingsToggle'

const NAV = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'retention', label: 'Data Retention', icon: Database },
  { id: 'backup', label: 'Backup', icon: Save },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
]

const RETENTION = [
  { type: 'Incident Records', period: '7 years', basis: 'RNP Compliance Act', review: 'Jan 2026' },
  { type: 'GPS Tracking Data', period: '2 years', basis: 'Operational Policy', review: 'Jan 2026' },
  { type: 'Audit Logs', period: '5 years', basis: 'Security Compliance', review: 'Jan 2026' },
  { type: 'Field Reports', period: '7 years', basis: 'Legal Evidence', review: 'Jan 2026' },
  { type: 'User Activity Logs', period: '1 year', basis: 'Internal Policy', review: 'Jan 2026' },
  { type: 'AI Model Outputs', period: '90 days', basis: 'Operational', review: 'Jan 2026' },
]

export default function AdminSystemSettings() {
  const { section: sectionParam } = useParams()
  const section = sectionParam || 'general'
  const [priority, setPriority] = useState('WARNING')

  if (!NAV.some((n) => n.id === section)) {
    return <Navigate to="/admin/settings/general" replace />
  }

  return (
    <SettingsNavLayout
      breadcrumbParent="System Administration"
      portalLabel="Global configuration and data management."
      basePath="/admin/settings"
      navItems={NAV}
    >
      {section === 'general' && (
        <SettingsGroup title="General System Settings">
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Default map center (Rwanda)</span>
            <div className="flex gap-2">
              <input type="number" className="dispatcher-input h-10 flex-1" defaultValue={-1.9403} step={0.0001} />
              <input type="number" className="dispatcher-input h-10 flex-1" defaultValue={29.8739} step={0.0001} />
            </div>
          </label>
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">National Response Time Target (minutes)</span>
            <input type="number" className="dispatcher-input h-10 w-20" defaultValue={8} />
          </label>
          <label className="dispatcher-field">
            <span className="text-[12px] font-medium">Minimum Coverage Score Target (%)</span>
            <input type="number" className="dispatcher-input h-10 w-20" defaultValue={90} />
          </label>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium">Rwanda Admin Boundaries</div>
              <div className="text-[13px] text-(--text-secondary)">RNADB v4.2 · 30 districts</div>
            </div>
            <button type="button" className="dispatcher-btn-ghost text-[11px] h-8">Update Database</button>
          </div>
          <button type="button" className="dispatcher-btn-primary w-full max-w-xs">Save General Settings</button>
        </SettingsGroup>
      )}

      {section === 'notifications' && (
        <SettingsGroup title="System-Wide Alert Settings">
          <div className="text-[11px] font-bold text-(--text-muted) uppercase mb-2">Critical Alerts</div>
          <SettingsToggleRow label="Officer Needs Assistance — All channels" checked onChange={() => {}} />
          <SettingsToggleRow label="AI Model Below Threshold — Email + Dashboard" checked onChange={() => {}} />
          <SettingsToggleRow label="Integration Disconnected — SMS + Email + Dashboard" checked onChange={() => {}} />
          <div className="text-[11px] font-bold text-(--text-muted) uppercase mb-2 mt-4">Operational Alerts</div>
          <SettingsToggleRow label="Coverage Below Target — Dashboard" checked onChange={() => {}} />
          <SettingsToggleRow label="Dispatch Queue Overload — Dashboard" checked onChange={() => {}} />
          <SettingsToggleRow label="Scheduled Job Failed — Email" checked onChange={() => {}} />
          <label className="dispatcher-field mt-4">
            <span className="text-[12px]">Unanswered call escalation after</span>
            <select className="dispatcher-input h-10 w-48" defaultValue="90 seconds"><option>90 seconds</option></select>
          </label>
        </SettingsGroup>
      )}

      {section === 'retention' && (
        <SettingsGroup title="Data Retention Policies">
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">How long each data type is retained for compliance.</p>
          <div className="dispatcher-surface overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-(--text-muted) border-b border-(--border)">
                  <th className="text-left p-3">Data Type</th>
                  <th className="p-3">Retention</th>
                  <th className="text-left p-3">Legal Basis</th>
                  <th className="p-3">Last Review</th>
                </tr>
              </thead>
              <tbody>
                {RETENTION.map((r) => (
                  <tr key={r.type} className="border-b border-(--border-subtle)">
                    <td className="p-3 font-medium">{r.type}</td>
                    <td className="p-3 font-mono">{r.period}</td>
                    <td className="p-3">{r.basis}</td>
                    <td className="p-3 text-(--text-muted)">{r.review}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="dispatcher-btn-ghost mt-4 text-[12px]">Request Policy Update</button>
        </SettingsGroup>
      )}

      {section === 'backup' && (
        <SettingsGroup title="Backup Management">
          {[
            { type: 'Daily Backup', last: 'Today 13:00', size: '2.4 GB', next: 'Tomorrow 13:00', loc: 'Cloud Storage', status: 'COMPLETED' },
            { type: 'Weekly Backup', last: 'May 25 03:00', size: '18.7 GB', next: 'Jun 1 03:00', loc: 'Cloud + Local', status: 'COMPLETED' },
            { type: 'Monthly Archive', last: 'May 1 02:00', size: '84.2 GB', next: 'Jun 1 02:00', loc: 'Offsite Archive', status: 'COMPLETED' },
          ].map((b) => (
            <div key={b.type} className="dispatcher-surface p-4 mb-3">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-[13px]">{b.type}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--status-low-bg)', color: 'var(--status-low)' }}>{b.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px] font-mono text-(--text-secondary) mb-3">
                <span>Last: {b.last} · {b.size}</span>
                <span>Next: {b.next}</span>
                <span className="col-span-2">Location: {b.loc}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 flex-1">Run Now</button>
                <button type="button" className="dispatcher-btn-ghost text-[11px] h-8 flex-1">Restore →</button>
              </div>
            </div>
          ))}
          <button type="button" className="dispatcher-btn-primary w-full inline-flex items-center justify-center gap-2 mt-2">
            <Database size={16} />
            Run Full Backup Now
          </button>
        </SettingsGroup>
      )}

      {section === 'announcements' && (
        <SettingsGroup title="System Announcements">
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">Messages shown on all user dashboards.</p>
          <div className="text-center py-8 mb-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <Megaphone size={24} className="text-(--text-muted) mx-auto mb-2" />
            <p className="text-[13px] text-(--text-muted) m-0">No active announcements</p>
          </div>
          <textarea className="dispatcher-textarea min-h-[80px] w-full" placeholder="e.g. Scheduled maintenance tonight 02:00–04:00..." />
          <select className="dispatcher-input h-10 w-full mt-2" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option>INFO</option>
            <option>WARNING</option>
            <option>CRITICAL</option>
          </select>
          <input type="datetime-local" className="dispatcher-input h-10 w-full mt-2" />
          <select className="dispatcher-input h-10 w-full mt-2" defaultValue="All Users">
            <option>All Users</option>
            <option>Dispatchers only</option>
          </select>
          <div
            className="mt-3 p-3 rounded-lg text-[12px]"
            style={{
              background: priority === 'CRITICAL' ? 'var(--status-critical-bg)' : priority === 'WARNING' ? 'var(--status-medium-bg)' : 'var(--accent-ghost)',
              border: `1px solid ${priority === 'CRITICAL' ? 'var(--status-critical)' : priority === 'WARNING' ? 'var(--status-medium)' : 'var(--accent)'}`,
            }}
          >
            Preview: System announcement banner will appear with {priority} styling.
          </div>
          <button type="button" className="dispatcher-btn-primary w-full mt-3">Post Announcement</button>
        </SettingsGroup>
      )}
    </SettingsNavLayout>
  )
}
