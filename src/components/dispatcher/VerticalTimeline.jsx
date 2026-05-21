export default function VerticalTimeline({ events, elapsed }) {
  return (
    <div>
      {elapsed && (
        <div className="text-[12px] font-semibold text-(--status-medium) mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          Total elapsed: {elapsed}
        </div>
      )}
      <ul className="dispatcher-timeline list-none m-0 p-0">
        {events.map((ev, i) => (
          <li key={ev.id || i} className="dispatcher-timeline-item">
            <span
              className="dispatcher-timeline-dot"
              style={{
                background: ev.active ? 'var(--status-medium)' : 'var(--border)',
                boxShadow: ev.active ? '0 0 0 3px var(--status-medium-bg)' : 'none',
              }}
            />
            <div>
              <div className="text-[12px] font-semibold text-(--text-primary)">
                <span className="text-(--text-muted) mr-2" style={{ fontFamily: 'var(--font-mono)' }}>{ev.time}</span>
                {ev.title}
              </div>
              {ev.description && (
                <p className="text-[12px] text-(--text-secondary) m-0 mt-0.5 leading-relaxed">{ev.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
