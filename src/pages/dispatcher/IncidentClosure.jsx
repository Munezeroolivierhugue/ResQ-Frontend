import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Save, Upload, FileText, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/dispatcher/PageHeader'
import SurfaceCard from '../../components/dispatcher/SurfaceCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import VerticalTimeline from '../../components/dispatcher/VerticalTimeline'
import MediaAttachmentGrid from '../../components/dispatcher/MediaAttachmentGrid'
import FieldReportCard from '../../components/dispatcher/FieldReportCard'
import ClosureRecordCard from '../../components/dispatcher/ClosureRecordCard'
import {
  FormSelect,
  FormTextarea,
  FormInput,
} from '../../components/dispatcher/FormControls'
import { listIncidents, createIncidentClosure, getIncident } from '../../api/incidents'
import { submitFieldReport, uploadAttachment, getReportForIncident, getClosureForIncident, listAttachments, attachmentUrl } from '../../api/fieldReports'
import { formatIncidentType } from '../../utils/incidentTypeLabels'

const DISPOSITION_OPTIONS = [
  { value: 'arrests', label: 'Arrest(s) made' },
  { value: 'medical_transport', label: 'Medical transport only' },
  { value: 'scene_cleared', label: 'Scene cleared — no arrest' },
  { value: 'referred', label: 'Referred to investigation unit' },
  { value: 'no_action', label: 'No action required' },
]

// Persists which incident this closure form is for across page refresh/back-
// forward navigation — react-router's route `state` (the only thing this
// page used to rely on) is lost on a hard refresh, which silently fell back
// to "the first PENDING_REPORT incident found," often a stale/unrelated test
// incident rather than the one the dispatcher was actually working on.
const CLOSURE_INCIDENT_KEY = 'resq-closure-incident-id'

