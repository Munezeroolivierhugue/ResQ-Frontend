export default function AuthCenterLayout({ children }) {
  return (
    <div className="auth-page auth-page--center auth-page--bare">
      <main className="auth-center-main auth-center-main--bare">{children}</main>
    </div>
  )
}
