// API contract for Vehicle Cases (Phase 4)
import type { VehicleCase, VehicleStatus } from '@/lib/types/service-tickets';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListVehiclesParams {
  search?: string; // vehicle_reg_no or make/model
  status?: VehicleStatus | VehicleStatus[]; // single status or array
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  technicianId?: string | 'unassigned'; // user ID or 'unassigned'
  customerId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface VehiclesApiContract {
  listVehicles(
    params?: ListVehiclesParams
  ): Promise<ApiResponse<{ vehicles: VehicleCase[]; totalCount: number }>>;
  fetchVehicle(id: string): Promise<ApiResponse<VehicleCase>>;
  updateVehicleStatus(
    id: string,
    newStatus: VehicleStatus,
    notes?: string
  ): Promise<ApiResponse<VehicleCase>>;
  updateVehicleNotes(
    id: string,
    technician_notes: string
  ): Promise<ApiResponse<VehicleCase>>;
  listVehicleHistory(
    vehicleId: string
  ): Promise<
    ApiResponse<import('@/lib/types/service-tickets').VehicleStatusHistory[]>
  >;
}

import { supabaseVehiclesRepository } from './vehicles.supabase';

export const vehiclesApi: VehiclesApiContract = supabaseVehiclesRepository;
export type { VehicleCase, VehicleStatus };
