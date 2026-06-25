import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Save, Upload, FileText, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/dispatcher/PageHeader'
import SurfaceCard from '../../components/dispatcher/SurfaceCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import VerticalTimeline from '../../components/dispatcher/VerticalTimeline'
import MediaAttachmentGrid from '../../components/dispatcher/MediaAttachmentGrid'
import {
  FormSelect,
  FormTextarea,
  FormInput,
} from '../../components/dispatcher/FormControls'
import { mockIncidentClosure } from '../../data/mockIncidentClosureData'
import { mockIncidentClosures } from '../../data/mockIncidentClosures'

const DISPOSITION_OPTIONS = [
  { value: 'arrests', label: 'Arrest(s) made' },
  { value: 'medical_transport', label: 'Medical transport only' },
  { value: 'scene_cleared', label: 'Scene cleared — no arrest' },
  { value: 'referred', label: 'Referred to investigation unit' },
  { value: 'no_action', label: 'No action required' },
]

export default function IncidentClosure() {
  const navigate = useNavigate()
  const data = mockIncidentClosure

  const [mode, setMode] = useState('structured') // 'structured' | 'manual_upload'
  const [submitted, setSubmitted] = useState(false)

  // Structured mode fields
  const [personsInvolved, setPersonsInvolved] = useState(String(data.persons_involved ?? ''))
  const [casualties, setCasualties] = useState(String(data.casualties ?? '0'))
  const [arrests, setArrests] = useState(String(data.arrests ?? '0'))
  const [finalDisposition, setFinalDisposition] = useState(data.final_disposition ?? 'scene_cleared')
  const [closureNotes, setClosureNotes] = useState(data.closure_notes ?? '')

  // Manual upload state
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadError, setUploadError] = useState('')

  const handleStructuredClose = () => {
    const entry = {
      closure_id: `cl-new-${Date.now()}`,
      incident_id: data.incident_id,
      field_report_id: null,
      closed_by: 'u1111111-0000-4000-8000-000000000001',
      persons_involved: parseInt(personsInvolved) || 0,
      casualties: parseInt(casualties) || 0,
      arrests: parseInt(arrests) || 0,
      final_disposition: finalDisposition,
      closure_notes: closureNotes,
      data_source: 'dispatcher_portal',
      closed_at: new Date().toISOString(),
    }
    mockIncidentClosures.unshift(entry)
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

  const handleManualClose = () => {
    if (!uploadedFile) {
      setUploadError('Please attach a field report file before closing.')
      return
    }
    const entry = {
      closure_id: `cl-new-${Date.now()}`,
      incident_id: data.incident_id,
      field_report_id: null,
      closed_by: 'u1111111-0000-4000-8000-000000000001',
      persons_involved: null,
      casualties: null,
      arrests: null,
      final_disposition: null,
      closure_notes: `Manual upload: ${uploadedFile.name}`,
      data_source: 'field_upload',
      closed_at: new Date().toISOString(),
    }
    mockIncidentClosures.unshift(entry)
    setSubmitted(true)
    setTimeout(() => navigate('/dispatcher/shift-handover'), 1800)
  }

  return (
    <div className="portal-page dispatcher-page">
      <PageHeader
        breadcrumbCurrent="Incident report"
        title="Incident outcome & closure"
        subtitle={data.subtitle}
        badges={<span className="dispatcher-eyebrow">Incident closure</span>}
      />

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
          <div className="dispatcher-form-actions">
            <button
              type="button"
              onClick={handleStructuredClose}
              disabled={submitted}
              className="dispatcher-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={16} />
              Close incident
            </button>
            <button type="button" className="dispatcher-btn-ghost">
              <Save size={14} />
              Save as draft
            </button>
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
              disabled={submitted}
              className="dispatcher-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={16} />
              Close with uploaded report
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
                Total elapsed: {data.timelineElapsed}
              </span>
            }
            className="mb-4"
          />
          <VerticalTimeline events={data.timeline} />
        </SurfaceCard>
        <SurfaceCard padding="p-5 md:p-6">
          <MediaAttachmentGrid items={data.media} />
        </SurfaceCard>
      </div>
    </div>
  )
}
