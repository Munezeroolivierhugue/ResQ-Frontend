/** Readable field/column label — regular weight, sentence case, high contrast in light mode. */
export default function FieldLabel({ children, className = '' }) {
  return <div className={['field-label', className].filter(Boolean).join(' ')}>{children}</div>
}
