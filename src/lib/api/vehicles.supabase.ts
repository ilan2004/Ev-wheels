// Supabase Vehicle Cases repository (Phase 4)
import { supabase } from '@/lib/supabase/client'
import type { VehiclesApiContract, ApiResponse } from './vehicles'
import type { VehicleCase, VehicleStatus } from '@/lib/types/service-tickets'

class SupabaseVehiclesRepository implements VehiclesApiContract {
  async listVehicles(params: { search?: string; status?: VehicleStatus; limit?: number; offset?: number } = {}): Promise<ApiResponse<VehicleCase[]>> {
    try {
      let query = supabase
        .from('vehicle_cases')
        .select('*')
        .order('created_at', { ascending: false })

      if (params.status) query = query.eq('status', params.status)
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`
        query = query.or(`vehicle_reg_no.ilike.${term},vehicle_make.ilike.${term},vehicle_model.ilike.${term}`)
      }
      if (params.limit) query = query.limit(params.limit)
      if (params.offset) query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1)

      const { data, error } = await query
      if (error) throw error

      return { success: true, data: (data || []) as any }
    } catch (error) {
      console.error('Error listing vehicles:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list vehicles' }
    }
  }

  async fetchVehicle(id: string): Promise<ApiResponse<VehicleCase>> {
    try {
      const { data, error } = await supabase
        .from('vehicle_cases')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return { success: true, data: data as any }
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch vehicle' }
    }
  }

  async updateVehicleStatus(id: string, newStatus: VehicleStatus, notes?: string): Promise<ApiResponse<VehicleCase>> {
    try {
      // Fetch current row for audit/context
      const current = await this.fetchVehicle(id)
      if (!current.success || !current.data) return { success: false, error: 'Vehicle case not found' }

      const { data, error } = await supabase
        .from('vehicle_cases')
        .update({ status: newStatus, updated_at: new Date().toISOString(), updated_by: current.data.updated_by })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error

      // Optional: insert into vehicle_status_history if you later enable it via DB trigger or manually
      // If you want to add manual history now, uncomment below:
      // await supabase.from('vehicle_status_history').insert({
      //   vehicle_case_id: id,
      //   previous_status: current.data.status,
      //   new_status: newStatus,
      //   changed_by: current.data.updated_by,
      //   notes: notes || null,
      // })

      return { success: true, data: data as any }
    } catch (error) {
      console.error('Error updating vehicle status:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update vehicle status' }
    }
  }
  async updateVehicleNotes(id: string, technician_notes: string) {
    try {
      const { data, error } = await supabase
        .from('vehicle_cases')
        .update({ technician_notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return { success: true, data: data as any }
    } catch (error) {
      console.error('Error updating vehicle notes:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update vehicle notes' }
    }
  }

  async listVehicleHistory(vehicleId: string) {
    try {
      const { data, error } = await supabase
        .from('vehicle_status_history')
        .select('*')
        .eq('vehicle_case_id', vehicleId)
        .order('changed_at', { ascending: false })
      if (error) throw error
      return { success: true, data: (data || []) as any }
    } catch (error) {
      console.error('Error listing vehicle history:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list vehicle history' }
    }
  }
}

export const supabaseVehiclesRepository = new SupabaseVehiclesRepository()

