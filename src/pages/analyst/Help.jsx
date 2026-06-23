import { useState } from 'react'
import {
  MessageSquare,
  ChevronRight,
  FileText,
  ShieldAlert,
  BarChart,
  Cpu,
  Database,
  TrendingUp,
  LineChart,
  BookOpen,
  Info
} from 'lucide-react'

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('getting_started')

  const navItems = [
    { id: 'getting_started', label: 'Getting started', icon: BarChart },
    { id: 'custom_reports', label: 'Custom Reports', icon: FileText },
    { id: 'pattern_analysis', label: 'Pattern Analysis', icon: TrendingUp },
    { id: 'ai_models', label: 'AI Model Tuning', icon: Cpu },
    { id: 'data_quality', label: 'Data Quality Check', icon: Database },
    { id: 'benchmarking', label: 'Benchmarking', icon: LineChart },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
  ]

  const articlesData = {
    getting_started: {
      title: 'Getting started',
      icon: BarChart,
      desc: 'Learn the basics of the Data Analyst Portal.',
      articles: [
        { 
          title: 'Welcome to the Analyst Portal', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>The Analyst Portal is the data nervous system of RESQ. Here, you monitor data integrity, uncover hidden incident patterns, and fine-tune the AI models that power dispatch operations.</p>
              <div className="bg-(--bg-base) p-3 rounded border border-(--border-subtle)">
                <h4 className="font-semibold text-(--text-primary) mb-2">Key Navigational Areas:</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--text-secondary)">
                  <li><strong className="text-(--accent)">Data Quality:</strong> Monitor API ingest streams and resolve corrupted incident logs.</li>
                  <li><strong className="text-(--accent)">Pattern Analysis:</strong> Run complex temporal and spatial queries on historical data.</li>
                  <li><strong className="text-(--accent)">AI Models:</strong> Adjust weights and biases for the AI Dispatch Engine and predictive tools.</li>
                </ul>
              </div>
            </div>
          ) 
        },
        { 
          title: 'Configuring your query environment', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>Before running heavy queries, ensure your workspace is configured properly:</p>
              <ol className="list-decimal pl-5 space-y-1 text-(--text-secondary)">
                <li>Click on the <strong>Settings</strong> icon in the sidebar.</li>
                <li>Navigate to the <strong>Data Connections</strong> tab to verify read-replica database status.</li>
                <li>Set your default export formats (CSV, JSON, or Parquet) for large data dumps.</li>
              </ol>
            </div>
          ) 
        }
      ]
    },
    custom_reports: {
      title: 'Custom Reports',
      icon: FileText,
      desc: 'Building, scheduling, and exporting data reports.',
      articles: [
        { title: 'Using the Report Builder', content: 'The Reports tab features a drag-and-drop builder for custom metrics. You can mix real-time dispatcher KPIs with long-term incident trends.' },
        { title: 'Scheduling Automated Exports', content: 'Once a report is built, click "Schedule" to have it automatically emailed to District Commanders or Ops Managers daily, weekly, or monthly.' }
      ]
    },
    pattern_analysis: {
      title: 'Pattern Analysis',
      icon: TrendingUp,
      desc: 'Identifying recurring incident trends.',
      articles: [
        { title: 'Running Temporal Queries', content: 'Use the Pattern Analysis tool to identify time-based clusters. For example, you can query "Traffic Accidents" filtered strictly to "Rainy conditions" between "16:00 and 19:00".' },
        { title: 'Saving Query Templates', content: 'If you build a complex multi-variable query, save it to the Library so other analysts and planners can run it with a single click.' }
      ]
    },
    ai_models: {
      title: 'AI Model Tuning',
      icon: Cpu,
      desc: 'Managing the algorithms that power RESQ.',
      articles: [
        { title: 'Adjusting Dispatch Weights', content: 'In the Models tab, you can adjust how much weight the AI Dispatch Engine gives to "Proximity" vs "Unit Expertise". Changes here require Operations Director approval before going live.' },
        { title: 'Reviewing Override Logs', content: 'Monitor the "Dispatcher Override Rate" dashboard. If dispatchers are frequently overriding the AI in specific sectors, the model parameters for that sector need recalibration.' }
      ]
    },
    data_quality: {
      title: 'Data Quality Check',
      icon: Database,
      desc: 'Monitoring system health and data integrity.',
      articles: [
        { title: 'Resolving Anomalies', content: 'The Data Quality dashboard automatically flags anomalous entries (e.g., response times recorded as negative numbers or GPS coordinates outside the country). You must manually review and quarantine or correct these records.' },
        { title: 'API Feed Health', content: 'Monitor the uptime of external integrations like the Department of Transportation traffic feeds or National Weather Service APIs.' }
      ]
    },
    benchmarking: {
      title: 'Benchmarking',
      icon: LineChart,
      desc: 'Comparing performance against standards.',
      articles: [
        { title: 'National Standard Comparison', content: 'The Benchmarking tab compares current SLA performance against established national emergency response standards.' },
        { title: 'District vs District', content: 'Run internal benchmarks to compare the performance of Kigali Central against Gasabo District to identify which command centers are operating most efficiently.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: MessageSquare,
      desc: 'Quick answers to common questions.',
      articles: [
        { title: 'Can I access the raw SQL database?', content: 'Yes, via the Data Quality tab, you can open the SQL Sandbox to run raw read-only queries against the replica database.' },
        { title: 'What happens if I push a bad AI model update?', content: 'All model updates are subject to an A/B testing phase in "shadow mode" before affecting live dispatch. You can instantly rollback any live model from the version control panel.' },
        { title: 'Are reports cached?', content: 'Yes. To save computing power, standard dashboard reports are cached and refreshed every 15 minutes. Use the "Force Refresh" button for real-time analytics.' }
      ]
    }
  }

  const activeData = articlesData[activeTopic]
  const ActiveIcon = activeData.icon

  return (
    <div className="settings-page portal-page w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Data Analyst</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Help Center</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">Help resources for data analysis, reporting, and model tuning.</p>
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
              Data Schema Docs
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <ShieldAlert size={16} />
              Compliance Standards
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
              <div className="text-[13px] font-semibold text-(--text-primary)">Database connection issues?</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Contact DevOps if the read-replica falls out of sync.</div>
            </div>
            <button className="px-4 py-2 bg-(--accent) text-(--text-on-accent) text-[12px] font-semibold rounded hover:brightness-110 transition-all border-none cursor-pointer">
              Contact DevOps
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
