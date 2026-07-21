import { useEffect } from 'react'
import { useCallChannelStore } from '../../store/callChannelStore'
import { useToastStore } from '../../store/toastStore'

/**
 * No longer renders its own bespoke toast markup — pushes into the shared
 * toast stack (see toastStore.js / ToastStack.jsx) whenever a call-ended
 * payload arrives, then clears it immediately (the shared store owns its
 * own auto-dismiss timing).
 */
export default function CallEndedToast() {
  const { endedCallPayload, clearEndedPayload } = useCallChannelStore()
  const pushToast = useToastStore((s) => s.pushToast)

  useEffect(() => {
    if (!endedCallPayload) return
    pushToast({ variant: 'success', title: 'Call Ended', message: 'Recording attached.' })
    clearEndedPayload()
  }, [endedCallPayload, clearEndedPayload, pushToast])

  return null
}
