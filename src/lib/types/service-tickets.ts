// Service Tickets domain types for app-side usage (Phase 0)

export type ServiceTicketStatus =
  | 'reported'
  | 'triaged'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'closed'
  | 'cancelled'
  | 'on_hold'
  | 'waiting_approval';

export type VehicleStatus =
  | 'received'
  | 'diagnosed'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'on_hold';

export type AttachmentType = 'photo' | 'audio' | 'document';
export type CaseType = 'battery' | 'vehicle';

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  customer_id: string;
  symptom: string;
  description?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_reg_no?: string | null;
  vehicle_year?: number | null;
  status: ServiceTicketStatus;
  priority: number | null;
  battery_case_id?: string | null;
  vehicle_case_id?: string | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  created_by: string;
  updated_by: string;
  triaged_at?: string | null;
  triaged_by?: string | null;
  triage_notes?: string | null;
  due_date?: string | null;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  case_type?: CaseType | null;
  case_id?: string | null;
  file_name: string;
  original_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  attachment_type: AttachmentType;
  thumbnail_path?: string | null;
  duration?: number | null;
  uploaded_by: string;
  uploaded_at: string;
  source: string;
  uploader_fingerprint?: string | null;
  processed: boolean;
  processing_error?: string | null;
}

export interface ServiceTicketHistory {
  id: string;
  ticket_id: string;
  action: string;
  previous_values?: any | null;
  new_values?: any | null;
  changed_by: string;
  changed_at: string;
  notes?: string | null;
}

export interface VehicleCase {
  id: string;
  service_ticket_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_reg_no: string;
  vehicle_year?: number | null;
  vin_number?: string | null;
  customer_id: string;
  received_date: string;
  delivered_date?: string | null;
  status: VehicleStatus;
  initial_diagnosis?: string | null;
  symptoms_observed?: string | null;
  diagnostic_notes?: string | null;
  repair_notes?: string | null;
  technician_notes?: string | null;
  parts_required?: string[] | null;
  parts_cost?: number | null;
  labor_hours?: number | null;
  labor_cost?: number | null;
  estimated_cost?: number | null;
  final_cost?: number | null;
  assigned_technician?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface VehicleStatusHistory {
  id: string;
  vehicle_case_id: string;
  previous_status?: VehicleStatus | null;
  new_status: VehicleStatus;
  changed_by: string;
  changed_at: string;
  notes?: string | null;
}

