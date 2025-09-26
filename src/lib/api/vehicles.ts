// API contract for Vehicle Cases (Phase 4)
import type { VehicleCase, VehicleStatus } from '@/lib/types/service-tickets'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ListVehiclesParams {
  search?: string // vehicle_reg_no or make/model
  status?: VehicleStatus
  limit?: number
  offset?: number
}

export interface VehiclesApiContract {
  listVehicles(params?: ListVehiclesParams): Promise<ApiResponse<VehicleCase[]>>
  fetchVehicle(id: string): Promise<ApiResponse<VehicleCase>>
  updateVehicleStatus(id: string, newStatus: VehicleStatus, notes?: string): Promise<ApiResponse<VehicleCase>>
  updateVehicleNotes(id: string, technician_notes: string): Promise<ApiResponse<VehicleCase>>
  listVehicleHistory(vehicleId: string): Promise<ApiResponse<import('@/lib/types/service-tickets').VehicleStatusHistory[]>>
}

import { supabaseVehiclesRepository } from './vehicles.supabase'

export const vehiclesApi: VehiclesApiContract = supabaseVehiclesRepository
export type { VehicleCase, VehicleStatus }

