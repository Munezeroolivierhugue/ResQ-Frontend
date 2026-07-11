import { useState, useEffect, Fragment } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import AnalystPageHeader from '../../components/analyst/AnalystPageHeader'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import SettingsToast from '../../components/settings/SettingsToast'
import { getCurrentUser } from '../../utils/authSession'
import { mockAuditLogs } from '../../data/mockAuditLogs'
import {
  ANALYST_DQ_TABLE,
  ANALYST_MISSED_FIELDS,
  ANALYST_LOW_UNITS,
  barFillByPct,
  sourceStatusVariant,
} from '../../data/mockAnalystData'
import { listDataQuality } from '../../api/reporting'

// Adapt API records to the shape the table expects
function adaptApiDq(d) {
  return {
    source: d.source,
    completeness_pct: Math.round(d.completeness ?? 0),
    accuracy_pct: Math.round(d.accuracy ?? 0),
    last_updated_at: d.checked_at ? new Date(d.checked_at).toLocaleString() : '—',
    gap_count_30d: d.issues_found ?? 0,
    status: (d.overall_score ?? 0) >= 90 ? 'OK' : (d.overall_score ?? 0) >= 70 ? 'DEGRADED' : 'ERROR',
    degraded: (d.overall_score ?? 0) < 80,
    detail: null,
  }
}

function PctBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] w-10">{value}%</span>
      <div className="flex-1 h-1.5 rounded-full bg-(--border) overflow-hidden max-w-[80px]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: barFillByPct(value) }} />
      </div>
    </div>
  )
}

const LINEAGE = {
  sources: ['Incidents DB', 'GPS Tracker', 'Meteo Weather', 'KCC Traffic'],
  processing: ['Data Validator', 'Normalizer'],
  models: ['Dispatch Brain', 'Prediction Engine', 'Coverage Watcher'],
  outputs: ['Dashboards', 'Reports', 'Field Devices'],
}

