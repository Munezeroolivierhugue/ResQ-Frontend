import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Wifi, List, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { getWeather, getPredictions } from '../../api/planning'

// Every integration below is a REAL connection this system actually makes —
// no fabricated third-party services. Config values are the real property
// keys/env vars from ResQ-Backend/src/main/resources/application.properties;
// secrets are never shown, only whether they're set. Two integrations
// (OpenWeatherMap, AI Engine) have a real endpoint this admin panel can call
// to test live; OSRM is tested with a direct call from the browser since it's
// called from the frontend, not the backend. The rest (SMTP email, Africa's
// Talking voice gateway, Redis) are backend-internal with no endpoint exposed
// for a live test from here — that's stated plainly rather than faked.
const INTEGRATIONS = [
  {
    id: 'weather',
    name: 'OpenWeatherMap — Weather API',
    category: 'External API',
    description: 'Powers the hazard-alert banners on Ops Manager and Field Responder screens (hazardous/moderate/clear conditions per district).',
    config: [
      ['Base URL', 'https://api.openweathermap.org/data/2.5'],
      ['Endpoint used', 'GET /weather'],
      ['API key env var', 'RESQ_WEATHER_API_KEY'],
      ['Exposed via', 'GET /api/planning/weather'],
      ['Cache', '10 min per district'],
    ],
    testable: true,
  },
  {
    id: 'ai-engine',
    name: 'ResQ AI Engine (FastAPI, port 8001)',
    category: 'Internal microservice',
    description: 'Dispatch recommendations, incident predictions, coverage-gap analysis, mutual-aid suggestions, pattern & anomaly detection.',
    config: [
      ['Base URL env var', 'RESQ_AI_ENGINE_URL'],
      ['Default', 'http://localhost:8001'],
      ['Endpoints', '/ai/dispatch, /ai/predict, /ai/coverage, /ai/mutual-aid, /ai/patterns, /ai/anomalies'],
      ['Exposed via', 'GET /api/planning/predictions (and others internally)'],
    ],
    testable: true,
  },
  {
    id: 'osrm',
    name: 'OSRM Routing (router.project-osrm.org)',
    category: 'External API — frontend only',
    description: 'Real road-following route geometry for Field Responder navigation. Public free-tier demo router — no hazard-avoidance routing on this tier.',
    config: [
      ['Base URL', 'https://router.project-osrm.org'],
      ['Called from', 'Field Responder navigation (browser → OSRM directly)'],
      ['Auth', 'None (public demo server)'],
    ],
    testable: true,
  },
  {
    id: 'smtp',
    name: 'SMTP Email (Gmail)',
    category: 'Backend-internal',
    description: 'Sends real account-invitation emails.',
    config: [
      ['Host', 'smtp.gmail.com : 587'],
      ['Username env var', 'RESQ_MAIL_USERNAME'],
      ['Password env var', 'RESQ_MAIL_PASSWORD'],
    ],
    testable: false,
  },
  {
    id: 'africastalking',
    name: "Africa's Talking — Voice Gateway",
    category: 'Backend-internal',
    description: 'Routes 112/111/113/912 emergency voice calls via webhook (sandbox mode by default).',
    config: [
      ['Username env var', 'AFRICASTALKING_USERNAME'],
      ['API key env var', 'AFRICASTALKING_API_KEY'],
      ['Webhooks', 'POST /webhook/at/voice, POST /webhook/at/recording'],
    ],
    testable: false,
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'Backend-internal',
    description: 'Caching, login rate-limiting, and MFA challenge codes.',
    config: [
      ['Host env var', 'RESQ_REDIS_HOST'],
      ['Port env var', 'RESQ_REDIS_PORT'],
    ],
    testable: false,
  },
]

async function testOsrm() {
  // Real short route inside Kigali — just checks the public router responds,
  // same endpoint FRNavigation.jsx calls for live navigation.
  const url = 'https://router.project-osrm.org/route/v1/driving/30.0619,-1.9441;30.1044,-1.9536?overview=false'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error(data.message || data.code)
  return `Reachable — sample route: ${(data.routes[0].distance / 1000).toFixed(1)} km, ${Math.round(data.routes[0].duration / 60)} min`
}

async function testWeather() {
  const rows = await getWeather()
  if (!rows.length) return 'Reachable — no districts returned.'
  const sample = rows[0]
  const stale = rows.every((r) => r.condition === 'UNAVAILABLE')
  if (stale) throw new Error('API key not configured or upstream unreachable — all districts returned UNAVAILABLE.')
  return `Reachable — ${sample.district_name}: ${sample.condition}, ${sample.temperature_c}°C (${rows.length} districts fetched)`
}

