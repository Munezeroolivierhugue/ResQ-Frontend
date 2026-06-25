import { useState } from 'react'
import { AlertTriangle, Users, ShieldAlert, Star } from 'lucide-react'
import BottomSheet, { BottomSheetClose } from './BottomSheet'
import { FR_BACKUP_REASONS, FR_OFFICER, FR_ASSIGNMENT } from '../../data/mockFieldResponderData'
import { mockBackupRequests } from '../../data/mockBackupRequests'
import { generateUuid } from '../../utils/formHelpers'
import { useFieldResponderStore } from '../../store/fieldResponderStore'

const ICONS = { users: Users, shield: ShieldAlert, star: Star }

export default function BackupRequestModal({ open, onClose }) {
  const showToast = useFieldResponderStore((s) => s.showToast)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const confirm = () => {
    if (!reason) return
    const reasonObj = FR_BACKUP_REASONS.find((r) => r.id === reason)
    mockBackupRequests.push({
      backup_id: generateUuid(),
      incident_id: FR_ASSIGNMENT.incident_id,
      requesting_unit_id: FR_OFFICER.vehicle_id,
      reason: reasonObj?.label || reason,
      notes: notes || null,
      created_at: new Date().toISOString(),
    })
    showToast('Backup requested · OM notified · Units navigating to your GPS', 'critical')
    setReason('')
    setNotes('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="fr-sheet-body">
        <div className="fr-backup-header">
          <AlertTriangle size={28} className="text-(--status-critical)" />
          <h2 className="fr-backup-title">Request Backup</h2>
          <p className="fr-backup-sub">
            This will escalate immediately to Operations Manager
          </p>
        </div>
        <div className="field-label mb-2">Reason</div>
        {FR_BACKUP_REASONS.map((r) => {
          const Icon = ICONS[r.icon] || Users
          return (
            <button
              key={r.id}
              type="button"
              className={`fr-backup-card${reason === r.id ? ' fr-backup-card--selected' : ''}`}
              onClick={() => setReason(r.id)}
            >
              <Icon size={20} className={r.id === 'safety' ? 'text-(--status-critical)' : 'text-(--accent)'} />
              <div className="text-left">
                <div className="text-[13px] font-semibold">{r.label}</div>
                <div className="text-[11px] text-(--text-secondary)">{r.sub}</div>
              </div>
            </button>
          )
        })}
        <label className="dispatcher-field mt-2">
          <span className="field-label">Additional context (optional)</span>
          <textarea
            className="dispatcher-input dispatcher-textarea"
            style={{ minHeight: '72px' }}
            placeholder="Describe the immediate threat..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="fr-backup-confirm"
          onClick={confirm}
          disabled={!reason}
        >
          <AlertTriangle size={24} />
          CONFIRM BACKUP REQUEST
        </button>
        <BottomSheetClose onClick={onClose} />
      </div>
    </BottomSheet>
  )
}
