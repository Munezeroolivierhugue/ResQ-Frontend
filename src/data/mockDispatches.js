export const mockDispatches = [
  {
    dispatch_id: "e1111111-0000-4000-8000-000000000001",
    incident_id: "i1111111-0000-4000-8000-000000000001", // INC-2401
    vehicle_id: "v1111111-0000-4000-8000-000000000001",  // AMB-07
    responder_id: "u4444444-0000-4000-8000-000000000004", // Field Responder
    dispatched_by: "u1111111-0000-4000-8000-000000000001", // Jean Bosco
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 91.5,
    eta_minutes: 8,
    is_immediate: false,
    route: "KN 3 Rd to Remera Sector",
    created_at: "2026-06-24T14:34:00Z"
  },
  {
    dispatch_id: "e2222222-0000-4000-8000-000000000002",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403
    vehicle_id: "v4444444-0000-4000-8000-000000000004",  // FTK-02
    responder_id: "u5555555-0000-4000-8000-000000000005",
    dispatched_by: "u1111111-0000-4000-8000-000000000001",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 95.0,
    eta_minutes: 5,
    is_immediate: false,
    route: "KN 2 Ave to Nyamirambo Sector",
    created_at: "2026-06-24T14:16:00Z"
  },
  {
    dispatch_id: "e3333333-0000-4000-8000-000000000003",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403
    vehicle_id: "v5555555-0000-4000-8000-000000000005",  // FTK-05
    responder_id: "u6666666-0000-4000-8000-000000000006",
    dispatched_by: "u1111111-0000-4000-8000-000000000001",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 89.0,
    eta_minutes: 7,
    is_immediate: false,
    route: "KN 4 Ave to Nyamirambo Sector",
    created_at: "2026-06-24T14:18:00Z"
  },
  {
    dispatch_id: "e4444444-0000-4000-8000-000000000004",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403
    vehicle_id: "v1111111-0000-4000-8000-000000000001",  // AMB-07
    responder_id: "u4444444-0000-4000-8000-000000000004",
    dispatched_by: "u1111111-0000-4000-8000-000000000001",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 88.0,
    eta_minutes: 6,
    is_immediate: false,
    route: "KN 3 Rd to Nyamirambo Sector",
    created_at: "2026-06-24T14:17:00Z"
  },
  {
    dispatch_id: "e5555555-0000-4000-8000-000000000005",
    incident_id: "i3333333-0000-4000-8000-000000000003", // INC-2403
    vehicle_id: "v9999999-0000-4000-8000-000000000009",  // POL-12
    responder_id: "u7777777-0000-4000-8000-000000000007",
    dispatched_by: "u1111111-0000-4000-8000-000000000001",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 94.0,
    eta_minutes: 4,
    is_immediate: false,
    route: "KN 1 Rd to Nyamirambo Sector",
    created_at: "2026-06-24T14:16:00Z"
  },
  {
    dispatch_id: "e6666666-0000-4000-8000-000000000006",
    incident_id: "i5555555-0000-4000-8000-000000000005", // INC-2405
    vehicle_id: "v2222222-0000-4000-8000-000000000002",  // AMB-03
    responder_id: "u8888888-0000-4000-8000-000000000008",
    dispatched_by: "u2222222-0000-4000-8000-000000000002",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 92.5,
    eta_minutes: 10,
    is_immediate: false,
    route: "Huye Main Rd",
    created_at: "2026-06-24T13:57:00Z"
  },
  {
    dispatch_id: "e7777777-0000-4000-8000-000000000007",
    incident_id: "i6666666-0000-4000-8000-000000000006", // INC-2406
    vehicle_id: "vbbbbbbb-0000-4000-8000-00000000000b",  // DST-01
    responder_id: "u9999999-0000-4000-8000-000000000009",
    dispatched_by: "u2222222-0000-4000-8000-000000000002",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 85.0,
    eta_minutes: 15,
    is_immediate: false,
    route: "Gisenyi Lake Shore Rd",
    created_at: "2026-06-24T13:23:00Z"
  },
  {
    dispatch_id: "e8888888-0000-4000-8000-000000000008",
    incident_id: "i8888888-0000-4000-8000-000000000008", // INC-2408
    vehicle_id: "v3333333-0000-4000-8000-000000000003",  // AMB-11
    responder_id: "uaaaaaaa-0000-4000-8000-00000000000a",
    dispatched_by: "u1111111-0000-4000-8000-000000000001",
    ai_recommended: true,
    overridden: false,
    override_reason: null,
    confidence: 90.0,
    eta_minutes: 12,
    is_immediate: false,
    route: "Nyagatare-Rwamagana Rd",
    created_at: "2026-06-24T14:12:00Z"
  }
];
