// BMS (Battery Management System) Types
// Based on the E-Wheels Battery Status data structure

export enum BatteryStatus {
  RECEIVED = 'received',
  DIAGNOSED = 'diagnosed', 
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum BatteryType {
  LITHIUM_ION = 'li-ion',
  LFP = 'lfp',
  NMC = 'nmc',
  OTHER = 'other'
}

export enum CellType {
  CYLINDRICAL_18650 = '18650',
  CYLINDRICAL_21700 = '21700',
  PRISMATIC = 'prismatic',
  POUCH = 'pouch'
}

export enum RepairType {
  CELL_REPLACEMENT = 'cell_replacement',
  BMS_REPLACEMENT = 'bms_replacement', 
  CELL_BALANCING = 'cell_balancing',
  FULL_RECONDITIONING = 'full_reconditioning',
  BATTERY_PACK_REPLACEMENT = 'battery_pack_replacement',
  DIAGNOSTIC_ONLY = 'diagnostic_only'
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface BatteryRecord {
  id: string;
  
  // Basic Battery Information
  serial_number: string;
  brand: string; // E-Wheels, TVS, PURE, Okinawa, etc.
  model?: string;
  battery_type: BatteryType;
  voltage: number; // 48V, 60V, 72V, etc.
  capacity: number; // Ah rating
  cell_type: CellType;
  cell_count?: number;
  
  // Customer Information
  customer_id: string;
  customer?: Customer;
  
  // Service Information
  received_date: string;
  delivered_date?: string;
  status: BatteryStatus;
  
  // Technical Diagnostics
  initial_voltage?: number;
  load_test_result?: number; // Percentage efficiency
  ir_values?: number[]; // Internal resistance values
  cell_voltages?: number[];
  bms_status: 'ok' | 'faulty' | 'replaced' | 'unknown';
  
  // Repair Details
  repair_type?: RepairType;
  cells_replaced?: number;
  rows_replaced?: number;
  repair_notes: string;
  technician_notes?: string;
  
  // Pricing
  estimated_cost?: number;
  final_cost?: number;
  parts_cost?: number;
  labor_cost?: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface BatteryStatusHistory {
  id: string;
  battery_id: string;
  previous_status: BatteryStatus;
  new_status: BatteryStatus;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export interface RepairEstimate {
  id: string;
  battery_id: string;
  repair_type: RepairType;
  estimated_cost: number;
  parts_needed: string[];
  labor_hours: number;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface TechnicalDiagnostics {
  id: string;
  battery_id: string;
  
  // Cell Analysis
  total_cells: number;
  healthy_cells: number;
  weak_cells: number;
  dead_cells: number;
  cells_above_threshold: number; // Cells with high IR
  ir_threshold: number; // ohm threshold
  
  // Performance Metrics  
  current_capacity: number; // Measured Ah
  capacity_retention: number; // Percentage of original
  load_test_current: number; // Test current in A
  load_test_duration: number; // Test duration in minutes
  efficiency_rating: number; // Overall efficiency %
  
  // BMS Diagnostics
  bms_firmware_version?: string;
  bms_error_codes?: string[];
  balancing_status: 'required' | 'completed' | 'not_needed';
  
  // Environmental
  test_temperature: number;
  humidity?: number;
  
  // Timestamps
  diagnosed_at: string;
  diagnosed_by: string;
}

// Filter and Search Types
export interface BatteryFilters {
  status?: BatteryStatus[];
  battery_type?: BatteryType[];
  brand?: string[];
  voltage?: number[];
  date_range?: {
    start: string;
    end: string;
  };
  customer_search?: string;
  serial_search?: string;
}

export interface BatterySortOptions {
  field: 'received_date' | 'status' | 'brand' | 'voltage' | 'customer_name' | 'estimated_cost';
  direction: 'asc' | 'desc';
}

// Dashboard Analytics Types
export interface BMSAnalytics {
  total_batteries: number;
  batteries_by_status: Record<BatteryStatus, number>;
  average_repair_time: number; // days
  completion_rate: number; // percentage
  revenue_this_month: number;
  pending_deliveries: number;
  overdue_batteries: number;
  
  // Charts data
  monthly_revenue: Array<{ month: string; revenue: number }>;
  repair_type_distribution: Array<{ type: RepairType; count: number }>;
  brand_distribution: Array<{ brand: string; count: number }>;
}

// Form Types for UI Components
export interface BatteryFormData {
  serial_number: string;
  brand: string;
  model?: string;
  battery_type: BatteryType;
  voltage: number;
  capacity: number;
  cell_type: CellType;
  customer_id: string;
  repair_notes: string;
  estimated_cost?: number;
}

export interface DiagnosticsFormData {
  total_cells: number;
  healthy_cells: number;
  weak_cells: number;
  dead_cells: number;
  ir_threshold: number;
  current_capacity: number;
  load_test_current: number;
  load_test_duration: number;
  efficiency_rating: number;
  bms_error_codes: string;
  balancing_status: 'required' | 'completed' | 'not_needed';
  test_temperature: number;
}
