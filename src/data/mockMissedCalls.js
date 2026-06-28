// TODO: backend gap — GET /api/missed-calls exists but creation is via Africa's Talking webhook only.
// PATCH /api/missed-calls/{id}/callback exists. Implement missed calls UI when telephony is integrated.
export const mockMissedCalls = [
  {
    // Database Fields
    missed_call_id: "mc111111-0000-4000-8000-000000000001",
    phone_number: "+250788123421",
    call_time: "2026-06-24T14:18:00Z",
    wait_duration: 102, // 1m 42s
    last_dispatcher: "u1111111-0000-4000-8000-000000000001",
    cascade_count: 1,
    status: "pending",
    called_back_by: null,
    callback_time: null,

    // UI Legacy Compatibility
    id: "MC-01",
    phoneMasked: "+250 78x xxx x21",
    calledAt: "14:18",
    waited: "1m 42s"
  },
  {
    // Database Fields
    missed_call_id: "mc222222-0000-4000-8000-000000000002",
    phone_number: "+250722333408",
    call_time: "2026-06-24T14:09:00Z",
    wait_duration: 58, // 0m 58s
    last_dispatcher: "u1111111-0000-4000-8000-000000000001",
    cascade_count: 0,
    status: "pending",
    called_back_by: null,
    callback_time: null,

    // UI Legacy Compatibility
    id: "MC-02",
    phoneMasked: "+250 72x xxx x08",
    calledAt: "14:09",
    waited: "0m 58s"
  },
  {
    // Database Fields
    missed_call_id: "mc333333-0000-4000-8000-000000000003",
    phone_number: "+250733444555",
    call_time: "2026-06-24T13:52:00Z",
    wait_duration: 135, // 2m 15s
    last_dispatcher: "u2222222-0000-4000-8000-000000000002",
    cascade_count: 2,
    status: "pending",
    called_back_by: null,
    callback_time: null,

    // UI Legacy Compatibility
    id: "MC-03",
    phoneMasked: "+250 73x xxx x55",
    calledAt: "13:52",
    waited: "2m 15s"
  }
];
