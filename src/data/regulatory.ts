export interface Milestone {
  id: string
  title: string
  authority: string
  due: string
  status: 'Complete' | 'On track' | 'At risk' | 'Not started'
  note: string
}

// All dates and obligations are illustrative for the demo.
export const MILESTONES: Milestone[] = [
  { id: 'R1', title: 'NG9-1-1 interconnect – Ontario PSAPs', authority: 'CRTC', due: '2027-03', status: 'On track', note: '41 of 60 PSAP trunk groups cut over' },
  { id: 'R2', title: 'Rural service notice – Thunder Bay (12 mo)', authority: 'CRTC', due: '2026-12', status: 'At risk', note: 'Filing awaiting approval in queue' },
  { id: 'R3', title: 'Wholesale customer notice – Kingston', authority: 'CRTC / tariff', due: '2027-01', status: 'On track', note: 'Letters drafted by Regulatory Agent' },
  { id: 'R4', title: 'Accessibility (TTY / relay) continuity plan', authority: 'CRTC', due: '2027-02', status: 'On track', note: 'Test plan approved' },
  { id: 'R5', title: 'Quebec – French-language customer notices', authority: 'OQLF / CRTC', due: '2026-11', status: 'Complete', note: 'Bilingual templates published' },
  { id: 'R6', title: 'Legacy 9-1-1 trunk retirement – Prairies', authority: 'CRTC', due: '2027-09', status: 'Not started', note: 'Starts after Wave 2' },
]
