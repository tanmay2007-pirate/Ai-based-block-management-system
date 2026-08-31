export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  last_login_at?: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Asset {
  id: string;
  asset_code: string;
  asset_type: string;
  name: string;
  location_km?: number;
  zone?: string;
  division?: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  asset_specification?: string;
  condition_score?: number;
  criticality?: string;
  department?: string;
  design_life_years?: number;
  gauge?: string;
  installation_date?: string;
  last_inspection_date?: string;
  last_major_maintenance_date?: string;
  manufacturer?: string;
  replacement_cost_estimate?: number;
  section?: string;
  station_location?: string;
  total_past_defects?: number;
  total_past_failures?: number;
  traffic_level?: number;
}

export interface MaintenanceTask {
  id: string;
  source_system: string;
  source_id: string;
  task_type: string;
  priority_score: number;
  severity: string;
  description?: string;
  location?: string;
  department: string;
  asset_id?: string;
  estimated_hours: number;
  status: string;
  is_deleted: boolean;
  ai_score_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  history?: MaintenanceHistory[];
  block_plan_items?: BlockPlanTrain[];
}

export interface MaintenanceHistory {
  id: string;
  task_id?: string;
  action?: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
  actual_repair_duration_min?: number;
  asset_id?: string;
  completed_date?: string;
  cost_incurred?: number;
  crew_size_used?: number;
  days_to_failure?: number;
  delay_reason?: string;
  did_fail_within_30_days?: boolean;
  division?: string;
  duration_variance_min?: number;
  estimated_duration_min?: number;
  remarks?: string;
  was_delayed?: boolean;
  weather_condition?: string;
}

export interface BlockPlan {
  id: string;
  block_demand_id?: string;
  week_start: string;
  week_end: string;
  section: string;
  from_km: number;
  to_km: number;
  planned_start: string;
  planned_end: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  conflict_flags?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  trains?: BlockPlanTrain[];
  block_demand?: BlockDemand;
  conflicts?: Conflict[];
}

export interface BlockPlanTrain {
  id: string;
  block_plan_id: string;
  task_id?: string;
  train_number?: string;
  impact_type?: string;
  notes?: string;
  created_at: string;
  block_plan?: BlockPlan;
  task?: MaintenanceTask;
}

export interface BlockDemand {
  id: string;
  section: string;
  from_km: number;
  to_km: number;
  demanded_by: string;
  demanded_for: string;
  duration_hours: number;
  reason?: string;
  status: string;
  created_at: string;
  updated_at: string;
  block_plans?: BlockPlan[];
}

export interface Conflict {
  id: string;
  block_plan_id: string;
  conflict_type: string;
  description: string;
  severity: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  block_plan?: BlockPlan;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}