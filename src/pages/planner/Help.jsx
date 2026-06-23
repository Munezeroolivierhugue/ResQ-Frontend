import { useState } from 'react'
import {
  MessageSquare,
  ChevronRight,
  FileText,
  ShieldAlert,
  Map,
  BarChart2,
  TrendingUp,
  Cpu,
  Target,
  BookOpen,
  Info
} from 'lucide-react'

export default function Help() {
  const [activeTopic, setActiveTopic] = useState('getting_started')

  const navItems = [
    { id: 'getting_started', label: 'Getting started', icon: Target },
    { id: 'hotspots', label: 'Hotspot Analysis', icon: Map },
    { id: 'coverage', label: 'Coverage & Deployment', icon: BarChart2 },
    { id: 'simulation', label: 'AI Simulation', icon: Cpu },
    { id: 'prediction', label: 'Predictive Modeling', icon: TrendingUp },
    { id: 'reports', label: 'Strategic Reports', icon: FileText },
    { id: 'faqs', label: 'FAQs', icon: MessageSquare },
  ]

  const articlesData = {
    getting_started: {
      title: 'Getting started',
      icon: Target,
      desc: 'Learn the basics of the Emergency Planner Portal.',
      articles: [
        { 
          title: 'Welcome to Emergency Planning', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>The Emergency Planner Portal provides long-term strategic insights, predictive modeling, and simulation tools to help optimize emergency response infrastructure.</p>
              <div className="bg-(--bg-base) p-3 rounded border border-(--border-subtle)">
                <h4 className="font-semibold text-(--text-primary) mb-2">Key Navigational Areas:</h4>
                <ul className="list-disc pl-5 space-y-1 text-(--text-secondary)">
                  <li><strong className="text-(--accent)">Hotspots:</strong> Identify geographical areas with historically high incident volumes.</li>
                  <li><strong className="text-(--accent)">Simulation & Prediction:</strong> Use historical data to run disaster scenarios and forecast future resource demands.</li>
                  <li><strong className="text-(--accent)">Deployment:</strong> Strategize optimal ambulance, fire, and police station placements.</li>
                </ul>
              </div>
            </div>
          ) 
        },
        { 
          title: 'Configuring your data parameters', 
          content: (
            <div className="space-y-3 mt-2 text-[12.5px]">
              <p>To ensure your predictive models are accurate, regularly verify your baseline parameters:</p>
              <ol className="list-decimal pl-5 space-y-1 text-(--text-secondary)">
                <li>Click on the <strong>Settings</strong> icon in the sidebar.</li>
                <li>Navigate to the <strong>Data Feeds</strong> tab to ensure weather and traffic APIs are connected.</li>
                <li>Set your default historical lookback period (e.g., 1 Year, 3 Years).</li>
              </ol>
            </div>
          ) 
        }
      ]
    },
    hotspots: {
      title: 'Hotspot Analysis',
      icon: Map,
      desc: 'Identifying high-risk incident zones.',
      articles: [
        { title: 'Generating Heatmaps', content: 'Use the Hotspots tab to generate incident heatmaps. You can filter the data by incident type (e.g., traffic accidents, medical emergencies) and time of day to uncover hidden patterns.' },
        { title: 'Temporal Layering', content: 'Toggle the "Temporal" switch to animate the heatmap over a 24-hour period. This helps visualize how high-risk zones shift during rush hour versus late night.' }
      ]
    },
    coverage: {
      title: 'Coverage & Deployment',
      icon: BarChart2,
      desc: 'Optimizing station locations and fleet distribution.',
      articles: [
        { title: 'Isochrone Mapping', content: 'The Coverage tab allows you to draw 5-minute and 8-minute drive-time polygons around existing stations, factoring in historical traffic congestion data.' },
        { title: 'Proposed Relocations', content: 'Use the Deployment tool to simulate moving a station or adding a new standby point. The system will automatically calculate the expected impact on city-wide SLA response times.' }
      ]
    },
    simulation: {
      title: 'AI Simulation',
      icon: Cpu,
      desc: 'Running disaster and mass-casualty scenarios.',
      articles: [
        { title: 'Creating a Scenario', content: 'Navigate to Simulation and select a scenario template (e.g., Severe Flooding, Major Highway Pileup). Define the epicenter and casualty estimates.' },
        { title: 'Evaluating Resource Drain', content: 'Run the simulation to see how quickly standard resources are depleted and how long it takes for cross-district mutual aid to backfill the affected zones.' }
      ]
    },
    prediction: {
      title: 'Predictive Modeling',
      icon: TrendingUp,
      desc: 'Forecasting future resource demands.',
      articles: [
        { title: 'Event-Based Forecasting', content: 'Input upcoming major public events (e.g., marathons, national holidays) into the Prediction engine. The AI will forecast expected incident spikes based on similar past events.' },
        { title: 'Seasonal Adjustments', content: 'The predictive models automatically adjust for seasonal factors, such as increased traffic accidents during the rainy season. Ensure the weather integration is active for maximum accuracy.' }
      ]
    },
    reports: {
      title: 'Strategic Reports',
      icon: FileText,
      desc: 'Generating and exporting strategic insights.',
      articles: [
        { title: 'Quarterly Reviews', content: 'Use the Reports tab to generate comprehensive quarterly performance reviews. These reports aggregate thousands of data points into a high-level executive summary suitable for city councils.' },
        { title: 'Export Formats', content: 'Strategic reports can be exported as interactive web links, raw CSV datasets, or formatted PDFs. Charts and heatmaps are automatically embedded in PDF exports.' }
      ]
    },
    faqs: {
      title: 'Frequently Asked Questions',
      icon: MessageSquare,
      desc: 'Quick answers to common questions.',
      articles: [
        { title: 'How accurate are the predictive models?', content: 'Predictions are based on a 95% confidence interval using historical data. Accuracy is highly dependent on continuous data ingestion from the dispatch systems.' },
        { title: 'Can I import external demographic data?', content: 'Yes, in the Settings > Data Feeds section, you can upload external CSV/GeoJSON files containing population density or upcoming infrastructure changes to factor into your coverage maps.' },
        { title: 'Are simulations visible to Dispatchers?', content: 'No, all simulations run in an isolated "sandbox" environment and do not affect live dispatch operations or Ops Manager dashboards.' }
      ]
    }
  }

  const activeData = articlesData[activeTopic]
  const ActiveIcon = activeData.icon

  return (
    <div className="settings-page portal-page w-full">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[12px] text-(--text-muted)">Emergency Planner</span>
          <ChevronRight size={12} className="text-(--text-muted)" />
          <span className="text-[12px] text-(--text-secondary)">Help Center</span>
        </div>
        <h1 className="text-[26px] font-bold m-0 tracking-[0.04em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-[13px] text-(--text-secondary) mt-2 m-0">Help resources for strategic planning, simulation, and predictive modeling.</p>
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
              AI Model Documentation
            </a>
            <a href="#" className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors no-underline">
              <ShieldAlert size={16} />
              Data Privacy Guidelines
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
              <div className="text-[13px] font-semibold text-(--text-primary)">Need advanced analysis support?</div>
              <div className="text-[12px] text-(--text-secondary) mt-0.5">Contact the data engineering team for custom SQL queries.</div>
            </div>
            <button className="px-4 py-2 bg-(--accent) text-(--text-on-accent) text-[12px] font-semibold rounded hover:brightness-110 transition-all border-none cursor-pointer">
              Contact Data Team
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
