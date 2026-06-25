export const mockTriageQuestions = [
  // RTA (Road Traffic Accident) Questions
  {
    question_id: "q1111111-0000-4000-8000-000000000001",
    incident_type: "RTA",
    question_code: "Q_RTA_01",
    question_text: "Are there visible injuries?",
    answer_options: ["Yes - severe", "Yes - minor", "No", "Unknown"],
    display_order: 1
  },
  {
    question_id: "q2222222-0000-4000-8000-000000000002",
    incident_type: "RTA",
    question_code: "Q_RTA_02",
    question_text: "Are people trapped in the vehicle?",
    answer_options: ["Yes", "No", "Unknown"],
    display_order: 2
  },

  // MEDICAL Questions
  {
    question_id: "q3333333-0000-4000-8000-000000000003",
    incident_type: "MEDICAL",
    question_code: "Q_MED_01",
    question_text: "Is the patient conscious?",
    answer_options: ["Yes", "No", "Altered State", "Unknown"],
    display_order: 1
  },
  {
    question_id: "q4444444-0000-4000-8000-000000000004",
    incident_type: "MEDICAL",
    question_code: "Q_MED_02",
    question_text: "Is the patient breathing normally?",
    answer_options: ["Yes", "No", "Difficulty Breathing", "Unknown"],
    display_order: 2
  },

  // FIRE Questions
  {
    question_id: "q5555555-0000-4000-8000-000000000005",
    incident_type: "FIRE",
    question_code: "Q_FIR_01",
    question_text: "Is the fire in an occupied structure?",
    answer_options: ["Yes", "No", "Unknown"],
    display_order: 1
  },
  {
    question_id: "q6666666-0000-4000-8000-000000000006",
    incident_type: "FIRE",
    question_code: "Q_FIR_02",
    question_text: "Are hazardous materials involved?",
    answer_options: ["Yes", "No", "Unknown"],
    display_order: 2
  },

  // SECURITY Questions
  {
    question_id: "q7777777-0000-4000-8000-000000000007",
    incident_type: "SECURITY",
    question_code: "Q_SEC_01",
    question_text: "Are weapons involved?",
    answer_options: ["Yes - firearm", "Yes - knife/other", "No", "Unknown"],
    display_order: 1
  },
  {
    question_id: "q8888888-0000-4000-8000-000000000008",
    incident_type: "SECURITY",
    question_code: "Q_SEC_02",
    question_text: "Is the suspect still at the scene?",
    answer_options: ["Yes", "No", "Unknown"],
    display_order: 2
  }
];
