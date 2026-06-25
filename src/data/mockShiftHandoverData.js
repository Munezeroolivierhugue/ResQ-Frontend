import {
  AlertTriangle,
  Clock,
  HelpCircle,
  BarChart3,
  HeartPulse,
  Car,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { mockShiftHandoverIncidents } from './mockIncidents'

const TYPE_ICONS = {
  'Medical emergency': HeartPulse,
  'Traffic incident': Car,
  'Unauthorized access': ShieldAlert,
  'Power outage support': Zap,
}

export const mockShiftHandover = {
  period: 'Operational Period',
  generatedAt: 'October 24, 2025 at 08:00 AM',
  dispatcher: { name: 'Jean Bosco Nkurunziza', id: 'RESQ-OP-042', verified: true },
  metrics: [
    {
      id: 'incidents',
      label: 'Incidents handled',
      value: '42',
      hint: '+12% vs average',
      hintTone: 'positive',
      icon: AlertTriangle,
    },
    {
      id: 'dispatch',
      label: 'Avg dispatch time',
      value: '45s',
      hint: '-6s efficiency gain',
      hintTone: 'positive',
      icon: Clock,
    },
    {
      id: 'override',
      label: 'AI override rate',
      value: '4%',
      hint: 'Low human-centric flow',
      hintTone: 'warning',
      icon: HelpCircle,
    },
    {
      id: 'peak',
      label: 'Shift volume peak',
      value: '02:30 AM',
      hint: 'Night-window surge',
      hintTone: 'neutral',
      icon: BarChart3,
    },
  ],
  peakBars: [20, 35, 28, 55, 40, 90, 70, 45],
  incidents: mockShiftHandoverIncidents.map(inc => ({
    ...inc,
    typeIcon: TYPE_ICONS[inc.type] || HelpCircle
  })),
  totalRecords: 42,
}
