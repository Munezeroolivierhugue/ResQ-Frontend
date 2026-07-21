// No photo-upload feature exists anywhere in this system (User has no
// avatar/photo column) — there is no real uploaded photo to prefer. Rather
// than fabricate one, this shows the user's real initials (from their real
// full name) in a colored circle, matching the system's accent palette. If a
// real profile-photo field is ever added to the User entity, this component
// is the single place to make it prefer that real image and fall back to
// initials only when the user hasn't set one.
function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p[0])
  return letters.join('').toUpperCase() || '?'
}

export default function UserAvatar({ name, size = 32 }) {
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        background: 'var(--accent-ghost)',
        color: 'var(--accent)',
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initialsOf(name)}
    </div>
  )
}
