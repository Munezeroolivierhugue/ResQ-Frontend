import FieldLabel from '../ui/FieldLabel'

export default function MediaAttachmentGrid({ items }) {
  return (
    <div>
      <FieldLabel className="mb-3">Media attachments</FieldLabel>
      {items.length === 0 ? (
        <p className="text-[12px] text-(--text-muted) m-0">No photos attached.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) =>
            item.image ? (
              <figure key={item.id} className="dispatcher-media-card m-0">
                <img
                  src={item.image}
                  alt={item.label}
                  className="dispatcher-media-thumb"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <figcaption>
                  <div className="text-[11px] font-semibold text-(--accent)">{item.label}</div>
                  <p className="text-[11px] text-(--text-secondary) m-0 mt-0.5">{item.caption}</p>
                </figcaption>
              </figure>
            ) : (
              // Non-image attachment (PDF/document) — no thumbnail to render,
              // previously this component was a decorative placeholder that
              // painted an opaque gradient over the entire card regardless,
              // which is also why real photos never showed through it even
              // once real data was wired in.
              <figure key={item.id} className="dispatcher-media-card m-0">
                <div
                  className="dispatcher-media-thumb"
                  style={{ background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span className="text-[11px] text-(--text-muted)">{item.label || 'File'}</span>
                </div>
                <figcaption>
                  <div className="text-[11px] font-semibold text-(--accent)">{item.label}</div>
                  <p className="text-[11px] text-(--text-secondary) m-0 mt-0.5">{item.caption}</p>
                </figcaption>
              </figure>
            )
          )}
        </div>
      )}
    </div>
  )
}
