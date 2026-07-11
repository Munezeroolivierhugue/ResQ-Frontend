import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import {
  AuthTabs,
  AuthField,
  AuthInput,
  PrimaryButton,
} from "../../components/auth/AuthShared";
import { setSession, navigatePortal } from "../../utils/authSession";
import { login } from "../../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(
    () => sessionStorage.getItem("resq-login-email") || "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);

      if (result.mfaRequired) {
        sessionStorage.setItem("resq-login-email", email);
        if (result.challengeToken) {
          sessionStorage.setItem("resq-challenge-token", result.challengeToken);
        }
        navigate("/login/mfa");
        return;
      }

      setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user ?? null,
      });

      const role = result.user?.role;
      if (role) {
        const roleMap = {
          DISPATCHER: "dispatcher",
          FIELD_RESPONDER: "field_responder",
          OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
          OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
          DISTRICT_COMMANDER: "district_commander",
          EMERGENCY_PLANNER: "emergency_planner",
          ANALYST: "analyst",
          SUPER_ADMIN: "super_admin",
        };
        const mapped = roleMap[role] ?? role.toLowerCase();
        navigatePortal(mapped, navigate);
      } else {
        navigate("/login/mfa");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed. Check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout showTabs={<AuthTabs active="login" />}>
      <h1 className="auth-form-title">Command access</h1>
      <p className="auth-form-subtitle">
        Authenticate with your provisioned credentials for the RESQ ecosystem.
      </p>

      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      <form
        onSubmit={handleSubmit}
        className="auth-form-grid"
        autoComplete="on"
      >
        <AuthField label="Professional email" className="auth-field--full">
          <AuthInput
            type="email"
            placeholder="j.doe@agency.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            name="email"
          />
        </AuthField>
        <AuthField label="Access key" className="auth-field--full">
          <div style={{ position: "relative" }}>
            <AuthInput
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "36px" }}
              autoComplete="current-password"
              name="password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </AuthField>

        <div className="auth-field--full flex justify-between items-center text-[12px]">
          <label className="flex items-center gap-2 cursor-pointer text-(--text-secondary)">
            <input type="checkbox" />
            Remember this device
          </label>
          <a href="#" className="auth-recover-link">
            Recover access
          </a>
        </div>

        <div className="auth-field--full">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Authorizing…" : "Authorize terminal"}
          </PrimaryButton>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
