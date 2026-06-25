import signupImage from '../../assets/signup_Image.png'

/**
 * Phone frame wrapper for all FR auth screens.
 * splash=true  → lighter overlay so the photo is more visible (splash screen)
 * splash=false → darker overlay so form content stays readable (login/register/otp/mfa)
 */
export default function FRAuthShell({ children, splash = false }) {
  return (
    <div className="field-responder-page">
      <div className="fr-app field-responder-shell fr-auth-frame">
        {/* Background photo — always shown */}
        <div
          className="fr-auth-bg"
          style={{ '--fr-auth-photo': `url(${signupImage})` }}
        />
        {/* Overlay — lighter on splash, heavier on form screens */}
        <div className={splash ? 'fr-auth-overlay' : 'fr-auth-overlay fr-auth-overlay--form'} />
        {children}
      </div>
    </div>
  )
}
