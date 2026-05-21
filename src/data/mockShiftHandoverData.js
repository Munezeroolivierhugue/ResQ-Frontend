/**
 * End-of-shift handover summary — post-shift analysis (replaces shift planner).
 */

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

export const mockShiftHandover = {
  period: 'Operational Period Alpha-9',
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
  incidents: [
    {
      id: 'RSQ-9281-Z',
      type: 'Medical emergency',
      typeIcon: HeartPulse,
      timestamp: '23:14:05',
      location: 'KN 212 St, Kigali',
      outcome: 'Patient stabilized & transferred to CHUK',
      status: 'resolved',
    },
    {
      id: 'RSQ-9274-A',
      type: 'Traffic incident',
      typeIcon: Car,
      timestamp: '22:41:18',
      location: 'KG 11 Ave, Kicukiro',
      outcome: 'Clearance completed, unit released',
      status: 'resolved',
    },
    {
      id: 'RSQ-9289-F',
      type: 'Unauthorized access',
      typeIcon: ShieldAlert,
      timestamp: '02:08:44',
      location: 'Remera sector, Gasabo',
      outcome: 'Override applied — local protocol branch',
      status: 'handover',
    },
    {
      id: 'RSQ-9261-P',
      type: 'Power outage support',
      typeIcon: Zap,
      timestamp: '01:22:11',
      location: 'Nyamirambo, Nyarugenge',
      outcome: 'Utility coordination logged, scene safe',
      status: 'resolved',
    },
  ],
  totalRecords: 42,
}
