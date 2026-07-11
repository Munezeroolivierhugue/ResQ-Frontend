import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Palette,
  Check,
  Bell,
  ShieldCheck,
  Monitor,
  Smartphone,
  UserCircle,
  Languages,
  Clock,
} from "lucide-react";
import SettingsShiftManagementSection from "./SettingsShiftManagementSection";
import { useThemeStore } from "../../store/themeStore";
import StatusBadge from "../dispatcher/StatusBadge";
import { SettingsToggleRow, SettingsGroup } from "./SettingsToggle";
import SettingsPasswordSection from "./SettingsPasswordSection";
import SettingsProfileSection from "./SettingsProfileSection";
import SettingsNavLayout from "./SettingsNavLayout";
import SettingsToast from "./SettingsToast";
const THEME_OPTIONS = [
  {
    id: "light",
    label: "Light mode",
    description:
      "High-contrast command interface optimized for daylight operations centers.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark mode",
    description:
      "Reduced glare layout for extended night shifts and low-light environments.",
    icon: Moon,
  },
];

const NAV = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "shift", label: "Shift Management", icon: Clock },
  { id: "language", label: "Language", icon: Languages },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export default function OpsManagerSettingsView() {
  const { section: sectionParam } = useParams();
  const section = sectionParam || "profile";
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const [toast, setToast] = useState(false);
  const [language, setLanguage] = useState("en");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [toggles, setToggles] = useState({
    escalationCritical: true,
    aiRecommendations: true,
    dispatcherOverload: true,
    mutualAid: true,
    shiftHandover: true,
    badgeSystem: true,
  });

  const flashToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const setToggle = (key, val) => {
    setToggles((t) => ({ ...t, [key]: val }));
    flashToast();
  };

  return (
    <SettingsNavLayout
      breadcrumbParent="Operations Command"
      portalLabel="Configure your operations command preferences. Changes apply immediately on this terminal."
      basePath="/ops-manager/settings"
      navItems={NAV}
      toast={<SettingsToast show={toast} />}
    >
      {section === "profile" && (
        <SettingsProfileSection
          onUserLoaded={(u) => setMfaEnabled(u.mfa_enabled)}
        />
      )}

      {section === "appearance" && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} color="var(--accent)" />
            <span
              className="text-sm font-bold tracking-[0.04em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              APPEARANCE
            </span>
          </div>
          <p className="text-[12px] text-(--text-muted) m-0 mb-4">
            Select your preferred interface theme for the RESQ portal.
          </p>
          <div className="settings-theme-grid">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    flashToast();
                  }}
                  className={`settings-theme-card${active ? " settings-theme-card--active" : ""}`}
                >
                  <span className="settings-theme-card-icon">
                    <Icon size={22} />
                  </span>
                  <div className="settings-theme-card-body">
                    <div className="settings-theme-card-title">{opt.label}</div>
                    <p className="settings-theme-card-desc">
                      {opt.description}
                    </p>
                  </div>
                  {active && (
                    <span className="settings-theme-card-check">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="settings-theme-status">
            Active theme: <strong>{theme.toUpperCase()}</strong> · Stored
            locally
          </p>
        </div>
      )}

      {section === "notifications" && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2
            className="text-base font-bold m-0 mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Notification Settings
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Alerts for command oversight and escalations.
          </p>
          <SettingsGroup title="Command Alerts">
            <SettingsToggleRow
              label="Critical escalations"
              description="Immediate alert when incidents escalate to command"
              on={toggles.escalationCritical}
              onChange={(v) => setToggle("escalationCritical", v)}
            />
            <SettingsToggleRow
              label="AI reallocation recommendations"
              description="When new AI resource moves are pending approval"
              on={toggles.aiRecommendations}
              onChange={(v) => setToggle("aiRecommendations", v)}
            />
            <SettingsToggleRow
              label="Dispatcher overload warnings"
              description="When a dispatcher exceeds workload thresholds"
              on={toggles.dispatcherOverload}
              onChange={(v) => setToggle("dispatcherOverload", v)}
            />
          </SettingsGroup>
          <SettingsGroup title="Operations">
            <SettingsToggleRow
              label="Mutual aid request updates"
              description="Status changes on cross-district aid requests"
              on={toggles.mutualAid}
              onChange={(v) => setToggle("mutualAid", v)}
            />
            <SettingsToggleRow
              label="Shift handover briefings"
              description="Incoming handover documents from previous shift"
              on={toggles.shiftHandover}
              onChange={(v) => setToggle("shiftHandover", v)}
            />
            <SettingsToggleRow
              label="System messages"
              on={toggles.badgeSystem}
              onChange={(v) => setToggle("badgeSystem", v)}
            />
          </SettingsGroup>
        </div>
      )}

      {section === "shift" && (
        <SettingsShiftManagementSection
          variant="OPERATIONS_MANAGER"
          onSave={flashToast}
        />
      )}

      {section === "language" && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2
            className="text-base font-bold m-0 mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Language
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Select your preferred interface language.
          </p>
          <div className="settings-theme-grid">
            <button
              type="button"
              className="settings-theme-card opacity-80"
              disabled
            >
              <span className="settings-theme-card-icon text-2xl">🇷🇼</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">
                  Kinyarwanda{" "}
                  <span className="text-[10px] text-(--text-muted)">
                    (Coming soon)
                  </span>
                </div>
              </div>
            </button>
            <button
              type="button"
              className={`settings-theme-card${language === "en" ? " settings-theme-card--active" : ""}`}
              onClick={() => {
                setLanguage("en");
                flashToast();
              }}
            >
              <span className="settings-theme-card-icon text-2xl">🇬🇧</span>
              <div className="settings-theme-card-body">
                <div className="settings-theme-card-title">English</div>
              </div>
              {language === "en" && (
                <span className="settings-theme-card-check">
                  <Check size={16} />
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {section === "security" && (
        <div className="settings-section-card dispatcher-surface p-5 w-full">
          <h2
            className="text-base font-bold m-0 mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Security & Access
          </h2>
          <p className="text-[13px] text-(--text-secondary) m-0 mb-4">
            Manage your account security.
          </p>
          <SettingsPasswordSection onSuccess={flashToast} />

          <div
            className="mt-8 text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Active Sessions
          </div>
          {[
            {
              icon: Monitor,
              title: "Windows PC — Chrome",
              sub: "Kigali, Rwanda · Current session",
              badge: "ACTIVE",
              active: true,
            },
            {
              icon: Smartphone,
              title: "Android Mobile — RESQ App",
              sub: "Last active: 2 days ago",
              badge: "INACTIVE",
              active: false,
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="flex items-center gap-3 p-3 rounded-lg border border-(--border) bg-(--bg-input) mb-2"
              >
                <Icon size={20} className="text-(--accent)" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{s.title}</div>
                  <div className="text-[12px] text-(--text-secondary)">
                    {s.sub}
                  </div>
                </div>
                <StatusBadge
                  label={s.badge}
                  variant={s.active ? "resolved" : "info"}
                />
              </div>
            );
          })}

          <div className="mt-8 flex flex-wrap items-center gap-3 p-4 rounded-lg border border-(--border) bg-(--bg-input)">
            <ShieldCheck size={22} color="var(--accent)" />
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold text-[13px]">
                Two-factor authentication
              </div>
              <p className="text-[12px] text-(--text-secondary) m-0 mt-1">
                Required for operations manager terminal access.
              </p>
            </div>
            {mfaEnabled ? (
              <>
                <StatusBadge label="ENABLED" variant="resolved" />
                <button
                  type="button"
                  className="dispatcher-btn-ghost text-[12px]"
                  onClick={() => navigate("/mfa-setup")}
                >
                  Manage 2FA
                </button>
              </>
            ) : (
              <>
                <StatusBadge label="NOT ENABLED" variant="critical" />
                <button
                  type="button"
                  className="dispatcher-btn-outline text-[12px]"
                  onClick={() => navigate("/mfa-setup")}
                >
                  Enable 2FA
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </SettingsNavLayout>
  );
}
