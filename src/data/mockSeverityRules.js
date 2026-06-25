export const mockSeverityRules = [
  // RTA Rules
  {
    rule_id: "sr111111-0000-4000-8000-000000000001",
    incident_type: "RTA",
    rule_order: 1,
    condition_json: {
      or: [
        { field: "Q_RTA_01", equals: "Yes - severe" },
        { field: "Q_RTA_02", equals: "Yes" }
      ]
    },
    severity: "critical",
    active: true
  },
  {
    rule_id: "sr111112-0000-4000-8000-000000000002",
    incident_type: "RTA",
    rule_order: 2,
    condition_json: {
      field: "Q_RTA_01",
      equals: "Yes - minor"
    },
    severity: "high",
    active: true
  },
  {
    rule_id: "sr111113-0000-4000-8000-000000000003",
    incident_type: "RTA",
    rule_order: 3,
    condition_json: {}, // Fallback
    severity: "medium",
    active: true
  },

  // MEDICAL Rules
  {
    rule_id: "sr222221-0000-4000-8000-000000000001",
    incident_type: "MEDICAL",
    rule_order: 1,
    condition_json: {
      or: [
        { field: "Q_MED_01", equals: "No" },
        { field: "Q_MED_02", equals: "No" }
      ]
    },
    severity: "critical",
    active: true
  },
  {
    rule_id: "sr222222-0000-4000-8000-000000000002",
    incident_type: "MEDICAL",
    rule_order: 2,
    condition_json: {
      field: "Q_MED_02",
      equals: "Difficulty Breathing"
    },
    severity: "high",
    active: true
  },
  {
    rule_id: "sr222223-0000-4000-8000-000000000003",
    incident_type: "MEDICAL",
    rule_order: 3,
    condition_json: {},
    severity: "medium",
    active: true
  },

  // FIRE Rules
  {
    rule_id: "sr333331-0000-4000-8000-000000000001",
    incident_type: "FIRE",
    rule_order: 1,
    condition_json: {
      field: "Q_FIR_01",
      equals: "Yes"
    },
    severity: "critical",
    active: true
  },
  {
    rule_id: "sr333332-0000-4000-8000-000000000002",
    incident_type: "FIRE",
    rule_order: 2,
    condition_json: {
      field: "Q_FIR_02",
      equals: "Yes"
    },
    severity: "high",
    active: true
  },
  {
    rule_id: "sr333333-0000-4000-8000-000000000003",
    incident_type: "FIRE",
    rule_order: 3,
    condition_json: {},
    severity: "medium",
    active: true
  },

  // SECURITY Rules
  {
    rule_id: "sr444441-0000-4000-8000-000000000001",
    incident_type: "SECURITY",
    rule_order: 1,
    condition_json: {
      field: "Q_SEC_01",
      equals: "Yes - firearm"
    },
    severity: "critical",
    active: true
  },
  {
    rule_id: "sr444442-0000-4000-8000-000000000002",
    incident_type: "SECURITY",
    rule_order: 2,
    condition_json: {
      or: [
        { field: "Q_SEC_01", equals: "Yes - knife/other" },
        { field: "Q_SEC_02", equals: "Yes" }
      ]
    },
    severity: "high",
    active: true
  },
  {
    rule_id: "sr444443-0000-4000-8000-000000000003",
    incident_type: "SECURITY",
    rule_order: 3,
    condition_json: {},
    severity: "medium",
    active: true
  }
];
