import { useState } from 'react'
import { Flag } from 'lucide-react'
import BottomSheet, { BottomSheetClose } from './BottomSheet'
import { FR_FLAG_OPTIONS, FR_OFFICER } from '../../data/mockFieldResponderData'
import { mockAuditLogs } from '../../data/mockAuditLogs'
import { generateUuid } from '../../utils/formHelpers'
import { useToastStore } from '../../store/toastStore'

export default function FlagIssueModal({ open, onClose }) {
  const pushToast = useToastStore((s) => s.pushToast)
  const [selected, setSelected] = useState('')
  const [notes, setNotes] = useState('')

  const submit = () => {
    if (!selected) return
    mockAuditLogs.push({
      log_id: generateUuid(),
      user_id: FR_OFFICER.user_id,
      timestamp: new Date().toISOString(),
      action: `DISPATCH_FLAGGED: ${selected}`,
      module: 'FIELD_RESPONDER',
      ip_address: null,
      status: 'SUCCESS',
    })
    pushToast({ variant: 'warning', title: 'Flag Submitted', message: 'Dispatcher notified' })
    setSelected('')
    setNotes('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Flag Assignment Issue">
      <div className="fr-sheet-body">
        {FR_FLAG_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`fr-tap-card${selected === opt ? ' fr-tap-card--selected' : ''}`}
            onClick={() => setSelected(opt)}
          >
            {opt}
          </button>
        ))}
        <label className="dispatcher-field mt-3">
          <textarea
            className="dispatcher-input dispatcher-textarea"
            style={{ minHeight: '72px' }}
            placeholder="Additional context (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="dispatcher-btn-primary fr-btn-full fr-btn-lg mt-3"
          onClick={submit}
          disabled={!selected}
        >
          <Flag size={18} />
          Submit Flag
        </button>
        <BottomSheetClose onClick={onClose} />
      </div>
    </BottomSheet>
  )
}
