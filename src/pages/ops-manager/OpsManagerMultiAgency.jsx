import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import OpsManagerDistrictLabel from '../../components/ops-manager/OpsManagerDistrictLabel'
import { getCurrentUser } from '../../utils/authSession'
import { listBroadcasts } from '../../api/broadcasts'
import { listMutualAidRequests } from '../../api/mutualAid'
import { listVehicles } from '../../api/vehicles'

export default function OpsManagerMultiAgency() {
  const districtId = getCurrentUser()?.district_id
  const [apiBroadcasts, setApiBroadcasts] = useState([])
  const [mutualAidRequests, setMutualAidRequests] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedError, setFeedError] = useState(null)

  useEffect(() => {
    if (!districtId) return
    Promise.all([
      listBroadcasts(),
      listMutualAidRequests({ districtId }),
      listVehicles({ districtId }),
    ])
      .then(([broadcasts, mutualAid, districtVehicles]) => {
        setApiBroadcasts(broadcasts)
        setMutualAidRequests(mutualAid)
        setVehicles(districtVehicles)
      })
      .catch(() => setFeedError('Could not load live data — check your connection and retry.'))
      .finally(() => setLoading(false))
  }, [districtId])

  // Real per-agency fleet status in this district, replacing the old
  // hardcoded 4-agency mock list (fake unit counts, fake timestamps).
  const agencies = Object.values(
    vehicles.reduce((acc, v) => {
      const name = v.agency_name ?? 'Unknown Agency'
      if (!acc[name]) acc[name] = { name, total: 0, available: 0 }
      acc[name].total += 1
      if (v.status === 'available') acc[name].available += 1
      return acc
    }, {})
  )

  return (
    <div className="portal-page flex flex-col gap-4">
      <div>
        <h1 className="dispatcher-page-title m-0">Multi-Agency Control</h1>
        <OpsManagerDistrictLabel />
      </div>

      {feedError && (
        <div className="text-[12px] px-3 py-2 rounded" style={{ background: 'var(--status-medium-bg)', color: 'var(--status-medium)' }}>
          {feedError}
        </div>
      )}

      <div className="dispatcher-surface p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="font-semibold text-[13px]">Agencies active in your district</div>
          <Link to="/ops-manager/map" className="text-[12px] text-(--accent) font-semibold no-underline inline-flex items-center gap-1">
            <MapPin size={13} /> View live map →
          </Link>
        </div>
        {loading ? (
          <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
        ) : agencies.length === 0 ? (
          <p className="text-[12px] text-(--text-muted) m-0">No vehicles registered in your district.</p>
        ) : (
          agencies.map((a) => (
            <div key={a.name} className="flex items-center justify-between gap-2 py-2.5 border-b border-(--border-subtle) last:border-0">
              <div className="font-semibold text-[13px]">{a.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-(--text-secondary) font-mono">{a.available}/{a.total} available</span>
                <StatusBadge
                  label={a.available > 0 ? 'ACTIVE' : 'NONE AVAILABLE'}
                  variant={a.available > 0 ? 'resolved' : 'critical'}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-semibold text-[13px]">Recent Broadcasts</div>
            <Link to="/ops-manager/map" className="text-[11px] text-(--accent) font-semibold no-underline">
              Send one →
            </Link>
          </div>
          {loading ? (
            <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
          ) : apiBroadcasts.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No broadcasts sent yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {apiBroadcasts.slice(0, 5).map((b) => (
                <div key={b.broadcast_id} className="flex items-start gap-3 border-b border-(--border-subtle) pb-2 text-[12px]">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{
                      background: b.priority === 'EMERGENCY' ? 'var(--status-critical-bg)' : b.priority === 'URGENT' ? 'var(--status-medium-bg)' : 'var(--bg-elevated)',
                      color: b.priority === 'EMERGENCY' ? 'var(--status-critical)' : b.priority === 'URGENT' ? 'var(--status-medium)' : 'var(--text-muted)',
                    }}
                  >
                    {b.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-(--text-primary) truncate">{b.message}</div>
                    <div className="text-(--text-muted) text-[11px]">{b.sent_by_name} · {b.target_area}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dispatcher-surface p-4 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-semibold text-[13px]">Mutual Aid Requests</div>
            <Link to="/ops-manager/resources" className="text-[11px] text-(--accent) font-semibold no-underline">
              Manage →
            </Link>
          </div>
          {loading ? (
            <p className="text-[12px] text-(--text-muted) m-0">Loading…</p>
          ) : mutualAidRequests.length === 0 ? (
            <p className="text-[12px] text-(--text-muted) m-0">No mutual aid requests from your district.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {mutualAidRequests.slice(0, 5).map((r) => (
                <div key={r.request_id} className="flex items-center gap-3 border-b border-(--border-subtle) pb-2 text-[12px]">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.quantity}× {r.unit_type}</div>
                    <div className="text-(--text-muted) text-[11px]">{r.reason ?? 'No reason given'}</div>
                  </div>
                  <StatusBadge
                    label={r.status}
                    variant={r.status === 'PENDING' ? 'handover' : r.status === 'APPROVED' || r.status === 'FULFILLED' ? 'resolved' : 'critical'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
