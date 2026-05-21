import FieldLabel from '../ui/FieldLabel'

export default function MediaAttachmentGrid({ items }) {
  return (
    <div>
      <FieldLabel className="mb-3">Media attachments</FieldLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <figure key={item.id} className="dispatcher-media-card m-0">
            <div
              className="dispatcher-media-thumb"
              style={{
                backgroundImage: `linear-gradient(135deg, var(--bg-elevated), var(--bg-input)), url(${item.image || ''})`,
              }}
              role="img"
              aria-label={item.label}
            />
            <figcaption>
              <div className="text-[11px] font-semibold text-(--accent)">{item.label}</div>
              <p className="text-[11px] text-(--text-secondary) m-0 mt-0.5">{item.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
