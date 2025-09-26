// Real Supabase Battery Repository Implementation
import { supabase } from '@/lib/supabase/client';
import { BatteryRecord, BatteryStatusHistory, TechnicalDiagnostics, DiagnosticsFormData, BatteryStatus } from '@/types/bms';
import { BatteryApiContract, ApiResponse } from './batteries';

export class SupabaseBatteryRepository implements BatteryApiContract {
  
  async listBatteries(params: { search?: string; status?: string; brand?: string; limit?: number; offset?: number } = {}): Promise<ApiResponse<BatteryRecord[]>> {
    try {
      let query = supabase
        .from('battery_records')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('received_date', { ascending: false });

      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.brand) {
        query = query.eq('brand', params.brand);
      }
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`;
        // Apply to serial_number and brand; client can further filter by customer locally
        query = query.or(`serial_number.ilike.${term},brand.ilike.${term}`);
      }
      if (params.limit) query = query.limit(params.limit);
      if (params.offset) query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((battery: any): BatteryRecord => ({
        id: battery.id,
        serial_number: battery.serial_number,
        brand: battery.brand,
        model: battery.model,
        battery_type: battery.battery_type,
        voltage: parseFloat(battery.voltage),
        capacity: parseFloat(battery.capacity),
        cell_type: battery.cell_type,
        cell_count: battery.cell_count,
        customer_id: battery.customer_id,
        customer: battery.customer ? {
          id: battery.customer.id,
          name: battery.customer.name,
          contact: battery.customer.contact,
          email: battery.customer.email,
          address: battery.customer.address,
          created_at: battery.customer.created_at,
          updated_at: battery.customer.updated_at
        } : undefined,
        received_date: battery.received_date,
        delivered_date: battery.delivered_date,
        status: battery.status,
        initial_voltage: battery.initial_voltage ? parseFloat(battery.initial_voltage) : undefined,
        load_test_result: battery.load_test_result ? parseFloat(battery.load_test_result) : undefined,
        ir_values: battery.ir_values,
        cell_voltages: battery.cell_voltages,
        bms_status: battery.bms_status,
        repair_type: battery.repair_type,
        cells_replaced: battery.cells_replaced,
        rows_replaced: battery.rows_replaced,
        repair_notes: battery.repair_notes,
        technician_notes: battery.technician_notes,
        estimated_cost: battery.estimated_cost ? parseFloat(battery.estimated_cost) : undefined,
        final_cost: battery.final_cost ? parseFloat(battery.final_cost) : undefined,
        parts_cost: battery.parts_cost ? parseFloat(battery.parts_cost) : undefined,
        labor_cost: battery.labor_cost ? parseFloat(battery.labor_cost) : undefined,
        created_at: battery.created_at,
        updated_at: battery.updated_at,
        created_by: battery.created_by,
        updated_by: battery.updated_by
      }));

      return { success: true, data: mapped };
    } catch (error) {
      console.error('Error listing batteries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list batteries' };
    }
  }

  async listCustomers(): Promise<ApiResponse<import('@/types/bms').Customer[]>> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, contact, created_at, updated_at')
        .order('name', { ascending: true })
        .limit(200);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error listing customers:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list customers' };
    }
  }

  async createBattery(data: import('@/types/bms').BatteryFormData): Promise<ApiResponse<BatteryRecord>> {
    try {
      const payload: any = {
        serial_number: data.serial_number,
        brand: data.brand,
        model: data.model,
        battery_type: data.battery_type,
        voltage: data.voltage,
        capacity: data.capacity,
        cell_type: data.cell_type,
        customer_id: data.customer_id,
        repair_notes: data.repair_notes,
        estimated_cost: data.estimated_cost,
        bms_status: 'unknown',
        created_by: '00000000-0000-4000-8000-000000000001',
        updated_by: '00000000-0000-4000-8000-000000000001'
      };

      const { data: inserted, error } = await supabase
        .from('battery_records')
        .insert(payload)
        .select(`
          *,
          customer:customers(*)
        `)
        .single();

      if (error) throw error;

      const mapped: BatteryRecord = {
        id: inserted.id,
        serial_number: inserted.serial_number,
        brand: inserted.brand,
        model: inserted.model,
        battery_type: inserted.battery_type,
        voltage: parseFloat(inserted.voltage),
        capacity: parseFloat(inserted.capacity),
        cell_type: inserted.cell_type,
        cell_count: inserted.cell_count,
        customer_id: inserted.customer_id,
        customer: inserted.customer ? {
          id: inserted.customer.id,
          name: inserted.customer.name,
          contact: inserted.customer.contact,
          email: inserted.customer.email,
          address: inserted.customer.address,
          created_at: inserted.customer.created_at,
          updated_at: inserted.customer.updated_at
        } : undefined,
        received_date: inserted.received_date,
        delivered_date: inserted.delivered_date,
        status: inserted.status,
        initial_voltage: inserted.initial_voltage ? parseFloat(inserted.initial_voltage) : undefined,
        load_test_result: inserted.load_test_result ? parseFloat(inserted.load_test_result) : undefined,
        ir_values: inserted.ir_values,
        cell_voltages: inserted.cell_voltages,
        bms_status: inserted.bms_status,
        repair_type: inserted.repair_type,
        cells_replaced: inserted.cells_replaced,
        rows_replaced: inserted.rows_replaced,
        repair_notes: inserted.repair_notes,
        technician_notes: inserted.technician_notes,
        estimated_cost: inserted.estimated_cost ? parseFloat(inserted.estimated_cost) : undefined,
        final_cost: inserted.final_cost ? parseFloat(inserted.final_cost) : undefined,
        parts_cost: inserted.parts_cost ? parseFloat(inserted.parts_cost) : undefined,
        labor_cost: inserted.labor_cost ? parseFloat(inserted.labor_cost) : undefined,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
        created_by: inserted.created_by,
        updated_by: inserted.updated_by
      };

      return { success: true, data: mapped };
    } catch (error) {
      console.error('Error creating battery:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create battery' };
    }
  }

  async fetchBattery(batteryId: string): Promise<ApiResponse<BatteryRecord>> {
    try {
      // Fetch battery with joined customer data
      const { data: battery, error } = await supabase
        .from('battery_records')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', batteryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Battery not found'
          };
        }
        throw error;
      }

      // Map database row to BatteryRecord type
      const mappedBattery: BatteryRecord = {
        id: battery.id,
        serial_number: battery.serial_number,
        brand: battery.brand,
        model: battery.model,
        battery_type: battery.battery_type,
        voltage: parseFloat(battery.voltage),
        capacity: parseFloat(battery.capacity),
        cell_type: battery.cell_type,
        cell_count: battery.cell_count,
        customer_id: battery.customer_id,
        customer: battery.customer ? {
          id: battery.customer.id,
          name: battery.customer.name,
          contact: battery.customer.contact,
          email: battery.customer.email,
          address: battery.customer.address,
          created_at: battery.customer.created_at,
          updated_at: battery.customer.updated_at
        } : undefined,
        received_date: battery.received_date,
        delivered_date: battery.delivered_date,
        status: battery.status,
        initial_voltage: battery.initial_voltage ? parseFloat(battery.initial_voltage) : undefined,
        load_test_result: battery.load_test_result ? parseFloat(battery.load_test_result) : undefined,
        ir_values: battery.ir_values,
        cell_voltages: battery.cell_voltages,
        bms_status: battery.bms_status,
        repair_type: battery.repair_type,
        cells_replaced: battery.cells_replaced,
        rows_replaced: battery.rows_replaced,
        repair_notes: battery.repair_notes,
        technician_notes: battery.technician_notes,
        estimated_cost: battery.estimated_cost ? parseFloat(battery.estimated_cost) : undefined,
        final_cost: battery.final_cost ? parseFloat(battery.final_cost) : undefined,
        parts_cost: battery.parts_cost ? parseFloat(battery.parts_cost) : undefined,
        labor_cost: battery.labor_cost ? parseFloat(battery.labor_cost) : undefined,
        created_at: battery.created_at,
        updated_at: battery.updated_at,
        created_by: battery.created_by,
        updated_by: battery.updated_by
      };

      return {
        success: true,
        data: mappedBattery
      };
    } catch (error) {
      console.error('Error fetching battery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch battery'
      };
    }
  }

  async fetchStatusHistory(batteryId: string): Promise<ApiResponse<BatteryStatusHistory[]>> {
    try {
      const { data: history, error } = await supabase
        .from('battery_status_history')
        .select('*')
        .eq('battery_id', batteryId)
        .order('changed_at', { ascending: true });

      if (error) throw error;

      const mappedHistory: BatteryStatusHistory[] = (history || []).map(entry => ({
        id: entry.id,
        battery_id: entry.battery_id,
        previous_status: entry.previous_status,
        new_status: entry.new_status,
        changed_by: entry.changed_by,
        changed_at: entry.changed_at,
        notes: entry.notes
      }));

      return {
        success: true,
        data: mappedHistory
      };
    } catch (error) {
      console.error('Error fetching status history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch status history'
      };
    }
  }

  async fetchDiagnostics(batteryId: string): Promise<ApiResponse<TechnicalDiagnostics>> {
    try {
      const { data: diagnostics, error } = await supabase
        .from('technical_diagnostics')
        .select('*')
        .eq('battery_id', batteryId)
        .order('diagnosed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'No diagnostics data found for this battery'
          };
        }
        throw error;
      }

      const mappedDiagnostics: TechnicalDiagnostics = {
        id: diagnostics.id,
        battery_id: diagnostics.battery_id,
        total_cells: diagnostics.total_cells,
        healthy_cells: diagnostics.healthy_cells,
        weak_cells: diagnostics.weak_cells,
        dead_cells: diagnostics.dead_cells,
        cells_above_threshold: diagnostics.cells_above_threshold,
        ir_threshold: parseFloat(diagnostics.ir_threshold ?? '0'),
        current_capacity: diagnostics.current_capacity != null ? parseFloat(diagnostics.current_capacity) : 0,
        capacity_retention: diagnostics.capacity_retention != null ? parseFloat(diagnostics.capacity_retention) : 0,
        load_test_current: diagnostics.load_test_current != null ? parseFloat(diagnostics.load_test_current) : 0,
        load_test_duration: diagnostics.load_test_duration,
        efficiency_rating: diagnostics.efficiency_rating != null ? parseFloat(diagnostics.efficiency_rating) : 0,
        bms_firmware_version: diagnostics.bms_firmware_version,
        bms_error_codes: diagnostics.bms_error_codes || [],
        balancing_status: diagnostics.balancing_status,
        test_temperature: diagnostics.test_temperature != null ? parseFloat(diagnostics.test_temperature) : 0,
        humidity: diagnostics.humidity != null ? parseFloat(diagnostics.humidity) : undefined,
        diagnosed_at: diagnostics.diagnosed_at,
        diagnosed_by: diagnostics.diagnosed_by
      };

      return {
        success: true,
        data: mappedDiagnostics
      };
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch diagnostics'
      };
    }
  }

  async updateBatteryStatus(
    batteryId: string,
    newStatus: BatteryStatus,
    notes?: string
  ): Promise<ApiResponse<BatteryRecord>> {
    try {
      // First get current battery to check current status
      const currentBattery = await this.fetchBattery(batteryId);
      if (!currentBattery.success || !currentBattery.data) {
        return {
          success: false,
          error: 'Battery not found'
        };
      }

      // Update battery status
      const { data: updatedBattery, error: updateError } = await supabase
        .from('battery_records')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          // TODO: Replace with actual user ID from auth context
          updated_by: currentBattery.data.updated_by
        })
        .eq('id', batteryId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Manually insert status history entry (with custom notes if provided)
      if (notes) {
        const { error: historyError } = await supabase
          .from('battery_status_history')
          .insert({
            battery_id: batteryId,
            previous_status: currentBattery.data.status,
            new_status: newStatus,
            changed_by: currentBattery.data.updated_by,
            changed_at: new Date().toISOString(),
            notes
          });

        if (historyError) {
          console.error('Error creating status history:', historyError);
          // Don't fail the request if history creation fails
        }
      }

      // Phase 3: Reflect battery status change in parent service ticket timeline (if linked)
      try {
        const { data: linkedTicket } = await supabase
          .from('service_tickets')
          .select('id')
          .eq('battery_case_id', batteryId)
          .single();
        if (linkedTicket && (linkedTicket as any).id) {
          await supabase
            .from('service_ticket_history')
            .insert({
              ticket_id: (linkedTicket as any).id,
              action: 'updated',
              previous_values: null,
              new_values: null,
              changed_by: updatedBattery?.updated_by || currentBattery.data.updated_by,
              notes: `Battery status changed to ${newStatus}`,
            });
        }
      } catch (err) {
        console.error('Error reflecting battery status in ticket history:', err);
      }

      // Return updated battery data
      return this.fetchBattery(batteryId);
    } catch (error) {
      console.error('Error updating battery status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update battery status'
      };
    }
  }

  async saveDiagnostics(
    batteryId: string,
    diagnostics: DiagnosticsFormData
  ): Promise<ApiResponse<TechnicalDiagnostics>> {
    try {
      // Check if diagnostics already exist for this battery
      const { data: existing } = await supabase
        .from('technical_diagnostics')
        .select('id')
        .eq('battery_id', batteryId)
        .single();

      const diagnosticsData = {
        battery_id: batteryId,
        total_cells: diagnostics.total_cells,
        healthy_cells: diagnostics.healthy_cells,
        weak_cells: diagnostics.weak_cells,
        dead_cells: diagnostics.dead_cells,
        cells_above_threshold: diagnostics.weak_cells + diagnostics.dead_cells,
        ir_threshold: diagnostics.ir_threshold,
        current_capacity: diagnostics.current_capacity,
        load_test_current: diagnostics.load_test_current,
        load_test_duration: diagnostics.load_test_duration,
        efficiency_rating: diagnostics.efficiency_rating,
        bms_error_codes: diagnostics.bms_error_codes ? [diagnostics.bms_error_codes] : [],
        balancing_status: diagnostics.balancing_status,
        test_temperature: diagnostics.test_temperature,
        diagnosed_at: new Date().toISOString(),
        // TODO: Replace with actual user ID from auth context
        diagnosed_by: 'current-user-id'
      };

      let result;
      if (existing) {
        // Update existing diagnostics
        const { data, error } = await supabase
          .from('technical_diagnostics')
          .update(diagnosticsData)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new diagnostics
        const { data, error } = await supabase
          .from('technical_diagnostics')
          .insert(diagnosticsData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Also update the battery record with load test result
      await supabase
        .from('battery_records')
        .update({
          load_test_result: diagnostics.efficiency_rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', batteryId);

      const mappedResult: TechnicalDiagnostics = {
        id: result.id,
        battery_id: result.battery_id,
        total_cells: result.total_cells,
        healthy_cells: result.healthy_cells,
        weak_cells: result.weak_cells,
        dead_cells: result.dead_cells,
        cells_above_threshold: result.cells_above_threshold,
        ir_threshold: parseFloat(result.ir_threshold ?? '0'),
        current_capacity: result.current_capacity != null ? parseFloat(result.current_capacity) : 0,
        capacity_retention: result.capacity_retention != null ? parseFloat(result.capacity_retention) : 0,
        load_test_current: result.load_test_current != null ? parseFloat(result.load_test_current) : 0,
        load_test_duration: result.load_test_duration,
        efficiency_rating: result.efficiency_rating != null ? parseFloat(result.efficiency_rating) : 0,
        bms_firmware_version: result.bms_firmware_version,
        bms_error_codes: result.bms_error_codes || [],
        balancing_status: result.balancing_status,
        test_temperature: result.test_temperature != null ? parseFloat(result.test_temperature) : 0,
        humidity: result.humidity != null ? parseFloat(result.humidity) : undefined,
        diagnosed_at: result.diagnosed_at,
        diagnosed_by: result.diagnosed_by
      };

      return {
        success: true,
        data: mappedResult
      };
    } catch (error) {
      console.error('Error saving diagnostics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save diagnostics'
      };
    }
  }
}

// Create the repository instance
export const supabaseBatteryRepository = new SupabaseBatteryRepository();
