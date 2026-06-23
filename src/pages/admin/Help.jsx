import { useState } from 'react'
import {
  MessageSquare,
  ChevronRight,
  FileText,
  ShieldCheck,
  Users,
  Settings,
  Database,
  Cpu,
  Activity,
  BookOpen,
  AlertTriangle
} from 'lucide-react'

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('getting_started')

  const navItems = [
    { id: 'getting_started', label: 'Getting started', icon: Activity },
    { id: 'user_management', label: 'User Management', icon: Users },
    { id: 'integrations', label: 'API Integrations', icon: Database },
    { id: 'ai_config', label: 'Global AI Config', icon: Cpu },
    { id: 'audit_logs', label: 'Audit & Compliance', icon: FileText },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
  ]

  const articlesData = {
    getting_started: {
      title: 'Getting started',
      icon: Activity,
      desc: 'Learn the basics of the Super Admin Portal.',
      articles: [
        { 
          title: 'Welcome to System Administration', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>The Super Admin Portal provides global oversight of the entire RESQ infrastructure, handling everything from user provisioning to core security policies.</p>
              <div className="bg-(--bg-base) p-3 rounded border border-(--border-subtle)">
                <h4 className="font-semibold text-(--text-primary) mb-2">Key Navigational Areas:</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--text-secondary)">
                  <li><strong className="text-(--accent)">Dashboard:</strong> High-level system health metrics, API uptime, and active session counts.</li>
                  <li><strong className="text-(--accent)">User Management:</strong> Role-Based Access Control (RBAC) and onboarding for all portals.</li>
                  <li><strong className="text-(--accent)">Security:</strong> Enforcing SSO (Single Sign-On), MFA policies, and session timeouts.</li>
                </ul>
              </div>
            </div>
          ) 
        },
        { 
          title: 'Handling critical system alerts', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>When the dashboard flags a critical system failure (e.g., database disconnect, API timeout):</p>
              <ol className="list-decimal pl-5 space-y-1 text-(--text-secondary)">
                <li>Check the <strong>Audit Logs</strong> to identify the root cause timestamp.</li>
                <li>Verify external webhook statuses in the <strong>Integrations</strong> panel.</li>
                <li>Use the global broadcast tool in the top navigation to alert logged-in users of temporary degradation.</li>
              </ol>
            </div>
          ) 
        }
      ]
    },
    user_management: {
      title: 'User Management',
      icon: Users,
      desc: 'Provisioning, offboarding, and Role-Based Access Control.',
      articles: [
        { title: 'Inviting New Users', content: 'Navigate to "Users > Invite". Select the user\'s role (e.g., Dispatcher, Ops Manager) and their assigned District. They will receive an automated email with a 24-hour setup link.' },
        { title: 'Managing Permissions', content: 'Permissions are strictly tied to Roles. If a user needs temporary cross-district access, do not change their role. Instead, assign them an "Override Token" valid for a specific timeframe.' }
      ]
    },
    integrations: {
      title: 'API Integrations',
      icon: Database,
      desc: 'Managing external agency connections and webhooks.',
      articles: [
        { title: 'Adding a New Integration', content: 'In the Integrations tab, you can add new REST or GraphQL endpoints for external agencies (e.g., National Weather Service, Traffic Cameras). You must generate an API Key and configure rate limits.' },
        { title: 'Monitoring Webhook Health', content: 'If an integration fails consecutively for 5 minutes, it will be automatically disabled to prevent system slowdowns, and an alert will be logged.' }
      ]
    },
    ai_config: {
      title: 'Global AI Configuration',
      icon: Cpu,
      desc: 'Deploying models and setting safety rails.',
      articles: [
        { title: 'Deploying Analyst Models', content: 'When the Data Analyst team finalizes a new predictive model, it appears here for final Admin approval. Click "Deploy to Production" to push the updated weights to the live Dispatch Engine.' },
        { title: 'Hard Limits and Safety Rails', content: 'You define the absolute boundaries for the AI. For example, setting a rule that "AI cannot dispatch units across district lines without human approval." These rules override any AI model behavior.' }
      ]
    },
    audit_logs: {
      title: 'Audit & Compliance',
      icon: FileText,
      desc: 'Tracking system events and conducting forensic reviews.',
      articles: [
        { title: 'Immutable Audit Trail', content: 'Every action taken by any user in the system (e.g., dispatching a unit, overriding AI, exporting a report) is logged permanently. These logs cannot be deleted, even by Super Admins.' },
        { title: 'Exporting Logs for Compliance', content: 'When required for legal or internal investigations, you can export filtered audit logs (e.g., "All actions by User X on Date Y") as cryptographically signed PDFs.' }
      ]
    },
    security: {
      title: 'Security & Access',
      icon: ShieldCheck,
      desc: 'Managing MFA, SSO, and global security policies.',
      articles: [
        { title: 'Enforcing 2FA', content: 'By default, 2FA is required for Admins, Ops Managers, and Analysts. You can toggle the "Require 2FA for ALL Roles" switch in the Security tab to enforce this globally.' },
        { title: 'Managing Active Sessions', content: 'If a device is lost or compromised, search for the user in the Security tab and click "Revoke All Sessions" to force an immediate system-wide logout for that account.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: MessageSquare,
      desc: 'Quick answers to common questions.',
      articles: [
        { title: 'Can I log in as another user to troubleshoot?', content: 'No, direct impersonation is disabled for security and compliance reasons. However, you can view their exact dashboard state via the "Shadow View" tool in the Users tab.' },
        { title: 'How are database backups handled?', content: 'Database backups are fully automated, occurring every 6 hours for incremental changes and weekly for full snapshots, stored in geographically redundant secure vaults.' },
        { title: 'How do I update the system software?', content: 'Frontend and Backend updates are pushed via CI/CD pipelines managed by the DevOps team. As an Admin, you do not need to manually trigger software updates.' }
      ]
    }
  }

  const activeData = articlesData[activeTopic]
  const ActiveIcon = activeData.icon

  return (
    <div className="settings-page portal-page w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Super Admin</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Help Center</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">Help resources for system health, security, and global configuration.</p>
      </div>

      <div className="settings-page-wrapper settings-layout w-full">
        <nav className="settings-left-nav settings-nav flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeTopic === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTopic(item.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg no-underline whitespace-nowrap text-left text-[13px] font-medium transition-colors shrink-0 border-none cursor-pointer w-full"
                style={{
                  background: active ? 'var(--accent-ghost)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
          
          <div className="mt-8 pt-4 border-t border-(--border-subtle) px-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) mb-3" style={{ fontFamily: 'var(--font-display)' }}>Resources</div>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <BookOpen size={16} />
              Infrastructure Docs
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <AlertTriangle size={16} />
              Disaster Recovery Plan
            </a>
          </div>
        </nav>

        <div className="settings-content-panel settings-section-content w-full min-w-0 flex-1">
          <div className="settings-section-card dispatcher-surface p-5 w-full">
            <div className="flex items-center gap-2 mb-1">
              <ActiveIcon size={16} color="var(--accent)" />
              <span className="text-sm font-bold tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>{activeData.title}</span>
            </div>
            <p className="text-[12px] text-(--text-muted) m-0 mb-6">{activeData.desc}</p>

            <div className="space-y-4">
              {activeData.articles.map((article, idx) => (
                <div key={idx} className="border border-(--border-subtle) bg-(--bg-input) rounded-lg p-4 transition-colors hover:border-(--border)">
                  <h3 className="text-[13.5px] font-semibold text-(--text-primary) mb-2.5">{article.title}</h3>
                  <div className="text-[12.5px] text-(--text-secondary) leading-relaxed">
                    {article.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg flex items-center justify-between border border-(--border-subtle) bg-(--bg-input)">
            <div>
              <div className="text-[13px] font-semibold text-(--text-primary)">Critical system failure?</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Escalate immediately to the Tier 3 DevOps on-call engineer.</div>
            </div>
            <button className="px-4 py-2 bg-(--status-critical) text-white text-[12px] font-semibold rounded hover:brightness-110 transition-all border-none cursor-pointer">
              Page DevOps
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
