// API contract for Service Tickets (Phase 1)
import type { Customer } from '@/types/bms';
import type { ServiceTicket, TicketAttachment } from '@/lib/types/service-tickets';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateServiceTicketInput {
  customer_id: string;
  symptom: string;
  description?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_reg_no?: string | null;
  vehicle_year?: number | null;
}

export interface ListTicketsParams {
  search?: string;
  status?: import('@/lib/types/service-tickets').ServiceTicketStatus;
  from?: string; // ISO date for created_at
  to?: string;   // ISO date for created_at
  limit?: number;
  offset?: number;
}

export interface ServiceTicketsApiContract {
  listCustomers(): Promise<ApiResponse<Customer[]>>;
  listTickets(params?: ListTicketsParams): Promise<ApiResponse<(ServiceTicket & { customer?: Customer })[]>>;
  fetchTicketWithRelations(id: string): Promise<ApiResponse<{ ticket: ServiceTicket & { customer?: Customer }, attachments: TicketAttachment[] }>>;
  createServiceTicket(input: CreateServiceTicketInput): Promise<ApiResponse<ServiceTicket>>;
  listTicketAttachments(ticketId: string): Promise<ApiResponse<TicketAttachment[]>>;
  uploadAttachments(params: {
    ticketId: string;
    files: File[];
    type: 'photo' | 'audio' | 'document';
    onProgress?: (file: File, progress: number) => void;
    caseType?: import('@/lib/types/service-tickets').CaseType;
    caseId?: string;
  }): Promise<ApiResponse<TicketAttachment[]>>;
  listVehicleAttachments(ticketId: string, vehicleCaseId: string): Promise<ApiResponse<TicketAttachment[]>>;
  listBatteryAttachments(ticketId: string, batteryId: string): Promise<ApiResponse<TicketAttachment[]>>;
  deleteTicketAttachment(attachmentId: string): Promise<ApiResponse<boolean>>;
  findTicketByBatteryCaseId(batteryId: string): Promise<ApiResponse<{ id: string; ticket_number: string } | null>>;
  listTicketHistory(ticketId: string): Promise<ApiResponse<import('@/lib/types/service-tickets').ServiceTicketHistory[]>>;
  triageTicket(params: { ticketId: string; routeTo: 'vehicle' | 'battery' | 'both'; note?: string }): Promise<ApiResponse<{ vehicle_case_id?: string; battery_case_id?: string }>>;
  updateTicketStatus(ticketId: string, newStatus: import('@/lib/types/service-tickets').ServiceTicketStatus, note?: string): Promise<ApiResponse<ServiceTicket>>;
}

import { supabaseServiceTicketsRepository } from './service-tickets.supabase';

export const serviceTicketsApi: ServiceTicketsApiContract = supabaseServiceTicketsRepository;
export type { Customer, ServiceTicket, TicketAttachment };
