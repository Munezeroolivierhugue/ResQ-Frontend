import { useState } from 'react'
import {
  MessageSquare,
  ChevronRight,
  FileText,
  Search,
  BookOpen,
  ShieldAlert,
  Rocket,
  Map,
  Brain,
  Radio,
  AlertTriangle,
  Info
} from 'lucide-react'

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('getting_started')

  const navItems = [
    { id: 'getting_started', label: 'Getting started', icon: Rocket },
    { id: 'live_dispatch_map', label: 'Live Dispatch Map', icon: Map },
    { id: 'ai_recommendations', label: 'AI Recommendations', icon: Brain },
    { id: 'shift_handover', label: 'Shift Handover', icon: FileText },
    { id: 'radio_comms', label: 'Radio & Comms', icon: Radio },
    { id: 'major_incidents', label: 'Major Incidents', icon: AlertTriangle },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
  ]

  const articlesData = {
    getting_started: {
      title: 'Getting started',
      icon: Rocket,
      desc: 'Learn the basics of the Dispatcher Portal.',
      articles: [
        { 
          title: 'Welcome to the Dispatcher Portal', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>The Dispatcher Portal is your central command hub for incident management. It is designed to provide immediate situational awareness and rapid response tools.</p>
              <div className="bg-(--bg-base) p-3 rounded border border-(--border-subtle)">
                <h4 className="font-semibold text-(--text-primary) mb-2">Key Navigational Areas:</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--text-secondary)">
                  <li><strong className="text-(--accent)">Live Dispatch Map:</strong> A real-time geospatial overview of active units, current traffic patterns, and ongoing incidents.</li>
                  <li><strong className="text-(--accent)">Active Incident Queue:</strong> The chronological, triaged list of incoming emergencies waiting for unit assignment.</li>
                  <li><strong className="text-(--accent)">AI Engine:</strong> Intelligent unit recommendations based on proximity, SLA requirements, and unit capabilities.</li>
                </ul>
              </div>
              <p>To begin accepting incidents, please ensure your profile status is set to <strong style={{ color: 'var(--status-low)' }}>Available</strong>.</p>
            </div>
          ) 
        },
        { 
          title: 'Setting up your audio devices', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>Clear communication is critical. Follow these steps to configure your headset for the integrated radio comms system:</p>
              <ol className="list-decimal pl-5 space-y-1 text-(--text-secondary)">
                <li>Click on the <strong>Settings</strong> icon in the sidebar.</li>
                <li>Navigate to the <strong>Audio</strong> tab.</li>
                <li>Under <em>Input Device</em>, select your USB Headset.</li>
                <li>Click <strong>Test Mic</strong> to ensure the volume meter registers your voice.</li>
              </ol>
              <div className="flex items-start gap-2 mt-3 p-2.5 rounded text-(--status-info)" style={{ background: 'var(--status-info-bg)' }}>
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>Always use an approved, noise-canceling headset to prevent background dispatch chatter from bleeding into field responder comms.</span>
              </div>
            </div>
          ) 
        }
      ]
    },
    live_dispatch_map: {
      title: 'Live Dispatch Map',
      icon: Map,
      desc: 'Understand how to use the interactive map.',
      articles: [
        { title: 'Navigating the Interactive Map', content: 'Use the scroll wheel to zoom in and out. Click and drag to pan across different districts. You can also use the zoom controls in the bottom right corner.' },
        { title: 'Using the Lasso Tool', content: 'The lasso tool allows you to draw a custom shape around multiple units to select them simultaneously for mass dispatch. Click the lasso icon on the map toolbar to activate it.' },
        { title: 'Understanding Map Layers', content: 'You can toggle traffic, weather, and active hazard layers from the map controls menu. Traffic layers are updated every 2 minutes from local DOT sources.' }
      ]
    },
    ai_recommendations: {
      title: 'AI Recommendations',
      icon: Brain,
      desc: 'Learn about the AI Dispatch Engine.',
      articles: [
        { title: 'How does the AI choose units?', content: 'The AI evaluates distance, real-time traffic conditions, unit type suitability for the incident, and historical response times to rank the best available units.' },
        { title: 'Overriding AI Suggestions', content: 'If the AI suggestion is inappropriate due to off-system knowledge, click the X icon next to the unit and manually search for an alternative. You will be prompted to log a reason for the override to help train the AI.' }
      ]
    },
    shift_handover: {
      title: 'Shift Handover',
      icon: FileText,
      desc: 'Procedures for ending your shift.',
      articles: [
        { title: 'Generating a handover report', content: 'Navigate to "Shift Handover" in the sidebar. The system auto-compiles your active incidents and unresolved queues. Review the list, add specific watch-outs or notes for the next dispatcher, and click Submit.' }
      ]
    },
    radio_comms: {
      title: 'Radio & Comms',
      icon: Radio,
      desc: 'Managing field communications.',
      articles: [
        { title: 'Patching multi-agency channels', content: 'To patch channels for a multi-agency response, go to the Comms panel, select the primary frequency, and click Link to add secondary frequencies from Police or Medical.' },
        { title: 'Unified Comms Thread', content: 'The Active Incident page now features a Unified Comms thread. You can type messages or use the Push-To-Talk button to send voice memos directly into the chat flow.' }
      ]
    },
    major_incidents: {
      title: 'Major Incidents',
      icon: AlertTriangle,
      desc: 'Protocols for handling severe emergencies.',
      articles: [
        { title: 'Declaring a Major Incident', content: 'Use the red "Declare Major Incident" action. This immediately notifies the Ops Manager, District Commanders, and unlocks cross-district resource allocation.' },
        { title: 'Activating Escalation Protocols', content: 'Once declared, you will have access to the Escalation dashboard to request specialized resources (Hazmat, SWAT) and monitor agency-wide response.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: MessageSquare,
      desc: 'Quick answers to common questions.',
      articles: [
        { title: 'How do I dispatch multiple units to a major incident?', content: 'You can select multiple units from the "Active Incident" panel by using the multi-select checkboxes or the lasso tool on the Live Dispatch Map before clicking "Dispatch".' },
        { title: 'What happens if the AI Dispatch Engine recommends an incorrect unit?', content: 'You always have the final say. You can manually override the AI recommendation by searching for a specific unit in the "Assign Unit" dropdown.' },
        { title: 'How do I review my past dispatched incidents?', content: 'Navigate to the "History" tab in the sidebar. You can filter by date, incident type, or sector to find previous logs.' }
      ]
    }
  }

  const activeData = articlesData[activeTopic]
  const ActiveIcon = activeData.icon

  return (
    <div className="settings-page portal-page w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Dispatcher</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Help Center</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">Help resources for dispatch operations and incident management.</p>
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
              User Manual v4.2
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <ShieldAlert size={16} />
              Release Notes
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
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Our support team is available 24/7 to assist you.</div>
            </div>
            <button className="px-4 py-2 bg-(--accent) text-(--text-on-accent) text-[12px] font-semibold rounded hover:brightness-110 transition-all border-none cursor-pointer">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
