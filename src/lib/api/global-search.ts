import { supabase } from '@/lib/supabase/client';
import type { ApiResponse } from '@/lib/api/service-tickets';
import type { ServiceTicket } from '@/lib/types/service-tickets';
import type { BatteryRecord } from '@/types/bms';

export interface GlobalSearchResults {
  tickets: Array<
    Pick<ServiceTicket, 'id' | 'ticket_number' | 'status' | 'vehicle_reg_no' | 'created_at'> & {
      location?: { id: string; name: string; code?: string | null } | null;
    }
  >;
  batteries: Pick<BatteryRecord, 'id' | 'serial_number' | 'brand' | 'status'>[];
  customers: Array<{
    id: string;
    name: string;
    contact?: string | null;
    location?: { id: string; name: string; code?: string | null } | null;
  }>;
}

export async function globalSearch(
  query: string,
  limits: { tickets?: number; batteries?: number; customers?: number } = {}
): Promise<ApiResponse<GlobalSearchResults>> {
  const term = (query || '').trim();
  if (!term)
    return {
      success: true,
      data: { tickets: [], batteries: [], customers: [] }
    };

  const like = `%${term}%`;
  const tLim = limits.tickets ?? 10;
  const bLim = limits.batteries ?? 10;
  const cLim = limits.customers ?? 10;

  try {
    const [ticketsRes, batteriesRes, customersRes] = await Promise.all([
      supabase
        .from('service_tickets')
        .select('id, ticket_number, status, vehicle_reg_no, created_at, location:locations(id,name,code)')
        .or(
          `ticket_number.ilike.${like},vehicle_reg_no.ilike.${like},description.ilike.${like},symptom.ilike.${like}`
        )
        .order('created_at', { ascending: false })
        .limit(tLim),
      supabase
        .from('battery_records')
        .select('id, serial_number, brand, status')
        .or(`serial_number.ilike.${like},brand.ilike.${like}`)
        .order('updated_at', { ascending: false })
        .limit(bLim),
      supabase
        .from('customers')
        .select('id, name, contact, location:locations(id,name,code)')
        .or(`name.ilike.${like},contact.ilike.${like}`)
        .order('name', { ascending: true })
        .limit(cLim)
    ]);

    if (ticketsRes.error) throw ticketsRes.error;
    if (batteriesRes.error) throw batteriesRes.error;
    if (customersRes.error) throw customersRes.error;

    return {
      success: true,
      data: {
        tickets: (ticketsRes.data || []) as any,
        batteries: (batteriesRes.data || []) as any,
        customers: (customersRes.data || []) as any
      }
    };
  } catch (error) {
    console.error('Global search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    };
  }
}
