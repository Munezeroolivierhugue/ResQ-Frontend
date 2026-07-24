import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Map,
  ShieldAlert,
  Car,
  Radio,
  Clock,
  BookOpen
} from 'lucide-react'

export default function Help() {
  const [openSection, setOpenSection] = useState(null)

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id)
  }

  const helpTopics = [
    {
      id: 'assignment',
      title: 'Assignments & Dispatch',
      icon: Radio,
      faqs: [
        { q: 'How do I accept an assignment?', a: 'When you receive a new dispatch ping, open the app. The active assignment will appear with a 30-second timer. Click the large green "Accept" button to automatically status yourself as En Route.' },
        { q: 'What if I am out of my vehicle?', a: 'If you miss the 30-second acceptance window, the AI Dispatch Engine will automatically re-route the assignment to the next closest available unit.' }
      ]
    },
    {
      id: 'navigation',
      title: 'Navigation & GPS',
      icon: Map,
      faqs: [
        { q: 'Why is my GPS inaccurate?', a: 'Ensure you have enabled "Always Allow" for Location Services in your phone settings. Tunnels and heavy cloud cover can occasionally degrade GPS accuracy.' },
        { q: 'Can I choose my own route?', a: 'The app provides the fastest route based on live traffic data. If you know a faster local shortcut, you may take it. The app will automatically recalculate.' }
      ]
    },
    {
      id: 'on_scene',
      title: 'On Scene Protocol',
      icon: ShieldAlert,
      faqs: [
        { q: 'When do I click "Arrived"?', a: 'Click the "Arrived On Scene" button the moment your vehicle comes to a complete stop at the incident location. This accurately stops the SLA response timer.' },
        { q: 'How do I request backup?', a: 'While On Scene, use the "Request Backup" quick-action button. The system will immediately notify the Dispatcher and Ops Manager of your escalation.' }
      ]
    },
    {
      id: 'reports',
      title: 'Field Reports',
      icon: FileText,
      faqs: [
        { q: 'When is a report required?', a: 'A digital field report must be submitted before you can clear an incident and return to "Available" status. You cannot take new assignments while a report is pending.' },
        { q: 'Can I use voice-to-text?', a: 'Yes! Tap the microphone icon in any text field within the Field Report to use secure voice dictation.' }
      ]
    },
    {
      id: 'vehicle',
      title: 'Unit & Vehicle',
      icon: Car,
      faqs: [
        { q: 'How do I change my assigned unit?', a: 'Unit assignments are handled by the Ops Manager at the start of your shift. If you are in the wrong vehicle, contact Command to update the roster.' },
        { q: 'My vehicle needs maintenance.', a: 'Immediately notify Dispatch via the Comms tab, then set your status to "Off Duty" to remove yourself from the active dispatch pool.' }
      ]
    },
    {
      id: 'shifts',
      title: 'Shifts & Performance',
      icon: Clock,
      faqs: [
        { q: 'What are my SLA targets?', a: 'The primary target is a 12-minute or less response time from dispatch acceptance to arriving on scene.' },
        { q: 'How do I end my shift?', a: 'Navigate to your Profile tab, click "End Shift", complete your final handover notes, and await the District Commander\'s digital sign-off.' }
      ]
    }
  ]

  return (
    <div className="fr-page fr-page--settings pb-24">
      <Link to="/field-responder/profile" className="fr-settings-back">
        <ChevronLeft size={18} />
        Back to Profile
      </Link>
      <h2 className="fr-settings-heading">Help Center</h2>
      
      <p className="text-[13px] text-(--text-secondary) m-0 mb-6 px-4">
        Find quick answers to common field app questions or review operational protocols.
      </p>

      <div className="px-4 space-y-3">
        {helpTopics.map((topic) => {
          const Icon = topic.icon
          const isOpen = openSection === topic.id

          return (
            <div key={topic.id} className="dispatcher-surface fr-card p-0 overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 border-none bg-transparent cursor-pointer text-left"
                onClick={() => toggleSection(topic.id)}
              >
                <Icon size={20} className={isOpen ? 'text-(--accent)' : 'text-(--text-muted)'} />
                <span className={`flex-1 font-semibold text-[14px] ${isOpen ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>
                  {topic.title}
                </span>
                {isOpen ? (
                  <ChevronUp size={18} className="text-(--text-muted)" />
                ) : (
                  <ChevronDown size={18} className="text-(--text-muted)" />
                )}
              </button>
              
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-(--border-subtle) bg-(--bg-input)">
                  <div className="space-y-4 mt-3">
                    {topic.faqs.map((faq, idx) => (
                      <div key={idx}>
                        <h4 className="text-[13px] font-bold text-(--text-primary) m-0 mb-1">{faq.q}</h4>
                        <p className="text-[12px] text-(--text-secondary) m-0 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="mt-8 dispatcher-surface fr-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-(--text-primary)">Critical Issue?</div>
            <div className="text-[12px] text-(--text-secondary) mt-0.5">Contact IT Support directly.</div>
          </div>
          <button className="px-4 py-2 bg-(--status-critical) text-white text-[12px] font-bold rounded hover:brightness-110 transition-all border-none cursor-pointer">
            Call IT
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-(--border-subtle) flex flex-col gap-2">
           <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <BookOpen size={16} />
              Read Full Field Manual
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <MessageSquare size={16} />
              Submit App Feedback
            </a>
        </div>
      </div>
    </div>
  )
}
