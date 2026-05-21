import FieldLabel from '../ui/FieldLabel'

const STATUS_CLASS = {
  ready: 'dispatcher-unit-status--ready',
  pending: 'dispatcher-unit-status--pending',
}

export default function UnitClearanceList({ units, onToggle }) {
  const inService = units.filter((u) => !u.cleared).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <FieldLabel className="mb-0">Unit clearance</FieldLabel>
        <span className="dispatcher-count-badge">{inService} in service</span>
      </div>
      <ul className="list-none m-0 p-0 space-y-2">
        {units.map((unit) => (
          <li key={unit.id}>
            <label className="dispatcher-unit-row">
              <input
                type="checkbox"
                className="dispatcher-unit-check"
                checked={unit.cleared}
                onChange={() => onToggle(unit.id)}
              />
              <span className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-(--text-primary)">
                  {unit.id}
                  <span className="text-(--text-muted) font-normal"> ({unit.role})</span>
                </span>
                <span className={`dispatcher-unit-status ${STATUS_CLASS[unit.statusTone] || ''}`}>
                  {unit.status}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
