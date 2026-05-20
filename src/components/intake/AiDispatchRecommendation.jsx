import { Bot } from 'lucide-react'
import { IntakePanel, PanelHeader, StatusPill } from './IntakeUi'
import FieldLabel from '../ui/FieldLabel'

export default function AiDispatchRecommendation({ data }) {
  return (
    <IntakePanel className="p-4 md:p-5">
      <PanelHeader
        icon={Bot}
        title="AI dispatch recommendation"
        badge={<StatusPill label={`${data.confidence}% confidence`} />}
      />

      <div className="rounded-lg border border-(--border-subtle) bg-(--bg-input) p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FieldLabel>Threat assessment</FieldLabel>
          <StatusPill label={data.threat} color="var(--status-medium)" />
        </div>

        <div>
          <FieldLabel className="mb-1">Detected context</FieldLabel>
          <p className="text-[13px] font-medium text-(--text-primary) m-0">{data.context}</p>
        </div>

        <div>
          <FieldLabel className="mb-1.5">Recommended resources</FieldLabel>
          <ul className="m-0 pl-4 text-[12px] text-(--text-secondary) space-y-0.5">
            {data.resources.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-(--border-subtle)">
          <div>
            <FieldLabel>Est. response</FieldLabel>
            <div className="text-[13px] font-semibold text-(--text-primary)" style={{ fontFamily: 'var(--font-mono)' }}>
              {data.responseTime}
            </div>
          </div>
          <div>
            <FieldLabel>Confidence</FieldLabel>
            <div className="text-[13px] font-semibold text-(--accent)">{data.confidence}%</div>
          </div>
        </div>

        <div>
          <FieldLabel className="mb-1">Reasoning</FieldLabel>
          <p className="text-[12px] text-(--text-secondary) m-0 leading-relaxed italic">
            &ldquo;{data.reasoning}&rdquo;
          </p>
        </div>
      </div>

      <p className="text-[10px] text-(--text-muted) m-0 mt-3 leading-snug">
        AI recommendation only. Dispatcher approval required before unit dispatch.
      </p>
    </IntakePanel>
  )
}
