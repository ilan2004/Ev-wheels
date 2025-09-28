// Supabase Vehicle Cases repository (Phase 4)
import { supabase } from '@/lib/supabase/client'
import type { VehiclesApiContract, ApiResponse } from './vehicles'
import type { VehicleCase, VehicleStatus } from '@/lib/types/service-tickets'

class SupabaseVehiclesRepository implements VehiclesApiContract {
  async listVehicles(params: { 
    search?: string; 
    status?: VehicleStatus | VehicleStatus[]; 
    dateFrom?: string;
    dateTo?: string;
    technicianId?: string | 'unassigned';
    customerId?: string;
    limit?: number; 
    offset?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse<{ vehicles: VehicleCase[]; totalCount: number }>> {
    try {
      // First get total count
      let countQuery = supabase
        .from('vehicle_cases')
        .select('*', { count: 'exact', head: true })

      // Apply filters to count query
      if (params.status) {
        if (Array.isArray(params.status)) {
          countQuery = countQuery.in('status', params.status)
        } else {
          countQuery = countQuery.eq('status', params.status)
        }
      }
      
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`
        countQuery = countQuery.or(`vehicle_reg_no.ilike.${term},vehicle_make.ilike.${term},vehicle_model.ilike.${term}`)
      }
      
      if (params.dateFrom) {
        countQuery = countQuery.gte('received_date', params.dateFrom)
      }
      
      if (params.dateTo) {
        countQuery = countQuery.lte('received_date', params.dateTo)
      }
      
      if (params.technicianId) {
        if (params.technicianId === 'unassigned') {
          countQuery = countQuery.is('assigned_technician', null)
        } else {
          countQuery = countQuery.eq('assigned_technician', params.technicianId)
        }
      }
      
      if (params.customerId) {
        countQuery = countQuery.eq('customer_id', params.customerId)
      }

      const { count } = await countQuery
      
      // Then get paginated data with customer info
      let query = supabase
        .from('vehicle_cases')
        .select(`
          *,
          customer:customers!customer_id(
            id,
            name,
            contact,
            email
          )
        `)

      // Apply same filters to data query
      if (params.status) {
        if (Array.isArray(params.status)) {
          query = query.in('status', params.status)
        } else {
          query = query.eq('status', params.status)
        }
      }
      
      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim()}%`
        query = query.or(`vehicle_reg_no.ilike.${term},vehicle_make.ilike.${term},vehicle_model.ilike.${term}`)
      }
      
      if (params.dateFrom) {
        query = query.gte('received_date', params.dateFrom)
      }
      
      if (params.dateTo) {
        query = query.lte('received_date', params.dateTo)
      }
      
      if (params.technicianId) {
        if (params.technicianId === 'unassigned') {
          query = query.is('assigned_technician', null)
        } else {
          query = query.eq('assigned_technician', params.technicianId)
        }
      }
      
      if (params.customerId) {
        query = query.eq('customer_id', params.customerId)
      }

      // Apply sorting
      const sortColumn = params.sortBy || 'created_at'
      const sortDirection = params.sortDirection || 'desc'
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' })

      // Apply pagination
      const limit = params.limit || 20
      const offset = params.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query
      if (error) throw error

      return { 
        success: true, 
        data: { 
          vehicles: (data || []) as any,
          totalCount: count || 0
        } 
      }
    } catch (error) {
      console.error('Error listing vehicles:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list vehicles', data: { vehicles: [], totalCount: 0 } }
    }
  }

  async fetchVehicle(id: string): Promise<ApiResponse<VehicleCase>> {
    try {
      const { data, error } = await supabase
        .from('vehicle_cases')
        .select(`
          *,
          customer:customers!customer_id(
            id,
            name,
            contact,
            email
          )
        `)
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
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Fetch current row for audit/context
      const current = await this.fetchVehicle(id)
      if (!current.success || !current.data) return { success: false, error: 'Vehicle case not found' }

      const { data, error } = await supabase
        .from('vehicle_cases')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(), 
          updated_by: user.id 
        })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error

      // Insert into vehicle_status_history if notes are provided
      if (notes) {
        await supabase.from('vehicle_status_history').insert({
          vehicle_case_id: id,
          previous_status: current.data.status,
          new_status: newStatus,
          changed_by: user.id,
          notes: notes
        })
      }

      return { success: true, data: data as any }
    } catch (error) {
      console.error('Error updating vehicle status:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update vehicle status' }
    }
  }
  async updateVehicleNotes(id: string, technician_notes: string) {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await supabase
        .from('vehicle_cases')
        .update({ 
          technician_notes, 
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
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

