import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export default function LocateCall() {
  const { callId } = useParams()
  const [status, setStatus] = useState('idle') // idle | requesting | sent | error

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`${BASE_URL}/webhook/location/${callId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          })
          if (!res.ok) throw new Error('Request failed')
          setStatus('sent')
        } catch {
          setStatus('error')
        }
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0b1220',
      color: '#fff',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 360, width: '100%' }}>
        {status === 'sent' ? (
          <>
            <CheckCircle2 size={56} color="#22c55e" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Location sent</h1>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>
              Dispatchers can now see your exact location. Stay on the line if your call is still active.
            </p>
          </>
        ) : (
          <>
            <MapPin size={56} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>RESQ Emergency</h1>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
              Share your exact location so responders can find you faster.
            </p>
            <button
              onClick={shareLocation}
              disabled={status === 'requesting'}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 10,
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: status === 'requesting' ? 'default' : 'pointer',
                opacity: status === 'requesting' ? 0.7 : 1,
              }}
            >
              {status === 'requesting' ? 'Getting your location…' : 'Share my location'}
            </button>
            {status === 'error' && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', color: '#f87171', fontSize: 13, marginTop: 16 }}>
                <AlertTriangle size={16} /> Couldn't get your location. Check that location access is allowed, then try again.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