export default function AnalystDataQuality() {
  const [expanded, setExpanded] = useState('Rwanda Meteo Weather')
  const [dqTable, setDqTable] = useState(ANALYST_DQ_TABLE)
  const [dqError, setDqError] = useState(null)
  const [thresholds, setThresholds] = useState({
    gps: 5,
    completeness: 80,
    ai: 85,
    offline: 10,
    override: 30,
    coverage: 75,
  })
  const [toast, setToast] = useState(false)

  useEffect(() => {
    listDataQuality()
      .then((records) => {
        if (records && records.length > 0) setDqTable(records.map(adaptApiDq))
      })
      .catch(() => setDqError('Live data quality feed unavailable — showing cached data.'))
  }, [])

  function saveThresholds() {
    const currentUser = getCurrentUser()
    mockAuditLogs.push({
      log_id: Math.random().toString(36).slice(2, 10),
      user_id: currentUser?.user_id ?? null,
      timestamp: new Date().toISOString(),
      action: 'DQ_THRESHOLDS_UPDATED: ' + JSON.stringify(thresholds),
      module: 'ANALYST',
      status: 'SUCCESS',
    })
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="portal-page flex flex-col gap-5 min-w-[1024px]">
      <AnalystPageHeader
        title="Data Quality Dashboard"
        subtitle="Health, completeness, and accuracy of all data sources."
        badge="Data Quality"
      />

      {dqError && (
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}>
          {dqError}
        </div>
      )}

      <div className="dispatcher-surface overflow-x-auto">
        <table className="w-full text-[12px] min-w-[720px]">
          <thead>
            <tr className="text-(--text-muted) border-b border-(--border)">
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Completeness</th>
              <th className="text-left p-3">Accuracy</th>
              <th className="text-left p-3">Freshness</th>
              <th className="p-3">Gap Events (30d)</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {dqTable.map((row) => (
              <Fragment key={row.source}>
                <tr
                  className="border-b border-(--border-subtle) cursor-pointer"
                  style={{ background: row.degraded ? 'var(--status-medium-bg)' : undefined }}
                  onClick={() => row.detail && setExpanded(expanded === row.source ? '' : row.source)}
                >
                  <td className="p-3 font-medium">{row.source}</td>
                  <td className="p-3"><PctBar value={row.completeness_pct} /></td>
                  <td className="p-3"><PctBar value={row.accuracy_pct} /></td>
                  <td className="p-3 font-mono">{row.last_updated_at}</td>
                  <td className="p-3 text-center font-mono">{row.gap_count_30d}</td>
                  <td className="p-3">
                    <StatusBadge label={row.status} variant={sourceStatusVariant(row.status)} />
                  </td>
                </tr>
                {row.detail && expanded === row.source && (
                  <tr key={`${row.source}-detail`}>
                    <td colSpan={6} className="p-3 text-[12px]" style={{ color: 'var(--status-medium)' }}>
                      {row.detail}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="portal-split-60-40 gap-4">
        <div className="dispatcher-surface p-4 min-w-0">
          <h3 className="text-[13px] font-semibold m-0">Field Report Quality</h3>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">Completeness of incident reports submitted by field officers</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { v: '84%', l: 'Fully complete' },
              { v: '16%', l: 'Partially complete' },
              { v: '0.4%', l: 'Not submitted' },
            ].map((s) => (
              <div key={s.l} className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
                <div className="font-mono font-bold text-[20px]">{s.v}</div>
                <div className="text-[11px] text-(--text-secondary)">{s.l}</div>
              </div>
            ))}
          </div>
          <h4 className="text-[12px] text-(--text-muted) m-0 mb-2">Most Commonly Skipped Fields</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ANALYST_MISSED_FIELDS} layout="vertical" margin={{ left: 120 }}>
              <XAxis type="number" domain={[0, 35]} hide />
              <YAxis type="category" dataKey="field" width={115} tick={{ fontSize: 10 }} />
              <Bar dataKey="skip_rate_pct" fill="var(--status-medium)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <h4 className="text-[12px] font-semibold mt-4 mb-2">Units with Lowest Report Completion</h4>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-(--text-muted)">
                <th className="text-left py-2">Unit</th>
                <th className="text-left py-2">Officer</th>
                <th className="py-2">Rate</th>
                <th className="text-left py-2">Missing</th>
              </tr>
            </thead>
            <tbody>
              {ANALYST_LOW_UNITS.map((u) => (
                <tr key={u.vehicle_id} className="border-t border-(--border-subtle)">
                  <td className="py-2 font-mono">{u.vehicle_id}</td>
                  <td className="py-2">
                    {u.officer_name}
                    <span
                      className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}
                    >
                      Training Recommended
                    </span>
                  </td>
                  <td className="py-2 text-center font-mono">{u.report_completion_rate}</td>
                  <td className="py-2 text-(--text-secondary)">{u.missing_fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dispatcher-surface p-4 min-w-0">
          <h3 className="text-[13px] font-semibold m-0">Data Lineage — Pipeline Flow</h3>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">Trace data from source to output</p>
          <div className="analyst-lineage flex flex-col items-center gap-3 py-2">
            {[
              { label: 'Sources', items: LINEAGE.sources, warn: 'Meteo Weather' },
              { label: 'Processing', items: LINEAGE.processing },
              { label: 'AI Models', items: LINEAGE.models },
              { label: 'Outputs', items: LINEAGE.outputs },
            ].map((layer, li) => (
              <div key={layer.label} className="w-full flex flex-col items-center">
                <div className="text-[10px] font-mono text-(--text-muted) mb-1">{layer.label}</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {layer.items.map((item) => {
                    const degraded = layer.warn && item.includes('Meteo')
                    return (
                      <span
                        key={item}
                        className="text-[11px] font-medium px-2 py-1 rounded-md"
                        style={{
                          background: degraded ? 'var(--status-medium-bg)' : 'var(--bg-elevated)',
                          border: `1px solid ${degraded ? 'var(--status-medium)' : 'var(--border)'}`,
                          color: degraded ? 'var(--status-medium)' : 'var(--text-primary)',
                        }}
                      >
                        {degraded ? '⚠ ' : ''}{item}
                      </span>
                    )
                  })}
                </div>
                {li < 3 && (
                  <svg width="24" height="20" className="my-1">
                    <line x1="12" y1="0" x2="12" y2="14" stroke="var(--accent)" strokeWidth="2" />
                    <polygon points="8,14 12,20 16,14" fill="var(--accent)" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-(--text-muted) m-0 mt-3">
            Meteo data degradation affecting Prediction Engine weather-correlated forecasts. Other pipelines healthy.
          </p>
        </div>
      </div>

      <div className="dispatcher-surface p-4">
        <h3 className="text-[13px] font-semibold m-0">Alert Thresholds</h3>
        <p className="text-[12px] text-(--text-muted) m-0 mb-4">Trigger automatic alerts when data quality drops below:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'gps', label: 'GPS data freshness >', unit: 'minutes' },
            { key: 'completeness', label: 'Incident report completeness <', unit: '%' },
            { key: 'ai', label: 'AI model accuracy <', unit: '%' },
            { key: 'offline', label: 'Data source offline >', unit: 'minutes' },
            { key: 'override', label: 'Override rate >', unit: '% (per dispatcher)' },
            { key: 'coverage', label: 'Coverage score <', unit: '%' },
          ].map((t) => (
            <div key={t.key} className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] font-medium flex-1 min-w-[200px]">{t.label}</span>
              <input
                type="number"
                className="dispatcher-input h-9 w-20"
                value={thresholds[t.key]}
                onChange={(e) => setThresholds((s) => ({ ...s, [t.key]: Number(e.target.value) }))}
              />
              <span className="text-[12px] text-(--text-muted)">{t.unit}</span>
              <input type="checkbox" defaultChecked />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button type="button" className="dispatcher-btn-primary" onClick={saveThresholds}>Save Thresholds</button>
        </div>
      </div>
      <SettingsToast show={toast} message="Thresholds saved." />
    </div>
  )
}
