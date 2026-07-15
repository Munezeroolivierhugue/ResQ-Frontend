function Row({ label, value }) {
  return (
    <div className="text-(--text-secondary)">
      {label}: <strong className="text-(--text-primary)">{value}</strong>
    </div>
  )
}

// Read-only, one-field-per-line rendering of a dispatcher's closure record —
// shared by every screen that reviews it, matching FieldReportCard's layout.
export default function ClosureRecordCard({ closure }) {
  if (!closure) {
    return <p className="text-[13px] text-(--text-muted) m-0">No closure record found for this incident yet.</p>
  }
  return (
    <div className="flex flex-col gap-1.5 text-[13px]">
      <Row label="Closed by" value={closure.closed_by ?? '—'} />
      {closure.closed_at && <Row label="on" value={new Date(closure.closed_at).toLocaleString()} />}
      <Row label="Persons involved" value={closure.persons_involved ?? '—'} />
      <Row label="Casualties" value={closure.casualties ?? 0} />
      <Row label="Arrests" value={closure.arrests ?? 0} />
      <Row label="Final disposition" value={closure.final_disposition ?? '—'} />
      {closure.closure_notes && (
        <div className="text-(--text-secondary)">
          notes: <span className="text-(--text-primary)">{closure.closure_notes}</span>
        </div>
      )}
    </div>
  )
}