export default function IncidentClosure() {
  const navigate = useNavigate()
  const { state: navState } = useLocation()
  const storedIncidentId = navState?.incident ? null : sessionStorage.getItem(CLOSURE_INCIDENT_KEY)
  const [incident, setIncident] = useState(navState?.incident ?? null)
  const [loadingIncident, setLoadingIncident] = useState(!navState?.incident)

  useEffect(() => {
    if (navState?.incident) {
      sessionStorage.setItem(CLOSURE_INCIDENT_KEY, navState.incident.incident_id)
      return
    }
    if (storedIncidentId) {
      getIncident(storedIncidentId)
        .then((inc) => setIncident(inc))
        .catch(() => sessionStorage.removeItem(CLOSURE_INCIDENT_KEY))
        .finally(() => setLoadingIncident(false))
      return
    }
    // Truly no context (fresh navigation, nothing in session) — last resort
    // fallback to whatever's oldest pending, same as before.
    listIncidents({ status: 'PENDING_REPORT' })
      .then((incs) => {
        const first = incs[0] ?? null
        setIncident(first)
        if (first) sessionStorage.setItem(CLOSURE_INCIDENT_KEY, first.incident_id)
      })
      .catch(() => {})
      .finally(() => setLoadingIncident(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [mode, setMode] = useState('structured') // 'structured' | 'manual_upload'
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // The field responder's own submission — previously nothing on this page
  // ever fetched or displayed it, so the dispatcher had no way to see what
  // was actually reported from the scene before writing the formal closure.
  const [fieldReport, setFieldReport] = useState(null)
  const [fieldReportLoading, setFieldReportLoading] = useState(false)
  const [fieldReportPhotos, setFieldReportPhotos] = useState([])
  // If this incident was already closed (e.g. the dispatcher navigated back
  // here to double-check what was submitted), show the final closure record
  // read-only instead of leaving no trace of it anywhere on this page.
  const [existingClosure, setExistingClosure] = useState(null)

  // Structured mode fields
  const [personsInvolved, setPersonsInvolved] = useState('')
  const [casualties, setCasualties] = useState('0')
  const [arrests, setArrests] = useState('0')
  const [finalDisposition, setFinalDisposition] = useState('scene_cleared')
  const [closureNotes, setClosureNotes] = useState('')
  // "Save as draft" was a dead button — clicking it did nothing. Persist the
  // in-progress form to localStorage per-incident so a dispatcher can leave
  // this page mid-write (e.g. to check something on Active Incident) and
  // come back to exactly what they'd typed.
  const [draftSaved, setDraftSaved] = useState(false)
  const draftKey = incident?.incident_id ? `resq-closure-draft-${incident.incident_id}` : null

  useEffect(() => {
    if (!draftKey) return
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.personsInvolved != null) setPersonsInvolved(draft.personsInvolved)
      if (draft.casualties != null) setCasualties(draft.casualties)
      if (draft.arrests != null) setArrests(draft.arrests)
      if (draft.finalDisposition != null) setFinalDisposition(draft.finalDisposition)
      if (draft.closureNotes != null) setClosureNotes(draft.closureNotes)
    } catch { /* ignore corrupt draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  const handleSaveDraft = () => {
    if (!draftKey) return
    localStorage.setItem(draftKey, JSON.stringify({
      personsInvolved, casualties, arrests, finalDisposition, closureNotes,
    }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2500)
  }

  useEffect(() => {
    const incidentId = incident?.incident_id
    if (!incidentId) { setExistingClosure(null); return }
    getClosureForIncident(incidentId).then(setExistingClosure).catch(() => setExistingClosure(null))
  }, [incident?.incident_id])

  useEffect(() => {
    const incidentId = incident?.incident_id
    if (!incidentId) { setFieldReport(null); setFieldReportPhotos([]); return }
    setFieldReportLoading(true)
    getReportForIncident(incidentId)
      .then((r) => {
        setFieldReport(r)
        if (r?.persons_involved != null) setPersonsInvolved(String(r.persons_involved))
        // Photos the responder attached were uploaded successfully server-side
        // but this page (and every other dispatcher screen) never fetched
        // them — the "Media attachments" panel below always rendered an
        // empty, hardcoded [] regardless of what was actually submitted.
        if (r?.report_id) {
          listAttachments(r.report_id).then(setFieldReportPhotos).catch(() => setFieldReportPhotos([]))
        } else {
          setFieldReportPhotos([])
        }
      })
      .catch(() => { setFieldReport(null); setFieldReportPhotos([]) })
      .finally(() => setFieldReportLoading(false))
  }, [incident?.incident_id])

  // Manual upload state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadError, setUploadError] = useState('')

  async function submitClosure(dataSource, notesOverride) {
    setSubmitError(null)
    if (!incident?.incident_id) {
      setSubmitError('No incident loaded. Open this page from Pending Reports to select an incident.')
      return false
    }
    try {
      await createIncidentClosure({
        incidentId:       incident.incident_id,
        personsInvolved:  personsInvolved || null,
        casualties,
        arrests,
        finalDisposition,
        closureNotes:     notesOverride !== undefined ? notesOverride : closureNotes,
        dataSource,
      })
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? 'Failed to save report. Please retry.'
      setSubmitError(msg)
      return false
    }
    return true
  }

  const handleStructuredClose = async () => {
    const ok = await submitClosure('dispatcher_portal')
    if (!ok) return
    sessionStorage.removeItem(CLOSURE_INCIDENT_KEY)
    if (draftKey) localStorage.removeItem(draftKey)
    setSubmitted(true)
    setTimeout(() => navigate('/dispatcher/shift-handover'), 1800)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setUploadError('')
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
    if (!allowed.includes(file.type)) {
      setUploadError('Only PDF, JPEG, PNG, or TXT files are accepted.')
      return
    }
    setUploadedFile(file)
  }

  const [uploading, setUploading] = useState(false)

  const handleManualClose = async () => {
    if (!uploadedFile) {
      setUploadError('Please attach a field report file before closing.')
      return
    }
    setUploadError('')
    setSubmitError(null)
    if (!incident?.incident_id) {
      setSubmitError('No incident loaded. Navigate here from Pending Reports to select an incident.')
      return
    }
    setUploading(true)
    let fileNote
    try {
      const report = await submitFieldReport({
        incident_id: incident.incident_id,
        description: `Manually uploaded closure report: ${uploadedFile.name}`,
        entry_method: 'MANUAL_UPLOAD',
      })
      try {
        await uploadAttachment(report.report_id, uploadedFile, 'Closure report upload')
      } catch {
        // Attachment endpoint not yet available — record file name in notes instead
        fileNote = `Attached file: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to create field report. Please retry.'
      setSubmitError(msg)
      setUploading(false)
      return
    }
    const ok = await submitClosure('manual_upload', fileNote ?? closureNotes)
    setUploading(false)
    if (!ok) return
    sessionStorage.removeItem(CLOSURE_INCIDENT_KEY)
    if (draftKey) localStorage.removeItem(draftKey)
    setSubmitted(true)
    setTimeout(() => navigate('/dispatcher/shift-handover'), 1800)
  }

  if (loadingIncident) {
    return (
      <div className="portal-page dispatcher-page">
        <PageHeader breadcrumbCurrent="Incident report" title="Incident outcome & closure" badges={<span className="dispatcher-eyebrow">Incident closure</span>} />
        <div className="text-(--text-secondary) text-[14px] mt-8 text-center">Loading pending reports…</div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="portal-page dispatcher-page">
        <PageHeader breadcrumbCurrent="Incident report" title="Incident outcome & closure" badges={<span className="dispatcher-eyebrow">Incident closure</span>} />
        <div
          className="flex flex-col items-center gap-3 mt-12 text-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          <FileText size={40} style={{ opacity: 0.4 }} />
          <p className="text-[15px] font-semibold text-(--text-primary)">No pending incidents</p>
          <p className="text-[13px]">There are no incidents awaiting closure. Open this page from <strong>Pending Reports</strong> to close a specific incident.</p>
          <button
            type="button"
            className="dispatcher-btn-primary text-[13px] mt-2"
            onClick={() => navigate('/dispatcher/pending-reports')}
          >
            Go to Pending Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-page dispatcher-page">
      <PageHeader
        breadcrumbCurrent="Incident report"
        title="Incident outcome & closure"
        subtitle={`${incident.incident_ref} · ${formatIncidentType(incident.incident_type)} · ${incident.address ?? incident.district ?? ''}`}
        badges={<span className="dispatcher-eyebrow">Incident closure</span>}
      />

      {/* Error banner */}
      {submitError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-5 text-[13px] font-semibold"
          style={{
            background: 'var(--status-critical-bg)',
            color: 'var(--status-critical)',
            borderColor: 'var(--status-critical)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {submitError}
        </div>
      )}

      {/* Success toast */}
      {submitted && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-5 text-[13px] font-semibold"
          style={{
            background: 'var(--status-low-bg)',
            color: 'var(--status-low)',
            borderColor: 'var(--status-low)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <CheckCircle size={16} />
          Incident closed — record written. Redirecting to shift handover…
        </div>
      )}

      {/* Field responder's submitted report — read-only reference for the dispatcher */}
      {fieldReportLoading && (
        <SurfaceCard className="mb-5" padding="p-4">
          <p className="text-[12px] text-(--text-muted) m-0">Loading field responder&apos;s report…</p>
        </SurfaceCard>
      )}
      {!fieldReportLoading && fieldReport && (
        <SurfaceCard className="mb-5" padding="p-4 md:p-5">
          <SectionTitle title="Field responder's report" className="mb-3" />
          <FieldReportCard
            fieldReport={fieldReport}
            location={incident?.address ?? (incident?.district ? `${incident.district}${incident.sector ? ' / ' + incident.sector : ''}` : null)}
          />
        </SurfaceCard>
      )}
      {!fieldReportLoading && !fieldReport && (
        <SurfaceCard className="mb-5" padding="p-4">
          <p className="text-[12px] text-(--text-muted) m-0">
            No field report has been submitted for this incident yet — you can still close it using structured entry
            or an uploaded report below.
          </p>
        </SurfaceCard>
      )}

      {/* Mode switcher */}
      <SurfaceCard className="mb-5" padding="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-0.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Closure entry method
            </div>
            <p className="text-[12px] text-(--text-secondary) m-0">
              Choose how to submit the final incident report.
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-(--bg-base) border border-(--border)">
            {[
              { key: 'structured', icon: FileText, label: 'Structured Entry' },
              { key: 'manual_upload', icon: Upload, label: 'Upload Report' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border-none cursor-pointer transition-all"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: mode === key ? 'var(--accent)' : 'transparent',
                  color: mode === key ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      {/* Structured mode */}
      {mode === 'structured' && (
        <SurfaceCard className="mb-5" padding="p-5 md:p-6">
          <SectionTitle title="Incident outcome summary" className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <FormInput
              label="Persons involved"
              value={personsInvolved}
              onChange={setPersonsInvolved}
              placeholder="e.g. 12"
            />
            <FormInput
              label="Casualties"
              value={casualties}
              onChange={setCasualties}
              placeholder="e.g. 0"
            />
            <FormInput
              label="Arrests"
              value={arrests}
              onChange={setArrests}
              placeholder="e.g. 2"
            />
          </div>
          <div className="mb-4">
            <FormSelect
              label="Final disposition"
              value={finalDisposition}
              onChange={setFinalDisposition}
              options={DISPOSITION_OPTIONS}
            />
          </div>
          <FormTextarea
            label="Closure notes"
            value={closureNotes}
            onChange={setClosureNotes}
            placeholder="Enter formal closing statement for the incident dossier…"
            className="mb-4"
          />
          <div
            className="text-[11px] text-(--text-muted) px-3 py-2 rounded-lg border border-(--border) mb-5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            data_source: <strong>dispatcher_portal</strong> · closed_by: Jean Bosco
          </div>
        </SurfaceCard>
      )}

      {/* Manual upload mode */}
      {mode === 'manual_upload' && (
        <SurfaceCard className="mb-5" padding="p-5 md:p-6">
          <SectionTitle title="Upload field report" className="mb-4" />
          <p className="text-[13px] text-(--text-secondary) mb-5">
            Attach the physical or digitally-signed field report to close this incident. Accepted formats: PDF, JPEG, PNG, TXT.
          </p>

          <label
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors py-12"
            style={{
              borderColor: uploadedFile ? 'var(--status-low)' : 'var(--border)',
              background: uploadedFile ? 'var(--status-low-bg)' : 'var(--bg-input)',
            }}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt"
              className="sr-only"
              onChange={handleFileChange}
            />
            {uploadedFile ? (
              <>
                <CheckCircle size={28} style={{ color: 'var(--status-low)' }} />
                <div className="text-center">
                  <div
                    className="text-[13px] font-bold text-(--status-low)"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {uploadedFile.name}
                  </div>
                  <div className="text-[11px] text-(--text-muted) mt-0.5">
                    {(uploadedFile.size / 1024).toFixed(1)} KB · Click to replace
                  </div>
                </div>
              </>
            ) : (
              <>
                <Upload size={28} style={{ color: 'var(--text-muted)' }} />
                <div className="text-center">
                  <div
                    className="text-[13px] font-semibold text-(--text-primary)"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Click to attach field report
                  </div>
                  <div className="text-[11px] text-(--text-muted) mt-0.5">PDF, JPEG, PNG or TXT</div>
                </div>
              </>
            )}
          </label>

          {uploadError && (
            <p className="text-[12px] mt-2 m-0" style={{ color: 'var(--status-critical)' }}>
              {uploadError}
            </p>
          )}

          <div className="dispatcher-form-actions mt-5">
            <button
              type="button"
              onClick={handleManualClose}
              disabled={submitted || uploading}
              className="dispatcher-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={16} />
              {uploading ? 'Uploading report…' : 'Close with uploaded report'}
            </button>
            <button
              type="button"
              onClick={() => setMode('structured')}
              className="dispatcher-btn-ghost"
            >
              Switch to structured entry
            </button>
          </div>
        </SurfaceCard>
      )}

      {/* Timeline + Media — always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfaceCard padding="p-5 md:p-6">
          <SectionTitle
            title="Response timeline"
            badge={
              <span
                className="text-[12px] font-semibold text-(--status-medium)"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {incident?.call_time ? `Started: ${new Date(incident.call_time).toLocaleString()}` : ''}
              </span>
            }
            className="mb-4"
          />
          <VerticalTimeline events={[]} />
        </SurfaceCard>
        <SurfaceCard padding="p-5 md:p-6">
          <MediaAttachmentGrid items={fieldReportPhotos.map((p) => ({
            id: p.attachment_id,
            image: p.file_type === 'IMAGE' ? attachmentUrl(p.file_url) : '',
            label: p.file_type ?? 'File',
            caption: p.caption ?? '',
          }))} />
        </SurfaceCard>
      </div>

      {existingClosure && (
        <SurfaceCard className="mt-5" padding="p-5 md:p-6">
          <SectionTitle title="Closure record" className="mb-4" />
          <ClosureRecordCard closure={existingClosure} />
        </SurfaceCard>
      )}

      {mode === 'structured' && !existingClosure && (
        <div className="dispatcher-form-actions mt-5">
          <button
            type="button"
            onClick={handleStructuredClose}
            disabled={submitted}
            className="dispatcher-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock size={16} />
            Close incident
          </button>
          <button type="button" className="dispatcher-btn-ghost" onClick={handleSaveDraft} disabled={submitted}>
            <Save size={14} />
            {draftSaved ? 'Draft saved ✓' : 'Save as draft'}
          </button>
        </div>
      )}
    </div>
  )
}
