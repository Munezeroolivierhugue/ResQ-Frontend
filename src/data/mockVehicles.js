export const mockVehicles = [
  {
    // Database Fields
    vehicle_id: "v1111111-0000-4000-8000-000000000001",
    plate_number: "RNP 807A",
    vehicle_type: "Ambulance",
    agency_id: "ag111111-0000-4000-8000-000000000001",
    station_id: "st111111-0000-4000-8000-000000000001",
    district_id: "d1111111-0000-4000-8000-000000000001", // Gasabo
    status: "deployed",
    capability: "Advanced Life Support, Trauma Kit",
    current_lat: -1.9355,
    current_lng: 30.1044,
    online: true,
    last_sync: "2026-06-24T15:58:00Z",

    // Legacy Aliases for UI Compatibility
    id: "AMB-07",
    type: "Ambulance",
    location: "Remera",
    assignment: "i1111111-0000-4000-8000-000000000001", // INC-2401 UUID
    lat: -1.9355,
    lng: 30.1044
  },
  {
    vehicle_id: "v2222222-0000-4000-8000-000000000002",
    plate_number: "RNP 803B",
    vehicle_type: "Ambulance",
    agency_id: "ag111111-0000-4000-8000-000000000001",
    station_id: "st222222-0000-4000-8000-000000000002",
    district_id: "d5555555-0000-4000-8000-000000000005", // Huye
    status: "deployed",
    capability: "Basic Life Support",
    current_lat: -2.5967,
    current_lng: 29.7394,
    online: true,
    last_sync: "2026-06-24T15:57:00Z",

    id: "AMB-03",
    type: "Ambulance",
    location: "Ngoma",
    assignment: "i5555555-0000-4000-8000-000000000005", // INC-2405 UUID
    lat: -2.5967,
    lng: 29.7394
  },
  {
    vehicle_id: "v3333333-0000-4000-8000-000000000003",
    plate_number: "RNP 811C",
    vehicle_type: "Ambulance",
    agency_id: "ag111111-0000-4000-8000-000000000001",
    station_id: "st333333-0000-4000-8000-000000000003",
    district_id: "d8888888-0000-4000-8000-000000000008", // Nyagatare
    status: "available",
    capability: "Basic Life Support, Oxygen",
    current_lat: -1.2994,
    current_lng: 30.3244,
    online: true,
    last_sync: "2026-06-24T15:59:00Z",

    id: "AMB-11",
    type: "Ambulance",
    location: "Nyagatare",
    assignment: null,
    lat: -1.2994,
    lng: 30.3244
  },
  {
    vehicle_id: "v4444444-0000-4000-8000-000000000004",
    plate_number: "RNP 202F",
    vehicle_type: "Fire Truck",
    agency_id: "ag222222-0000-4000-8000-000000000002",
    station_id: "st444444-0000-4000-8000-000000000004",
    district_id: "d3333333-0000-4000-8000-000000000003", // Nyarugenge
    status: "deployed",
    capability: "Water Tank 5000L, Foam Extinguisher",
    current_lat: -1.9659,
    current_lng: 30.0444,
    online: true,
    last_sync: "2026-06-24T15:55:00Z",

    id: "FTK-02",
    type: "Fire Truck",
    location: "Nyamirambo",
    assignment: "i3333333-0000-4000-8000-000000000003", // INC-2403 UUID
    lat: -1.9659,
    lng: 30.0444
  },
  {
    vehicle_id: "v5555555-0000-4000-8000-000000000005",
    plate_number: "RNP 205F",
    vehicle_type: "Fire Truck",
    agency_id: "ag222222-0000-4000-8000-000000000002",
    station_id: "st555555-0000-4000-8000-000000000005",
    district_id: "d1111111-0000-4000-8000-000000000001", // Gasabo
    status: "available",
    capability: "Water Tank 4000L",
    current_lat: -1.9355,
    current_lng: 30.0944,
    online: true,
    last_sync: "2026-06-24T15:56:00Z",

    id: "FTK-05",
    type: "Fire Truck",
    location: "Kacyiru",
    assignment: null,
    lat: -1.9355,
    lng: 30.0944
  },
  {
    vehicle_id: "v6666666-0000-4000-8000-000000000006",
    plate_number: "RNP 707P",
    vehicle_type: "Police Van",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st555555-0000-4000-8000-000000000005",
    district_id: "d1111111-0000-4000-8000-000000000001", // Gasabo
    status: "available",
    capability: "Tactical Response, 6 Seats",
    current_lat: -1.9486,
    current_lng: 30.0986,
    online: true,
    last_sync: "2026-06-24T15:54:00Z",

    id: "P-07",
    type: "Police Van",
    location: "Kacyiru",
    assignment: null,
    lat: -1.9486,
    lng: 30.0986
  },
  {
    vehicle_id: "v7777777-0000-4000-8000-000000000007",
    plate_number: "RNP 703P",
    vehicle_type: "Police Van",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st666666-0000-4000-8000-000000000006",
    district_id: "d1111111-0000-4000-8000-000000000001", // Gasabo
    status: "available",
    capability: "Patrol, 4 Seats",
    current_lat: -1.9355,
    current_lng: 30.0944,
    online: true,
    last_sync: "2026-06-24T15:58:00Z",

    id: "P-03",
    type: "Police Van",
    location: "Gasabo HQ",
    assignment: null,
    lat: -1.9355,
    lng: 30.0944
  },
  {
    vehicle_id: "v8888888-0000-4000-8000-000000000008",
    plate_number: "RNP 719P",
    vehicle_type: "Police Van",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st666666-0000-4000-8000-000000000006",
    district_id: "d1111111-0000-4000-8000-000000000001", // Gasabo
    status: "available",
    capability: "Patrol, 4 Seats",
    current_lat: -1.928,
    current_lng: 30.102,
    online: true,
    last_sync: "2026-06-24T15:59:00Z",

    id: "P-19",
    type: "Police Van",
    location: "Gasabo",
    assignment: null,
    lat: -1.928,
    lng: 30.102
  },
  {
    vehicle_id: "v9999999-0000-4000-8000-000000000009",
    plate_number: "RNP 512P",
    vehicle_type: "Police",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st777777-0000-4000-8000-000000000007",
    district_id: "d4444444-0000-4000-8000-000000000004", // Musanze
    status: "available",
    capability: "Crowd Control, Traffic Control",
    current_lat: -1.4994,
    current_lng: 29.6340,
    online: true,
    last_sync: "2026-06-24T15:57:00Z",

    id: "POL-12",
    type: "Police",
    location: "Muhoza",
    assignment: null,
    lat: -1.4994,
    lng: 29.6340
  },
  {
    vehicle_id: "vaaaaaaa-0000-4000-8000-00000000000a",
    plate_number: "RNP 508P",
    vehicle_type: "Police",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st888888-0000-4000-8000-000000000008",
    district_id: "d6666666-0000-4000-8000-000000000006", // Rubavu
    status: "idle",
    capability: "Patrol, Investigation Support",
    current_lat: -1.6977,
    current_lng: 29.2567,
    online: true,
    last_sync: "2026-06-24T15:55:00Z",

    id: "POL-08",
    type: "Police",
    location: "Gisenyi",
    assignment: null,
    lat: -1.6977,
    lng: 29.2567
  },
  {
    vehicle_id: "vbbbbbbb-0000-4000-8000-00000000000b",
    plate_number: "RNP 901D",
    vehicle_type: "Disaster",
    agency_id: "ag444444-0000-4000-8000-000000000004",
    station_id: "st888888-0000-4000-8000-000000000008",
    district_id: "d6666666-0000-4000-8000-000000000006", // Rubavu
    status: "deployed",
    capability: "Rescue Gear, Flood Control",
    current_lat: -1.6977,
    current_lng: 29.2567,
    online: true,
    last_sync: "2026-06-24T15:58:00Z",

    id: "DST-01",
    type: "Disaster",
    location: "Gisenyi",
    assignment: "i6666666-0000-4000-8000-000000000006", // INC-2406 UUID
    lat: -1.6977,
    lng: 29.2567
  },
  {
    vehicle_id: "vccccccc-0000-4000-8000-00000000000c",
    plate_number: "RNP 815A",
    vehicle_type: "Ambulance",
    agency_id: "ag111111-0000-4000-8000-000000000001",
    station_id: "st222222-0000-4000-8000-000000000002",
    district_id: "d5555555-0000-4000-8000-000000000005", // Huye
    status: "offline",
    capability: "Basic Life Support",
    current_lat: -2.5967,
    current_lng: 29.7394,
    online: false,
    last_sync: "2026-06-24T12:00:00Z",

    id: "AMB-15",
    type: "Ambulance",
    location: "Huye",
    assignment: null,
    lat: -2.5967,
    lng: 29.7394
  },
  {
    vehicle_id: "v1414141-0000-4000-8000-000000000014",
    plate_number: "RNP 914A",
    vehicle_type: "Tactical",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st555555-0000-4000-8000-000000000005",
    district_id: "d3333333-0000-4000-8000-000000000003", // Nyarugenge
    status: "deployed",
    capability: "Tactical Entry Gear",
    current_lat: -1.9659,
    current_lng: 30.0444,
    online: true,
    last_sync: "2026-06-24T15:58:00Z",

    id: "T-14",
    type: "Tactical",
    location: "Nyamirambo",
    assignment: "i3333333-0000-4000-8000-000000000003",
    lat: -1.9659,
    lng: 30.0444
  },
  {
    vehicle_id: "v2222222-0000-4000-8000-000000000022",
    plate_number: "RNP 922A",
    vehicle_type: "Intercept",
    agency_id: "ag333333-0000-4000-8000-000000000003",
    station_id: "st555555-0000-4000-8000-000000000005",
    district_id: "d3333333-0000-4000-8000-000000000003", // Nyarugenge
    status: "deployed",
    capability: "High Speed Intercept",
    current_lat: -1.9659,
    current_lng: 30.0444,
    online: true,
    last_sync: "2026-06-24T15:58:00Z",

    id: "T-22",
    type: "Intercept",
    location: "Nyamirambo",
    assignment: "i3333333-0000-4000-8000-000000000003",
    lat: -1.9659,
    lng: 30.0444
  },
  {
    vehicle_id: "v0909090-0000-4000-8000-000000000009",
    plate_number: "RNP 809A",
    vehicle_type: "Ambulance",
    agency_id: "ag111111-0000-4000-8000-000000000001",
    station_id: "st222222-0000-4000-8000-000000000002",
    district_id: "d3333333-0000-4000-8000-000000000003", // Nyarugenge
    status: "deployed",
    capability: "Advanced Life Support",
    current_lat: -1.9659,
    current_lng: 30.0444,
    online: true,
    last_sync: "2026-06-24T15:58:00Z",

    id: "M-09",
    type: "Ambulance",
    location: "Nyamirambo",
    assignment: "i3333333-0000-4000-8000-000000000003",
    lat: -1.9659,
    lng: 30.0444
  }
];

export const mockUnits = mockVehicles;
