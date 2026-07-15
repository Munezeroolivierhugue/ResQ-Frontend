import { useEffect, useState } from 'react'
import { MapPin, ArrowRight } from 'lucide-react'
import TriageLocationMap from './TriageLocationMap'
import { listDistricts } from '../../api/districts'

// The "Immediate Dispatch" flow previously never asked the dispatcher for a
// location at all — DispatchImmediate.jsx silently grabbed whichever
// incident happened to be first in the RECEIVED queue (or a hardcoded mock)
// and used ITS coordinates, with no connection to the real emergency the
// dispatcher was reacting to. This step is the fix: capture a real pin +
// district before anything about "nearest units" gets computed, exactly
// like NewIncident.jsx already does for the normal call-intake flow.
export default function DispatchImmediateLocationStep({ selectedType, onConfirm }) {
  const [districts, setDistricts] = useState([])
  const [districtId, setDistrictId] = useState('')
  const [location, setLocation] = useState(null)
  const [streetAddress, setStreetAddress] = useState('')
  const [sector, setSector] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    listDistricts().then(setDistricts).catch(() => {})
  }, [])

  const handleLocationChange = (loc) => {
    setLocation(loc)
    setError(false)
  }

  const handleAddressFound = ({ label, sector: detectedSector }) => {
    if (label !== undefined) setStreetAddress(label)
    if (detectedSector) setSector(detectedSector)
  }

  const handleConfirm = () => {
    if (!districtId) { setError(true); return }
    if (location?.lat == null || location?.lng == null) { setError(true); return }
    onConfirm({
      districtId,
      lat: location.lat,
      lng: location.lng,
      sector,
      address: streetAddress,
    })
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[720px] flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-(--text-primary) m-0 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Where is this happening?
          </h2>
          <p className="text-[14px] text-(--text-secondary) m-0">
            {selectedType?.label ?? 'Immediate dispatch'} · pin the exact location, then confirm district
          </p>
        </div>

        <label className="dispatcher-field m-0">
          <span className="field-label">District *</span>
          <select
            className="dispatcher-input dispatcher-select mt-1"
            value={districtId}
            onChange={(e) => { setDistrictId(e.target.value); setError(false) }}
            style={error && !districtId ? { borderColor: 'var(--status-critical)' } : undefined}
          >
            <option value="" disabled>Select district…</option>
            {districts.map((d) => (
              <option key={d.district_id} value={d.district_id}>{d.name}</option>
            ))}
          </select>
        </label>

        <div className="dispatcher-surface overflow-hidden" style={{ height: 320 }}>
          <TriageLocationMap
            caller={null}
            onLocationChange={handleLocationChange}
            onAddressFound={handleAddressFound}
            districtCenter={(() => {
              const d = districts.find((x) => x.district_id === districtId)
              return d?.lat && d?.lng ? [d.lat, d.lng] : null
            })()}
          />
        </div>

        {streetAddress && (
          <p className="m-0 text-[12px]" style={{ color: 'var(--accent)' }}>
            <MapPin size={12} className="inline mr-1" />
            {streetAddress}
          </p>
        )}

        {error && (
          <p className="m-0 text-[12px]" style={{ color: 'var(--status-critical)' }}>
            Pick a district and pin the location on the map before continuing.
          </p>
        )}

        <button
          type="button"
          className="dispatcher-btn-primary w-full justify-center"
          style={{ height: 52, fontSize: 15 }}
          onClick={handleConfirm}
        >
          Confirm Location <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
