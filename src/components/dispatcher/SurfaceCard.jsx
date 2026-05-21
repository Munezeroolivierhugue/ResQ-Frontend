export default function SurfaceCard({ children, className = '', padding = 'p-5' }) {
  return (
    <div className={`dispatcher-surface ${padding} ${className}`.trim()}>
      {children}
    </div>
  )
}
