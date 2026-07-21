import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Cpu, Users, Clock, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { useNotificationsStore } from "../../store/notificationsStore";
import { getCurrentUser } from "../../utils/authSession";
import { isNotificationSoundMuted, setNotificationSoundMuted } from "../../utils/notificationSound";

const ROLE_NOTIF_HREF = {
  DISPATCHER: "/dispatcher/notifications",
  OPERATIONS_MANAGER: "/ops-manager/notifications",
  ADMIN: "/admin/notifications",
  SUPER_ADMIN: "/admin/notifications",
  DISTRICT_COMMANDER: "/district-commander/notifications",
  ANALYST: "/analyst/notifications",
  PLANNER: "/planner/notifications",
  FIELD_RESPONDER: "/field-responder/notifications",
};

const ICONS = {
  critical: AlertTriangle,
  system: Cpu,
  info: Users,
  muted: Clock,
};

// Real elapsed time computed from the notification's own real timestamp —
// same "Xm ago" convention as the reference design, just formatted, not a
// different value.
function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function typeTone(type) {
  if (type === "critical") return { bg: "var(--status-critical-bg)", color: "var(--status-critical)" };
  if (type === "info") return { bg: "var(--status-info-bg)", color: "var(--status-info)" };
  if (type === "system") return { bg: "var(--accent-ghost)", color: "var(--accent)" };
  return { bg: "var(--bg-elevated)", color: "var(--text-muted)" };
}

// Icon-in-circle "avatar" with a small colored badge overlapping its
// bottom-right corner, matching the reference notification-center layout —
// the badge carries the same type color as the circle so it still reads as
// one signal, just echoed in the corner the way a status dot would.
function NotifIcon({ type, actorName, actorPhotoUrl }) {
  const Icon = ICONS[type] || ICONS.muted;
  const tone = typeTone(type);

  // When the notification is about a specific person's action (e.g. a
  // responder submitting a report), show their profile photo/initials as the
  // main avatar instead of a generic icon — the type icon still shows as the
  // small corner badge so the notification's category is still visible.
  const initials = actorName
    ? actorName.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <span className="relative shrink-0" style={{ width: 36, height: 36 }}>
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden text-[13px] font-bold"
        style={{ background: actorName ? "var(--accent-ghost)" : tone.bg, color: actorName ? "var(--accent)" : tone.color }}
      >
        {actorPhotoUrl ? (
          <img src={actorPhotoUrl} alt={actorName} className="w-full h-full object-cover" />
        ) : actorName ? (
          initials
        ) : (
          <Icon size={16} />
        )}
      </span>
      <span
        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2"
        style={{ background: tone.color, borderColor: "var(--bg-surface)" }}
      >
        <Icon size={9} color="#fff" />
      </span>
    </span>
  );
}

export default function NotificationsDropdown({ open, onClose, onToggle }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { items, markAllRead, markRead } = useNotificationsStore();
  const unread = items.filter((n) => !n.read).length;
  const role = getCurrentUser()?.role;
  const viewAllHref = ROLE_NOTIF_HREF[role] ?? "/dispatcher/notifications";
  const [soundMuted, setSoundMuted] = useState(() => isNotificationSoundMuted());

  const toggleSound = (e) => {
    e.stopPropagation();
    setSoundMuted((prev) => {
      const next = !prev;
      setNotificationSoundMuted(next);
      return next;
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative p-1.75 rounded-md bg-transparent border-none cursor-pointer flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-elevated) hover:text-(--text-primary) transition-colors"
        onClick={onToggle}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span
            className="absolute top-0.75 right-0.75 min-w-3.75 h-3.75 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{
              fontFamily: "var(--font-body)",
              background: "var(--status-critical)",
              color: "#ffffff",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown animate-fade-in-up absolute top-[calc(100%+8px)] right-0 w-[380px] max-h-[520px] overflow-y-auto z-[9999] bg-(--bg-surface) border border-(--border) rounded-xl shadow-[var(--shadow-dropdown)] flex flex-col">
          <div className="sticky top-0 z-10 bg-(--bg-surface) px-4 py-3 border-b border-(--border-subtle) flex justify-between items-center">
            <span className="text-[14px] font-semibold text-(--text-primary)">
              Notifications
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title={soundMuted ? "Unmute notification sound" : "Mute notification sound"}
                aria-label={soundMuted ? "Unmute notification sound" : "Mute notification sound"}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--accent) hover:bg-(--bg-elevated) transition-colors"
                onClick={toggleSound}
              >
                {soundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                type="button"
                title="Mark all as read"
                aria-label="Mark all as read"
                className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-(--text-muted) hover:text-(--accent) hover:bg-(--bg-elevated) transition-colors"
                onClick={markAllRead}
                disabled={items.length === 0}
              >
                <CheckCheck size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-(--text-muted)">
                <Bell size={28} className="opacity-30" />
                <p className="text-[13px] font-medium m-0">No notifications</p>
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className="w-full text-left border-none cursor-pointer flex gap-3 items-start px-4 py-3 transition-colors hover:bg-(--bg-elevated)"
                style={{ background: n.read ? "transparent" : "var(--accent-ghost)" }}
                onClick={() => {
                  markRead(n.id);
                  onClose();
                  if (!n.href) return;
                  if (typeof n.href === "string") navigate(n.href);
                  else navigate(n.href.pathname, { state: n.href.state });
                }}
              >
                <NotifIcon type={n.type} actorName={n.actorName} actorPhotoUrl={n.actorPhotoUrl} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-snug text-(--text-primary)">
                    <span className="font-semibold">{n.title}</span>
                    {n.desc && <span className="text-(--text-secondary)"> {n.desc}</span>}
                    {!n.read && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full bg-(--accent) ml-1.5 align-middle"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div
                    className="text-[11px] text-(--text-muted) mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {timeAgo(n.time)}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="sticky bottom-0 bg-(--bg-surface) border-t border-(--border-subtle) px-4 py-2.5 text-center">
            <Link
              to={viewAllHref}
              className="text-[12px] font-medium text-(--accent) no-underline hover:underline"
              onClick={onClose}
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
