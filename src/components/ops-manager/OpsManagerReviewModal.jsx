import { useState } from 'react'
import { X, ShieldCheck, Radio, AlertTriangle } from 'lucide-react'

export default function OpsManagerReviewModal({ isOpen, requestDetails, onClose, onBroadcast }) {
  if (!isOpen || !requestDetails) return null

  const handleBroadcast = () => {
    // Passes the confirmed details back up
    onBroadcast(requestDetails)
    onClose()
  }

  const resourceLabels = {
    ambulance: 'Ambulance (ALS/BLS)',
    fireTruck: 'Fire Engine',
    police: 'Police Unit',
    heavyRescue: 'Heavy Rescue'
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-elevated)">
          <div className="flex items-center gap-3 text-(--status-critical)">
            <AlertTriangle size={20} />
            <h2 className="text-[14px] font-bold uppercase tracking-wider m-0" style={{ fontFamily: 'var(--font-display)' }}>
              Review Mutual Aid Escalation
            </h2>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full border-none bg-transparent hover:bg-(--bg-input) flex items-center justify-center cursor-pointer transition-colors text-(--text-muted) hover:text-(--text-primary)"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <p className="text-[13px] text-(--text-secondary) m-0">
            A dispatcher has requested to escalate an incident to a mutual aid broadcast. Review the details before issuing the geographic broadcast.
          </p>

          {/* Request Info */}
          <div className="p-4 rounded-xl border border-(--border) bg-(--bg-input)">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-(--text-primary) mb-2 m-0">Requested Parameters</h3>
            <div className="mt-3 text-[12px] text-(--text-secondary) space-y-2">
              <div className="flex justify-between border-b border-(--border-subtle) pb-2">
                <span>Radius:</span>
                <span className="font-bold font-mono text-(--accent)">{requestDetails.radius || 10} km</span>
              </div>
              <div className="flex justify-between border-b border-(--border-subtle) pb-2">
                <span>Priority:</span>
                <span className="font-bold uppercase text-(--status-critical)">{requestDetails.priority || 'Expedited'}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span>Resources:</span>
                <ul className="m-0 pl-4 space-y-1 font-bold text-(--text-primary)">
                  {requestDetails.resources && Object.entries(requestDetails.resources).map(([k, v]) => {
                    if (v > 0) return <li key={k}>{v}x {resourceLabels[k] || k}</li>
                    return null
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--border-subtle) bg-(--bg-elevated) shrink-0 flex gap-3">
          <button
            type="button"
            className="flex-1 py-3 rounded-xl border border-(--border) bg-transparent text-(--text-primary) flex items-center justify-center cursor-pointer transition-colors hover:bg-(--bg-input) font-bold uppercase tracking-wider text-[12px]"
            style={{ fontFamily: 'var(--font-display)' }}
            onClick={onClose}
          >
            Deny
          </button>
          <button
            type="button"
            className="flex-[2] py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] font-bold uppercase tracking-wider text-[12px]"
            style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-display)' }}
            onClick={handleBroadcast}
          >
            <Radio size={16} />
            Approve & Broadcast
          </button>
        </div>

      </div>
    </div>
  )
}
