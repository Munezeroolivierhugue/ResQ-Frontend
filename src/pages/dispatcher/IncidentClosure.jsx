import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Save } from 'lucide-react'
import PageHeader from '../../components/dispatcher/PageHeader'
import SurfaceCard from '../../components/dispatcher/SurfaceCard'
import SectionTitle from '../../components/dispatcher/SectionTitle'
import VerticalTimeline from '../../components/dispatcher/VerticalTimeline'
import MediaAttachmentGrid from '../../components/dispatcher/MediaAttachmentGrid'
import {
  FormSelect,
  FormTextarea,
  FormInput,
  EditableSummaryStat,
} from '../../components/dispatcher/FormControls'
import StatusBadge from '../../components/dispatcher/StatusBadge'
import { mockIncidentClosure } from '../../data/mockIncidentClosureData'

export default function IncidentClosure() {
  const navigate = useNavigate()
  const data = mockIncidentClosure

  const [disposition, setDisposition] = useState(data.defaultDisposition)
  const [recovery, setRecovery] = useState(data.defaultRecovery)
  const [narrative, setNarrative] = useState('')
  const [casualties, setCasualties] = useState('')
  const [arrestsMade, setArrestsMade] = useState('')
  const [propertyDamage, setPropertyDamage] = useState('')
  const [fatalities, setFatalities] = useState('')
  const [injuries, setInjuries] = useState('')
  const [arrests, setArrests] = useState('')
  const [vehiclesSeized, setVehiclesSeized] = useState('')

  const handleClose = () => {
    navigate('/dispatcher/shift-handover')
  }

  return (
    <div className="p-6 dispatcher-page">
      <PageHeader
        breadcrumbCurrent="Incident report"
        title="Incident outcome & closure"
        subtitle={data.subtitle}
        badges={
          <>
            <span className="dispatcher-case-badge">Case ID: {data.caseId}</span>
            <StatusBadge label={`Incident status: ${data.status}`} variant="info" />
          </>
        }
      />

      <SurfaceCard className="mb-5" padding="p-5 md:p-6">
        <SectionTitle title="Incident outcome summary" className="mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="Casualties"
            value={casualties}
            onChange={setCasualties}
            placeholder="e.g. 0 confirmed"
          />
          <FormInput
            label="Arrests made"
            value={arrestsMade}
            onChange={setArrestsMade}
            placeholder="e.g. 4 suspects"
          />
          <FormInput
            label="Property damage"
            value={propertyDamage}
            onChange={setPropertyDamage}
            placeholder="e.g. Minimal impact"
          />
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-5" padding="p-5 md:p-6">
        <SectionTitle title="Operational outcome log" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormSelect
            label="Final disposition"
            value={disposition}
            onChange={setDisposition}
            options={data.dispositionOptions}
          />
          <FormSelect
            label="Property recovery status"
            value={recovery}
            onChange={setRecovery}
            options={data.recoveryOptions}
          />
        </div>
        <FormTextarea
          label="Concluding narrative"
          value={narrative}
          onChange={setNarrative}
          placeholder="Enter formal closing statement for the incident dossier…"
          className="mb-4"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <EditableSummaryStat
            label="Fatalities"
            value={fatalities}
            onChange={setFatalities}
            placeholder="0"
          />
          <EditableSummaryStat
            label="Injuries"
            value={injuries}
            onChange={setInjuries}
            placeholder="0"
          />
          <EditableSummaryStat
            label="Arrests"
            value={arrests}
            onChange={setArrests}
            placeholder="0"
          />
          <EditableSummaryStat
            label="Veh. seized"
            value={vehiclesSeized}
            onChange={setVehiclesSeized}
            placeholder="0"
          />
        </div>
        <div className="dispatcher-form-actions">
          <button type="button" onClick={handleClose} className="dispatcher-btn-primary">
            <Lock size={16} />
            Close incident
          </button>
          <button type="button" className="dispatcher-btn-ghost">
            <Save size={14} />
            Save as draft
          </button>
        </div>
      </SurfaceCard>

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
