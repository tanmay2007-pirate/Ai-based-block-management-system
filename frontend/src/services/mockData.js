// Fallback authentic Indian Railways operational dataset for standalone / offline frontend preview

export const mockSummary = {
  pendingTasks: 14,
  approvedPlans: 38,
  criticalTasks: 4,
  totalTasks: 56,
  completion_by_department: {
    'Civil Track': 91,
    'Traction / OHE': 88,
    'Signal & Telecom': 94,
    'Rolling Stock': 86
  },
  availability: {
    daily: [
      { date: '2026-08-24', availability_percentage: 95.2 },
      { date: '2026-08-25', availability_percentage: 94.8 },
      { date: '2026-08-26', availability_percentage: 96.1 },
      { date: '2026-08-27', availability_percentage: 95.5 },
      { date: '2026-08-28', availability_percentage: 97.4 },
      { date: '2026-08-29', availability_percentage: 96.9 },
      { date: '2026-08-30', availability_percentage: 97.8 }
    ]
  },
  utilization_by_department: {
    'Civil Engineering (P-Way)': 84,
    'Traction Distribution (TRD)': 78,
    'Signal & Telecom (S&T)': 92,
    'Mechanical / Carriage & Wagon': 72
  }
};

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();

export const mockPlans = [
  {
    id: 'BLK-2026-0891',
    section: 'CSMT - Kalyan Fast Line',
    corridor: 'Central Main Line',
    planned_start: new Date(y, m, d, 1, 30).toISOString(),
    planned_end: new Date(y, m, d, 4, 30).toISOString(),
    status: 'APPROVED',
    trains: [
      {
        task_id: 'TSK-1001',
        task: {
          id: 'TSK-1001',
          department: 'Engineering',
          description: 'Deep screening & ballast regulation on Up Fast Line (KM 32/12 to 34/00)',
          priority_score: 94,
          severity: 'CRITICAL',
          status: 'APPROVED'
        }
      }
    ]
  },
  {
    id: 'BLK-2026-0892',
    section: 'Thane - Diva 5th/6th Line',
    corridor: 'Thane Urban Corridor',
    planned_start: new Date(y, m, d, 2, 0).toISOString(),
    planned_end: new Date(y, m, d, 5, 0).toISOString(),
    status: 'APPROVED',
    trains: [
      {
        task_id: 'TSK-1002',
        task: {
          id: 'TSK-1002',
          department: 'Traction',
          description: 'OHE 25kV Cantilever & Contact Wire Replacement (Substation feed cut)',
          priority_score: 88,
          severity: 'HIGH',
          status: 'APPROVED'
        }
      }
    ]
  },
  {
    id: 'BLK-2026-0893',
    section: 'Kalyan - Karjat Section',
    corridor: 'Southeast Ghat Corridor',
    planned_start: new Date(y, m, d, 11, 0).toISOString(),
    planned_end: new Date(y, m, d, 13, 30).toISOString(),
    status: 'PENDING',
    trains: [
      {
        task_id: 'TSK-1003',
        task: {
          id: 'TSK-1003',
          department: 'Signal',
          description: 'Electronic Interlocking (EI) testing & Axle Counter recalibration',
          priority_score: 82,
          severity: 'HIGH',
          status: 'PENDING'
        }
      }
    ]
  },
  {
    id: 'BLK-2026-0894',
    section: 'Kurla - Panvel Harbour Line',
    corridor: 'Harbour Sub-urban',
    planned_start: new Date(y, m, d, 14, 0).toISOString(),
    planned_end: new Date(y, m, d, 16, 0).toISOString(),
    status: 'PENDING',
    trains: [
      {
        task_id: 'TSK-1004',
        task: {
          id: 'TSK-1004',
          department: 'Engineering',
          description: 'Turnout weld ultrasonic defect detection (USFD testing)',
          priority_score: 65,
          severity: 'MEDIUM',
          status: 'PENDING'
        }
      }
    ]
  },
  {
    id: 'BLK-2026-0895',
    section: 'Dadar - Kurla Slow Line',
    corridor: 'Central Suburban',
    planned_start: new Date(y, m, d, 23, 0).toISOString(),
    planned_end: new Date(y, m, d + 1, 2, 0).toISOString(),
    status: 'APPROVED',
    trains: [
      {
        task_id: 'TSK-1005',
        task: {
          id: 'TSK-1005',
          department: 'Traction',
          description: 'Pantograph clearance verification and dynamic dropper renewal',
          priority_score: 74,
          severity: 'MEDIUM',
          status: 'APPROVED'
        }
      }
    ]
  },
  {
    id: 'BLK-2026-0896',
    section: 'Diva - Panvel Chord',
    corridor: 'Freight Bypass Route',
    planned_start: new Date(y, m, d, 6, 0).toISOString(),
    planned_end: new Date(y, m, d, 9, 0).toISOString(),
    status: 'CONFLICT',
    trains: [
      {
        task_id: 'TSK-1006',
        task: {
          id: 'TSK-1006',
          department: 'Signal',
          description: 'Automatic Signalling Block Overlap track circuit renewal',
          priority_score: 91,
          severity: 'CRITICAL',
          status: 'CONFLICT'
        }
      }
    ]
  }
];

