import { supabase } from '@/lib/supabase/client';
import type { ApiResponse } from './service-tickets';
import type {
  ServiceTicket,
  TicketAttachment
} from '@/lib/types/service-tickets';
import type { Customer } from '@/types/bms';
import { scopeQuery, withLocationId } from '@/lib/location/scope';
import { isCurrentUserAdmin, getCurrentUserRole } from '@/lib/location/admin-check';

export class SupabaseServiceTicketsRepository {
  async listCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const isAdmin = await isCurrentUserAdmin();
      const role = await getCurrentUserRole();
      const isFrontDesk = role === 'front_desk_manager';
      let query = supabase
        .from('customers')
        .select('id, name, contact, location_id, created_at, updated_at')
        .order('name', { ascending: true }) as any;
      query = scopeQuery('customers', query, { isAdmin, isFrontDesk }).limit(200);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error listing customers:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to list customers'
      };
    }
  }

  async listTickets(
    params: {
      search?: string;
      status?: ServiceTicket['status'];
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApiResponse<(ServiceTicket & { customer?: Customer })[]>> {
    try {
      const isAdmin = await isCurrentUserAdmin();
      const role = await getCurrentUserRole();
      const isFrontDesk = role === 'front_desk_manager';
      let query = supabase
        .from('service_tickets')
        .select('*, customer:customers(*), location:locations(id,name,code)')
        .order('created_at', { ascending: false }) as any;
      query = scopeQuery('service_tickets', query, { isAdmin, isFrontDesk });

      if (params.status) query = query.eq('status', params.status);
      if (params.from) query = query.gte('created_at', params.from);
      if (params.to) query = query.lte('created_at', params.to);
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        // search by ticket_number, vehicle_reg_no; customer name via join
        query = query.or(
          `ticket_number.ilike.${term},vehicle_reg_no.ilike.${term}`
        );
      }
      if (params.limit) query = query.limit(params.limit);
      if (params.offset)
        query = query.range(
          params.offset,
          params.offset + (params.limit || 50) - 1
        );

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: (data || []) as any };
    } catch (error) {
      console.error('Error listing tickets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tickets'
      };
    }
  }

  async fetchTicketWithRelations(
    id: string
  ): Promise<
    ApiResponse<{
      ticket: ServiceTicket & { customer?: Customer };
      attachments: TicketAttachment[];
    }>
  > {
    try {
      const [
        { data: ticket, error: tErr },
        { data: attachments, error: aErr }
      ] = await Promise.all([
        supabase
          .from('service_tickets')
          .select('*, customer:customers(*)')
          .eq('id', id)
          .single(),
        supabase
          .from('ticket_attachments')
          .select('*')
          .eq('ticket_id', id)
          .order('uploaded_at', { ascending: false })
      ]);
      if (tErr) throw tErr;
      if (aErr) throw aErr;
      return {
        success: true,
        data: { ticket: ticket as any, attachments: (attachments || []) as any }
      };
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ticket'
      };
    }
  }

  async listTicketAttachments(
    ticketId: string
  ): Promise<ApiResponse<TicketAttachment[]>> {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: (data || []) as any };
    } catch (error) {
      console.error('Error listing attachments:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to list attachments'
      };
    }
  }

  async createServiceTicket(input: {
    customer_id: string;
    symptom: string;
    description?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_reg_no?: string | null;
    vehicle_year?: number | null;
  }): Promise<ApiResponse<ServiceTicket>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        return { success: false, error: 'Not authenticated' };
      }

      // Fallback local ticket number in case DB trigger is not installed
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}${mm}${dd}`;
      const seq = Math.floor(Math.random() * 900) + 100; // 3-digit
      const fallbackTicketNumber = `T-${todayStr}-${seq}`;

      const payloadBase: any = {
        ticket_number: fallbackTicketNumber,
        customer_id: input.customer_id,
        symptom: input.symptom,
        description: input.description ?? null,
        vehicle_make: input.vehicle_make ?? null,
        vehicle_model: input.vehicle_model ?? null,
        vehicle_reg_no: input.vehicle_reg_no ?? null,
        vehicle_year: input.vehicle_year ?? null,
        created_by: uid,
        updated_by: uid
      };

      const insertPayload = withLocationId('service_tickets', payloadBase);

      const { data, error } = await supabase
        .from('service_tickets')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;

      return { success: true, data: data as ServiceTicket };
    } catch (error) {
      console.error('Error creating service ticket:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create service ticket'
      };
    }
  }

  async uploadAttachments(params: {
    ticketId: string;
    files: File[];
    type: 'photo' | 'audio' | 'document';
    onProgress?: (file: File, progress: number) => void;
    caseType?: import('@/lib/types/service-tickets').CaseType;
    caseId?: string;
  }): Promise<ApiResponse<TicketAttachment[]>> {
    const { ticketId, files, type, onProgress } = params;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return { success: false, error: 'Not authenticated' };

      const bucket = type === 'audio' ? 'media-audio' : 'media-photos';
      const uploaded: TicketAttachment[] = [];
      const rootFolder =
        params.caseType === 'vehicle' && params.caseId
          ? `vehicles/${params.caseId}`
          : `intakes/${ticketId}`;

      for (const file of files) {
        const ext = file.name.split('.').pop() || 'bin';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${rootFolder}/${Date.now()}_${safeName}`;

        // Supabase Storage upload (no fine-grained progress in supabase-js v2)
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;
        onProgress?.(file, 100);

        // Insert attachment record
        const insertPayload = {
          ticket_id: ticketId,
          case_type: params.caseType ?? null,
          case_id: params.caseId ?? null,
          file_name: `${Date.now()}.${ext}`,
          original_name: file.name,
          storage_path: path,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          attachment_type: type,
          thumbnail_path: null,
          duration: null,
          uploaded_by: uid,
          source: 'internal',
          processed: false,
          processing_error: null
        } as const;

        const { data: row, error: insertError } = await supabase
          .from('ticket_attachments')
          .insert(insertPayload as any)
          .select('*')
          .single();

        if (insertError) throw insertError;
        uploaded.push(row as TicketAttachment);
      }

      return { success: true, data: uploaded };
    } catch (error) {
      console.error('Error uploading attachments:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to upload attachments'
      };
    }
  }

  async triageTicket(params: {
    ticketId: string;
    routeTo: 'vehicle' | 'battery' | 'both';
    note?: string;
  }): Promise<
    ApiResponse<{ vehicle_case_id?: string; battery_case_id?: string }>
  > {
    const { ticketId, routeTo, note } = params;
    try {
      let vehicle_case_id: string | undefined;
      let battery_case_id: string | undefined;

      // Fetch ticket for prefill
      const { data: ticket, error: tErr } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      if (tErr) throw tErr;

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;

      if (routeTo === 'vehicle' || routeTo === 'both') {
        const vehiclePayload: any = {
          service_ticket_id: ticketId,
          vehicle_make: ticket.vehicle_make || 'Unknown',
          vehicle_model: ticket.vehicle_model || 'Unknown',
          vehicle_reg_no: ticket.vehicle_reg_no || 'UNKNOWN',
          vehicle_year: ticket.vehicle_year,
          customer_id: ticket.customer_id,
          status: 'received',
          initial_diagnosis: note || null,
          created_by: uid ?? ticket.updated_by,
          updated_by: uid ?? ticket.updated_by
        };
        const { data: vcase, error: vErr } = await supabase
          .from('vehicle_cases')
          .insert(vehiclePayload)
          .select('*')
          .single();
        if (vErr) throw vErr;
        vehicle_case_id = (vcase as any).id;
      }

      // Phase 3: Create a Battery case in battery_records and link it back
      if (routeTo === 'battery' || routeTo === 'both') {
        // Create a minimal battery record linked to this ticket's customer
        const minimalBatteryBase = {
          serial_number: `BATT-${ticket.ticket_number}`,
          brand: 'Unknown',
          model: null,
          battery_type: 'other',
          voltage: 0,
          capacity: 0,
          cell_type: 'prismatic',
          customer_id: ticket.customer_id,
          repair_notes: note || 'Created from ticket triage',
          estimated_cost: null,
          created_by: uid ?? ticket.updated_by,
          updated_by: uid ?? ticket.updated_by
        } as any;

        // Attach location_id to satisfy RLS on battery_records
        const minimalBattery = withLocationId(
          'battery_records',
          minimalBatteryBase
        );

        const { data: bInserted, error: bErr } = await supabase
          .from('battery_records')
          .insert(minimalBattery as any)
          .select('id')
          .single();

        if (bErr) throw bErr;
        battery_case_id = (bInserted as any).id;
      }

      // Update ticket: link cases and set status and triage fields
      const updatePayload: any = {
        status: 'triaged',
        triaged_at: new Date().toISOString(),
        triage_notes: note || null
        // updated_by will be set by trigger
      };
      if (vehicle_case_id) updatePayload.vehicle_case_id = vehicle_case_id;
      if (battery_case_id) updatePayload.battery_case_id = battery_case_id;

      const { error: uErr } = await supabase
        .from('service_tickets')
        .update(updatePayload)
        .eq('id', ticketId);
      if (uErr) throw uErr;

      // Optional Slack notification for triage routing
      try {
        await fetch('/api/notifications/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Ticket ${ticket.ticket_number || ticketId} triaged. Vehicle case: ${vehicle_case_id ?? '-'} Battery case: ${battery_case_id ?? '-'}`
          })
        });
      } catch {}

      return { success: true, data: { vehicle_case_id, battery_case_id } };
    } catch (error) {
      console.error('Error triaging ticket:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to triage ticket'
      };
    }
  }

  async updateTicketStatus(
    ticketId: string,
    newStatus: import('@/lib/types/service-tickets').ServiceTicketStatus,
    note?: string
  ): Promise<ApiResponse<import('@/lib/types/service-tickets').ServiceTicket>> {
    try {
      // Fetch current ticket to capture previous status and number
      const { data: current, error: currErr } = await supabase
        .from('service_tickets')
        .select('id, status, ticket_number, updated_by')
        .eq('id', ticketId)
        .single();
      if (currErr) throw currErr;

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;

      const { data, error } = await supabase
        .from('service_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: uid ?? (current as any).updated_by,
          triage_notes: note ?? null
        })
        .eq('id', ticketId)
        .select('*')
        .single();
      if (error) throw error;

      // History is recorded via DB trigger; no manual insert needed

      // Slack notification for status changes
      try {
        const number = (current as any).ticket_number || ticketId;
        let text = `Ticket ${number} status → ${newStatus}`;
        if (newStatus === 'waiting_approval') {
          text = `Ticket ${number} requested customer approval${note ? `: ${note}` : ''}`;
        } else if (note) {
          text += ` — ${note}`;
        }
        await fetch('/api/notifications/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      } catch {}

      return { success: true, data: data as any };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update ticket status'
      };
    }
  }
  async findTicketByBatteryCaseId(
    batteryId: string
  ): Promise<ApiResponse<{ id: string; ticket_number: string } | null>> {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('id, ticket_number')
        .eq('battery_case_id', batteryId)
        .single();
      if (error) {
        if ((error as any).code === 'PGRST116') {
          return { success: true, data: null };
        }
        throw error;
      }
      return { success: true, data: data as any };
    } catch (error) {
      console.error('Error finding ticket by battery case id:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch linked ticket'
      };
    }
  }
  async listTicketHistory(
    ticketId: string
  ): Promise<
    ApiResponse<import('@/lib/types/service-tickets').ServiceTicketHistory[]>
  > {
    try {
      const { data, error } = await supabase
        .from('service_ticket_history')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: (data || []) as any };
    } catch (error) {
      console.error('Error listing ticket history:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to list ticket history'
      };
    }
  }
  async listVehicleAttachments(
    ticketId: string,
    vehicleCaseId: string
  ): Promise<ApiResponse<TicketAttachment[]>> {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('case_type', 'vehicle')
        .eq('case_id', vehicleCaseId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: (data || []) as any };
    } catch (error) {
      console.error('Error listing vehicle attachments:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to list vehicle attachments'
      };
    }
  }
  async listBatteryAttachments(
    ticketId: string,
    batteryId: string
  ): Promise<ApiResponse<TicketAttachment[]>> {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('case_type', 'battery')
        .eq('case_id', batteryId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: (data || []) as any };
    } catch (error) {
      console.error('Error listing battery attachments:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to list battery attachments'
      };
    }
  }

  async deleteTicketAttachment(
    attachmentId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Fetch attachment to determine bucket and path
      const { data: att, error: selErr } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();
      if (selErr) throw selErr;

      const bucket =
        (att as any).attachment_type === 'audio'
          ? 'media-audio'
          : 'media-photos';
      const path = (att as any).storage_path as string;

      // Remove from storage
      const { error: remErr } = await supabase.storage
        .from(bucket)
        .remove([path]);
      if (remErr) throw remErr;

      // Delete DB row
      const { error: delErr } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId);
      if (delErr) throw delErr;

      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete attachment'
      };
    }
  }
}

export const supabaseServiceTicketsRepository =
  new SupabaseServiceTicketsRepository();
