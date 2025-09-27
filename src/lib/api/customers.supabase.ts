import { supabase } from '@/lib/supabase/client';
import type { CustomersApiContract, ApiResponse, ListCustomersParams } from './customers';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/lib/types/customers';

class CustomersSupabaseRepository implements CustomersApiContract {
  async list(params: ListCustomersParams = {}): Promise<ApiResponse<Customer[]>> {
    try {
      const SELECT_WITH_GST = 'id, name, contact, email, address, gst_number, created_at, updated_at';
      const SELECT_NO_GST = 'id, name, contact, email, address, created_at, updated_at';

      const buildQuery = (selectCols: string) => {
        let q = supabase
          .from('customers')
          .select(selectCols)
          .order('name', { ascending: true }) as any;
        if (params.search && params.search.trim()) {
          const term = `%${params.search.trim()}%`;
          q = q.or(`name.ilike.${term},contact.ilike.${term},email.ilike.${term}`);
        }
        if (typeof params.limit === 'number') q = q.limit(params.limit);
        if (typeof params.offset === 'number' && typeof params.limit === 'number') {
          q = q.range(params.offset, params.offset + params.limit - 1);
        }
        return q;
      };

      // Try with gst_number first
      let { data, error } = await buildQuery(SELECT_WITH_GST);
      if (error) {
        // Fallback if column doesn't exist (e.g., migration not applied yet)
        const { data: data2, error: err2 } = await buildQuery(SELECT_NO_GST);
        if (err2) throw err2;
        return { success: true, data: (data2 || []) as Customer[] };
      }
      return { success: true, data: (data || []) as Customer[] };
    } catch (error) {
      console.error('customers.list error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list customers' };
    }
  }

  async getById(id: string): Promise<ApiResponse<Customer | null>> {
    try {
      const SELECT_WITH_GST = 'id, name, contact, email, address, gst_number, created_at, updated_at';
      const SELECT_NO_GST = 'id, name, contact, email, address, created_at, updated_at';

      const selectOnce = async (cols: string) =>
        await supabase.from('customers').select(cols).eq('id', id).single();

      let { data, error } = await selectOnce(SELECT_WITH_GST);
      if (error) {
        const { data: data2, error: err2 } = await selectOnce(SELECT_NO_GST);
        if (err2) throw err2;
        return { success: true, data: (data2 as Customer) || null };
      }
      return { success: true, data: (data as Customer) || null };
    } catch (error) {
      if ((error as any)?.code === 'PGRST116') return { success: true, data: null };
      console.error('customers.getById error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch customer' };
    }
  }

  async create(input: CreateCustomerInput): Promise<ApiResponse<Customer>> {
    try {
      const SELECT_WITH_GST = 'id, name, contact, email, address, gst_number, created_at, updated_at';
      const SELECT_NO_GST = 'id, name, contact, email, address, created_at, updated_at';

      const payloadWithGst: any = {
        name: input.name,
        contact: input.contact ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        gst_number: input.gst_number ?? null,
      };
      const payloadNoGst: any = {
        name: input.name,
        contact: input.contact ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
      };

      let { data, error } = await supabase
        .from('customers')
        .insert(payloadWithGst)
        .select(SELECT_WITH_GST)
        .single();

      if (error) {
        // Fallback if gst_number column does not exist yet
        const result2 = await supabase
          .from('customers')
          .insert(payloadNoGst)
          .select(SELECT_NO_GST)
          .single();
        if (result2.error) throw result2.error;
        return { success: true, data: result2.data as Customer };
      }

      return { success: true, data: data as Customer };
    } catch (error) {
      console.error('customers.create error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create customer' };
    }
  }

  async update(id: string, input: UpdateCustomerInput): Promise<ApiResponse<Customer>> {
    try {
      const SELECT_WITH_GST = 'id, name, contact, email, address, gst_number, created_at, updated_at';
      const SELECT_NO_GST = 'id, name, contact, email, address, created_at, updated_at';

      const payloadWithGst: any = {
        name: input.name,
        contact: input.contact,
        email: input.email,
        address: input.address,
        gst_number: input.gst_number,
        updated_at: new Date().toISOString(),
      };
      const payloadNoGst: any = {
        name: input.name,
        contact: input.contact,
        email: input.email,
        address: input.address,
        updated_at: new Date().toISOString(),
      };

      let { data, error } = await supabase
        .from('customers')
        .update(payloadWithGst)
        .eq('id', id)
        .select(SELECT_WITH_GST)
        .single();

      if (error) {
        const result2 = await supabase
          .from('customers')
          .update(payloadNoGst)
          .eq('id', id)
          .select(SELECT_NO_GST)
          .single();
        if (result2.error) throw result2.error;
        return { success: true, data: result2.data as Customer };
      }

      return { success: true, data: data as Customer };
    } catch (error) {
      console.error('customers.update error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update customer' };
    }
  }

  async remove(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true, data: true };
    } catch (error) {
      console.error('customers.remove error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete customer' };
    }
  }

  async merge(sourceId: string, targetId: string): Promise<ApiResponse<{ merged: boolean }>> {
    try {
      if (sourceId === targetId) return { success: true, data: { merged: true } };
      // Repoint references in known tables
      const updates = [
        supabase.from('battery_records').update({ customer_id: targetId }).eq('customer_id', sourceId),
        supabase.from('service_tickets').update({ customer_id: targetId }).eq('customer_id', sourceId),
      ];
      const results = await Promise.all(updates);
      for (const r of results) if ((r as any).error) throw (r as any).error;

      // Optional: write an audit row (no-op if table/policy not set)
      try {
        await supabase.from('customers_audit').insert({
          customer_id: targetId,
          action: 'merged',
          previous_values: { merged_from: sourceId },
          new_values: { customer_id: targetId },
          changed_at: new Date().toISOString(),
        } as any);
      } catch {}

      // Delete source customer
      const { error: delErr } = await supabase.from('customers').delete().eq('id', sourceId);
      if (delErr) throw delErr;

      return { success: true, data: { merged: true } };
    } catch (error) {
      console.error('customers.merge error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to merge customers' };
    }
  }
}

export const customersSupabaseRepository: CustomersApiContract = new CustomersSupabaseRepository();