async function testAiEngine() {
  const data = await getPredictions()
  const count = Array.isArray(data) ? data.length : Object.keys(data ?? {}).length
  return `Reachable — /api/planning/predictions responded (${count} item${count === 1 ? '' : 's'})`
}

const TEST_FN = { weather: testWeather, 'ai-engine': testAiEngine, osrm: testOsrm }

function IntegrationCard({ integ, testState, onTest, onToggleConfig, configOpen, navigate }) {
  return (
    <div className="dispatcher-surface p-5">
      <div className="flex flex-wrap justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold">{integ.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-ghost)', color: 'var(--accent)' }}>
              {integ.category}
            </span>
          </div>
          <p className="text-[13px] text-(--text-primary) mt-1 mb-0 max-w-xl" style={{ fontFamily: 'var(--font-body)' }}>{integ.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 h-fit">
          <button
            type="button"
            className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"
            onClick={() => onToggleConfig(integ.id)}
          >
            <Settings size={12} />Configure
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"
            disabled={!integ.testable || testState?.status === 'loading'}
            title={integ.testable ? undefined : 'No live test endpoint exists for this integration — it runs entirely inside the backend with no health-check route exposed.'}
            onClick={() => onTest(integ)}
          >
            {testState?.status === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
            Test Connection
          </button>
          <button
            type="button"
            className="dispatcher-btn-ghost text-[11px] h-8 px-2 inline-flex items-center gap-1"
            onClick={() => navigate('/admin/audit')}
          >
            <List size={12} />View Logs
          </button>
        </div>
      </div>

      {configOpen && (
        <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-elevated)' }}>
          <div className="text-[11px] font-semibold text-(--text-secondary) mb-2">
            Real configuration — set via server environment variables, not editable from this panel
          </div>
          <table className="w-full text-[12px]">
            <tbody>
              {integ.config.map(([label, val]) => (
                <tr key={label} className="border-b border-(--border-subtle) last:border-0">
                  <td className="py-1.5 pr-3 text-(--text-muted) whitespace-nowrap">{label}</td>
                  <td className="py-1.5 font-mono text-(--text-primary) break-all">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {testState && (
        <div
          className="rounded-lg p-3 text-[12px] flex items-start gap-2"
          style={{
            background: testState.status === 'error' ? 'var(--status-critical-bg)' : 'var(--status-low-bg)',
            color: testState.status === 'error' ? 'var(--status-critical)' : 'var(--status-low)',
          }}
        >
          {testState.status === 'error'
            ? <XCircle size={14} className="shrink-0 mt-0.5" />
            : testState.status !== 'loading' && <CheckCircle2 size={14} className="shrink-0 mt-0.5" />}
          <span>{testState.status === 'loading' ? 'Testing…' : testState.message}</span>
        </div>
      )}
    </div>
  )
}

export default function AdminIntegrations() {
  const navigate = useNavigate()
  const [configOpenId, setConfigOpenId] = useState(null)
  const [testStates, setTestStates] = useState({})

  async function handleTest(integ) {
    const fn = TEST_FN[integ.id]
    if (!fn) return
    setTestStates((s) => ({ ...s, [integ.id]: { status: 'loading' } }))
    try {
      const message = await fn()
      setTestStates((s) => ({ ...s, [integ.id]: { status: 'ok', message } }))
    } catch (err) {
      setTestStates((s) => ({
        ...s,
        [integ.id]: { status: 'error', message: err?.response?.data?.message || err?.message || 'Connection failed.' },
      }))
    }
  }

  return (
    <div className="portal-page flex flex-col gap-4 min-w-[1024px]">
      <AdminPageHeader
        title="Integration Management"
        subtitle="The real external and internal service connections this system makes — no placeholder integrations."
        eyebrow="Super Admin Portal"
        badge="Live Connections"
      />

      {INTEGRATIONS.map((integ) => (
        <IntegrationCard
          key={integ.id}
          integ={integ}
          testState={testStates[integ.id]}
          onTest={handleTest}
          onToggleConfig={(id) => setConfigOpenId((cur) => (cur === id ? null : id))}
          configOpen={configOpenId === integ.id}
          navigate={navigate}
        />
      ))}
    </div>
  )
}
