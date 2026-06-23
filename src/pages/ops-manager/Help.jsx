import { useState } from 'react'
import {
  MessageSquare,
  ChevronRight,
  FileText,
  ShieldAlert,
  Map,
  Users,
  Activity,
  AlertTriangle,
  Briefcase,
  Layers,
  BookOpen,
  Info
} from 'lucide-react'

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('getting_started')

  const navItems = [
    { id: 'getting_started', label: 'Getting started', icon: Briefcase },
    { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
    { id: 'resource_mgmt', label: 'Resource Management', icon: Map },
    { id: 'multi_agency', label: 'Multi-Agency Coordination', icon: Layers },
    { id: 'dispatcher_oversight', label: 'Dispatcher Oversight', icon: Users },
    { id: 'performance_slas', label: 'Performance & SLAs', icon: Activity },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
  ]

  const articlesData = {
    getting_started: {
      title: 'Getting started',
      icon: Briefcase,
      desc: 'Learn the basics of the Operations Command Portal.',
      articles: [
        { 
          title: 'Welcome to Operations Command', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>The Operations Command Portal is your high-level overview of district-wide incident management, resource allocation, and dispatcher performance.</p>
              <div className="bg-(--bg-base) p-3 rounded border border-(--border-subtle)">
                <h4 className="font-semibold text-(--text-primary) mb-2">Key Navigational Areas:</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--text-secondary)">
                  <li><strong className="text-(--accent)">Dashboard:</strong> High-level KPIs, SLA compliance rates, and active system alerts.</li>
                  <li><strong className="text-(--accent)">Escalations:</strong> Incidents marked as critical or requested by dispatchers for command intervention.</li>
                  <li><strong className="text-(--accent)">Multi-Agency:</strong> Patching and coordination tools for working with external agencies (e.g., Fire, SWAT, Medical).</li>
                </ul>
              </div>
            </div>
          ) 
        },
        { 
          title: 'Configuring your command view', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>Customize your dashboard to focus on the metrics that matter most to your shift:</p>
              <ol className="list-decimal pl-5 space-y-1 text-(--text-secondary)">
                <li>Click on the <strong>Settings</strong> icon in the sidebar.</li>
                <li>Navigate to the <strong>Notifications</strong> tab to configure when you receive escalation popups.</li>
                <li>Adjust your default map zoom to cover your specific district jurisdiction.</li>
              </ol>
            </div>
          ) 
        }
      ]
    },
    escalations: {
      title: 'Escalations',
      icon: AlertTriangle,
      desc: 'Handling incidents escalated by dispatchers.',
      articles: [
        { title: 'Reviewing an Escalation', content: 'When an incident is escalated (Level 3+), it appears in your Escalations queue. You can view the full timeline, the dispatcher\'s notes, and the current AI recommendations.' },
        { title: 'Authorizing Cross-District Units', content: 'If an escalation requires resources outside the current district, you can authorize mutual aid requests directly from the escalation detail view, overriding standard geofencing limits.' },
        { title: 'Taking Command', content: 'For severe incidents, click "Assume Command." This locks the incident from standard dispatcher modifications and routes all field responder comms directly to the Ops Manager console.' }
      ]
    },
    resource_mgmt: {
      title: 'Resource Management',
      icon: Map,
      desc: 'District-wide unit allocation and mutual aid.',
      articles: [
        { title: 'Monitoring Unit Coverage', content: 'The Resources tab shows real-time heatmaps of unit coverage. Red zones indicate high incident density with low available unit capacity.' },
        { title: 'Approving Reallocation', content: 'The AI may suggest reallocating idle units from quiet districts to hotspots. These recommendations appear in your pending tasks queue for final approval.' }
      ]
    },
    multi_agency: {
      title: 'Multi-Agency Coordination',
      icon: Layers,
      desc: 'Patching external agencies into ongoing incidents.',
      articles: [
        { title: 'Initiating a Multi-Agency Protocol', content: 'From the Multi-Agency tab, you can select active major incidents and invite external liaisons (e.g., Kigali Traffic Police, Central Hospital EMS) to view the incident feed.' },
        { title: 'Radio Patching', content: 'Use the Comms bridge to patch different agency frequencies together temporarily. Ensure you define a clear primary tactical channel before linking.' }
      ]
    },
    dispatcher_oversight: {
      title: 'Dispatcher Oversight',
      icon: Users,
      desc: 'Monitoring and supporting your dispatcher team.',
      articles: [
        { title: 'Workload Monitoring', content: 'The Dispatchers tab displays real-time metrics for all active dispatchers: active incidents managed, time-to-dispatch, and cognitive load warnings.' },
        { title: 'Reviewing AI Overrides', content: 'When a dispatcher overrides the AI Dispatch Engine, it gets logged here. Review these logs weekly to identify if the AI needs retraining or if dispatchers need additional guidance.' }
      ]
    },
    performance_slas: {
      title: 'Performance & Service Level Agreements',
      icon: Activity,
      desc: 'Analyzing response times and system metrics.',
      articles: [
        { title: 'Generating SLA Reports', content: 'Export daily or weekly performance reports covering median response times, dispatch delays, and unit utilization rates. These can be downloaded as PDF or CSV.' },
        { title: 'Shift Audits', content: 'At the end of a command shift, review the aggregated incident data and sign off on the executive summary before handing over to the next Ops Manager.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: MessageSquare,
      desc: 'Quick answers to common questions.',
      articles: [
        { title: 'How do I approve a mutual aid request?', content: 'Mutual aid requests from dispatchers will appear as notifications. Click the notification or go to the Escalations tab, review the required unit type, and click "Authorize" to dispatch units from a neighboring district.' },
        { title: 'Can I force-logout a dispatcher?', content: 'Yes. In the Dispatchers tab, select the dispatcher\'s profile and click "Revoke Session" in case of an emergency or forgotten logout.' },
        { title: 'What happens if the system goes offline?', content: 'In the event of network failure, the portal will switch to Offline Mode, caching local changes. However, cross-district communications will rely on backup radio channels.' }
      ]
    }
  }

  const activeData = articlesData[activeTopic]
  const ActiveIcon = activeData.icon

  return (
    <div className="settings-page portal-page w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Operations Command</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Help Center</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">Help resources for command oversight and escalation management.</p>
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
              Command Manual v2.1
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <ShieldAlert size={16} />
              Protocol Updates
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
              <div className="text-[13px] font-semibold text-(--text-primary)">Still need help?</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Contact IT Systems Administration for terminal issues.</div>
            </div>
            <button className="px-4 py-2 bg-(--accent) text-(--text-on-accent) text-[12px] font-semibold rounded hover:brightness-110 transition-all border-none cursor-pointer">
              Contact IT Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
