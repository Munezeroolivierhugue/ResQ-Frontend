export const mockIncidentClosures = [
  {
    // Database Fields
    closure_id: "cl111111-0000-4000-8000-000000000001",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403
    field_report_id: "fr222222-0000-4000-8000-000000000002",
    closed_by: "u1111111-0000-4000-8000-000000000001", // Jean Bosco
    persons_involved: 50,
    casualties: 0,
    arrests: 2,
    final_disposition: "arrests",
    closure_notes: "Structure fire completely extinguished. Medical standby completed with no transport required. Police secured perimeter and made 2 arrests related to public disturbance.",
    data_source: "dispatcher_portal",
    closed_at: "2026-06-24T14:42:00Z",

    // UI Legacy Compatibility
    caseId: "RW-2940-M",
    incidentId: "INC-2403",
    codename: "Sigma-4",
    status: "Final resolution",
    title: "Structure fire & medical standby — Nyamirambo",
    subtitle: "Finalize the operational report for Incident Sigma-4. Ensure all dispatched units are accounted for before formal closure of the case file."
  }
];
