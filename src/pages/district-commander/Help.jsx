import { useState } from 'react'
import {
  MessageSquare,
  ChevronRight,
  FileText,
  ShieldAlert,
  Map,
  Users,
  Activity,
  Briefcase,
  PieChart,
  BookOpen,
  Info
} from 'lucide-react'

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('getting_started')

  const navItems = [
    { id: 'getting_started', label: 'Getting started', icon: Briefcase },
    { id: 'shift_reports', label: 'Shift Reports', icon: FileText },
    { id: 'unit_management', label: 'Unit Management', icon: Users },
    { id: 'district_coverage', label: 'District Coverage', icon: Map },
    { id: 'resource_allocation', label: 'Resource Allocation', icon: Activity },
    { id: 'executive_reporting', label: 'Executive Reporting', icon: PieChart },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
  ]

  const articlesData = {
    getting_started: {
      title: 'Getting started',
      icon: Briefcase,
      desc: 'Learn the basics of the District Commander Portal.',
      articles: [
        { 
          title: 'Welcome to District Command', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>The District Commander Portal is your dedicated dashboard for managing emergency response infrastructure, personnel, and reporting within your assigned geographical district.</p>
              <div className="bg-(--bg-base) p-3 rounded border border-(--border-subtle)">
                <h4 className="font-semibold text-(--text-primary) mb-2">Key Navigational Areas:</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--text-secondary)">
                  <li><strong className="text-(--accent)">Dashboard:</strong> Live overview of your district's active incidents, available units, and current SLA performance.</li>
                  <li><strong className="text-(--accent)">Shift Reports:</strong> Review and sign off on daily shift handovers from your dispatch team.</li>
                  <li><strong className="text-(--accent)">Coverage:</strong> Monitor real-time response radius maps to ensure no blind spots exist in your district.</li>
                </ul>
              </div>
            </div>
          ) 
        },
        { 
          title: 'Configuring your command view', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>Customize your dashboard to focus on critical district metrics:</p>
              <ol className="list-decimal pl-5 space-y-1 text-(--text-secondary)">
                <li>Click on the <strong>Settings</strong> icon in the sidebar.</li>
                <li>Navigate to the <strong>Notifications</strong> tab to configure alerts for severe incidents or coverage drops in your area.</li>
                <li>Ensure your default map view is centered strictly on your district boundaries.</li>
              </ol>
            </div>
          ) 
        }
      ]
    },
    shift_reports: {
      title: 'Shift Reports',
      icon: FileText,
      desc: 'Reviewing and managing daily shift handovers.',
      articles: [
        { title: 'Approving Handover Reports', content: 'At the end of every 8-hour shift, dispatchers submit handover reports. You are required to review these for unresolved escalations or equipment issues before digitally signing off.' },
        { title: 'Adding Commander Notes', content: 'If a shift report highlights a recurring issue (e.g., radio dead zones), you can append Commander Notes to the file, which will be visible to the incoming shift supervisors.' }
      ]
    },
    unit_management: {
      title: 'Unit Management',
      icon: Users,
      desc: 'Monitoring and managing district personnel and vehicles.',
      articles: [
        { title: 'Unit Status Monitoring', content: 'The Units tab provides a live roster of all personnel logged into the Field Responder app. You can see who is On Scene, En Route, or Available.' },
        { title: 'Taking Units Offline', content: 'If a vehicle requires emergency maintenance, you can manually override its status to "Out of Service," which immediately removes it from the AI Dispatch Engine\'s routing pool.' }
      ]
    },
    district_coverage: {
      title: 'District Coverage',
      icon: Map,
      desc: 'Ensuring adequate geographic response capabilities.',
      articles: [
        { title: 'Analyzing Coverage Gaps', content: 'The Coverage map highlights areas in your district that cannot be reached within the 12-minute SLA by currently available units. These "red zones" require immediate attention.' },
        { title: 'Requesting Mutual Aid', content: 'If your district coverage drops below 70%, the system will prompt you to submit a formal Mutual Aid request to the central Operations Manager to borrow units from neighboring districts.' }
      ]
    },
    resource_allocation: {
      title: 'Resource Allocation',
      icon: Activity,
      desc: 'Managing specialized equipment and district resources.',
      articles: [
        { title: 'Specialized Asset Tracking', content: 'Keep track of scarce district resources such as Hazmat teams, heavy rescue rigs, or K9 units. Ensure their readiness status is always up to date.' },
        { title: 'Resource Requests', content: 'If your district requires permanent new assets due to changing demographics, you can draft a data-backed resource acquisition request directly from this tab.' }
      ]
    },
    executive_reporting: {
      title: 'Executive Reporting',
      icon: PieChart,
      desc: 'Generating high-level district performance reviews.',
      articles: [
        { title: 'Weekly Briefings', content: 'Generate automated weekly briefings that summarize average response times, incident volume by sector, and personnel overtime hours.' },
        { title: 'Exporting Data', content: 'All executive reports can be exported to PDF for printing or CSV for deep-dive analysis in external spreadsheet tools.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: MessageSquare,
      desc: 'Quick answers to common questions.',
      articles: [
        { title: 'Can I view incidents outside my district?', content: 'Yes, but in a "read-only" capacity. You cannot command units outside your assigned geo-fence unless authorized by the Ops Manager.' },
        { title: 'How do I update unit rosters?', content: 'Rosters are managed in the Units tab. You can drag and drop field responders to different vehicles at the start of a shift.' },
        { title: 'What if the AI makes a poor deployment suggestion?', content: 'You have final authority. You can manually adjust standby locations on the map, overriding the AI\'s predictive deployment model.' }
      ]
    }
  }

  const activeData = articlesData[activeTopic]
  const ActiveIcon = activeData.icon

  return (
    <div className="settings-page portal-page w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">District Command</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Help Center</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">Help resources for district oversight, coverage, and unit management.</p>
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
              District Protocols
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <ShieldAlert size={16} />
              Mutual Aid Guidelines
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
              <div className="text-[13px] font-semibold text-(--text-primary)">Need administrative support?</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Contact Operations HQ for district boundary adjustments.</div>
            </div>
            <button className="px-4 py-2 bg-(--accent) text-(--text-on-accent) text-[12px] font-semibold rounded hover:brightness-110 transition-all border-none cursor-pointer">
              Contact Ops HQ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
