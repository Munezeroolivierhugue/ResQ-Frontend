export const mockFieldReports = [
  {
    report_id: "fr111111-0000-4000-8000-000000000001",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403 (Sigma-4)
    vehicle_id: "v4444444-0000-4000-8000-000000000004",  // FTK-02
    responder_id: "u4444444-0000-4000-8000-000000000004",
    persons_involved: 15,
    injuries: true,
    suspects: false,
    scene_status: "active",
    description: "Structure fire active. Establishing containment and evacuation. Hydrant access secured.",
    agencies_involved: "Kigali Fire & Rescue, SAMU",
    case_reference: "RW-2940-M",
    entry_method: "radio",
    submitted_at: "2026-06-24T14:24:00Z"
  },
  {
    report_id: "fr222222-0000-4000-8000-000000000002",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403
    vehicle_id: "v9999999-0000-4000-8000-000000000009",  // POL-12
    responder_id: "u7777777-0000-4000-8000-000000000007",
    persons_involved: 50,
    injuries: false,
    suspects: true,
    scene_status: "secured",
    description: "Crowd perimeter established. Safety perimeter secure. 2 suspects detained for questioning.",
    agencies_involved: "Rwanda National Police",
    case_reference: "RW-2940-M",
    entry_method: "mobile",
    submitted_at: "2026-06-24T14:26:00Z"
  }
];