export const mockTasks = [
  {
    id: 'TSK-1001',
    department: 'Engineering',
    priority_score: 94.6,
    severity: 'CRITICAL',
    status: 'APPROVED',
    description: 'Deep screening & ballast regulation on Up Fast Line (KM 32/12 to 34/00)',
    location: 'CSMT - Kalyan Fast Line',
    created_at: new Date(y, m, d - 1).toISOString()
  },
  {
    id: 'TSK-1006',
    department: 'Signal',
    priority_score: 91.2,
    severity: 'CRITICAL',
    status: 'CONFLICT',
    description: 'Automatic Signalling Block Overlap track circuit renewal',
    location: 'Diva - Panvel Freight Chord',
    created_at: new Date(y, m, d - 1).toISOString()
  },
  {
    id: 'TSK-1002',
    department: 'Traction',
    priority_score: 88.0,
    severity: 'HIGH',
    status: 'APPROVED',
    description: 'OHE 25kV Cantilever & Contact Wire Replacement (Substation feed cut)',
    location: 'Thane - Diva 5th/6th Line',
    created_at: new Date(y, m, d - 2).toISOString()
  },
  {
    id: 'TSK-1003',
    department: 'Signal',
    priority_score: 82.5,
    severity: 'HIGH',
    status: 'PENDING',
    description: 'Electronic Interlocking (EI) testing & Axle Counter recalibration',
    location: 'Kalyan - Karjat Section',
    created_at: new Date(y, m, d - 1).toISOString()
  },
  {
    id: 'TSK-1005',
    department: 'Traction',
    priority_score: 74.0,
    severity: 'MEDIUM',
    status: 'APPROVED',
    description: 'Pantograph clearance verification and dynamic dropper renewal',
    location: 'Dadar - Kurla Slow Line',
    created_at: new Date(y, m, d - 3).toISOString()
  },
  {
    id: 'TSK-1004',
    department: 'Engineering',
    priority_score: 65.4,
    severity: 'MEDIUM',
    status: 'PENDING',
    description: 'Turnout weld ultrasonic defect detection (USFD testing)',
    location: 'Kurla - Panvel Harbour Line',
    created_at: new Date(y, m, d - 2).toISOString()
  },
  {
    id: 'TSK-1007',
    department: 'Engineering',
    priority_score: 42.1,
    severity: 'LOW',
    status: 'PENDING',
    description: 'Routine vegetation clearance & cess drain desilting',
    location: 'Kasara Ghat Incline Track',
    created_at: new Date(y, m, d - 4).toISOString()
  },
  {
    id: 'TSK-1008',
    department: 'Traction',
    priority_score: 38.0,
    severity: 'LOW',
    status: 'PENDING',
    description: 'Structure bond visual verification & insulator washing',
    location: 'Vikhroli - Ghatkopar Section',
    created_at: new Date(y, m, d - 4).toISOString()
  }
];

export const mockCorridorTimeline = {
  trains: [
    {
      train_number: '12051 Jan Shatabdi Express',
      departure_time: new Date(y, m, d, 5, 20).toISOString(),
      arrival_time: new Date(y, m, d, 7, 45).toISOString(),
      corridor: 'CSMT-Kalyan'
    },
    {
      train_number: '22221 Vande Bharat Express',
      departure_time: new Date(y, m, d, 6, 10).toISOString(),
      arrival_time: new Date(y, m, d, 8, 25).toISOString(),
      corridor: 'CSMT-Kalyan'
    },
    {
      train_number: '12123 Deccan Queen',
      departure_time: new Date(y, m, d, 17, 10).toISOString(),
      arrival_time: new Date(y, m, d, 19, 30).toISOString(),
      corridor: 'CSMT-Kalyan'
    },
    {
      train_number: '12261 Mumbai Howrah AC Duronto',
      departure_time: new Date(y, m, d, 17, 45).toISOString(),
      arrival_time: new Date(y, m, d, 20, 15).toISOString(),
      corridor: 'CSMT-Kalyan'
    },
    {
      train_number: 'Container Freight 924-UP',
      departure_time: new Date(y, m, d, 9, 30).toISOString(),
      arrival_time: new Date(y, m, d, 12, 10).toISOString(),
      corridor: 'CSMT-Kalyan'
    }
  ],
  blocks: [
    {
      section: 'CSMT - Byculla Up Line Track Relaying',
      planned_start: new Date(y, m, d, 1, 0).toISOString(),
      planned_end: new Date(y, m, d, 4, 30).toISOString(),
      status: 'APPROVED'
    },
    {
      section: 'Thane - Diva 5th/6th Line OHE Cut',
      planned_start: new Date(y, m, d, 2, 0).toISOString(),
      planned_end: new Date(y, m, d, 5, 0).toISOString(),
      status: 'ACTIVE'
    },
    {
      section: 'Kalyan Junction S&T Route Interlock Test',
      planned_start: new Date(y, m, d, 12, 30).toISOString(),
      planned_end: new Date(y, m, d, 15, 0).toISOString(),
      status: 'PLANNED'
    }
  ]
};

export function getMockData(path) {
  if (path.startsWith('/reports/summary')) return mockSummary;
  if (path.startsWith('/blocks')) return { plans: mockPlans };
  if (path.startsWith('/tasks') && !path.includes('/explain')) return { tasks: mockTasks };
  if (path.includes('/explain')) {
    const match = path.match(/\/tasks\/([^/]+)\/explain/);
    const id = match ? match[1] : 'TSK-1001';
    const task = mockTasks.find(t => t.id === id) || mockTasks[0];
    return {
      task,
      priority_score: task.priority_score,
      priorityScore: task.priority_score,
      description: task.description,
      department: task.department,
      location: task.location,
      severity: task.severity
    };
  }
  if (path.includes('/timeline') || path.startsWith('/corridors')) {
    return mockCorridorTimeline;
  }
  return null;
}
