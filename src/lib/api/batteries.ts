// API Contract for Battery Operations
import {
  BatteryRecord,
  BatteryStatusHistory,
  TechnicalDiagnostics,
  DiagnosticsFormData,
  BatteryStatus,
  BatteryFormData,
  Customer,
  BatteryType,
  CellType
} from '@/types/bms';
import { isValidUUID, extractSimpleId } from '@/lib/uuid-utils';

// Base API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListBatteriesParams {
  search?: string; // matches serial_number or brand (client filters can refine further)
  status?: string; // single status value
  brand?: string; // single brand value
  limit?: number;
  offset?: number;
}

// Battery API Operations
export interface BatteryApiContract {
  // Fetch list of batteries
  listBatteries(
    params?: ListBatteriesParams
  ): Promise<ApiResponse<BatteryRecord[]>>;

  // Create a new battery
  createBattery(data: BatteryFormData): Promise<ApiResponse<BatteryRecord>>;

  // Fetch customers to populate forms
  listCustomers(): Promise<ApiResponse<Customer[]>>;

  // Fetch single battery
  fetchBattery(batteryId: string): Promise<ApiResponse<BatteryRecord>>;

  // Fetch battery status history
  fetchStatusHistory(
    batteryId: string
  ): Promise<ApiResponse<BatteryStatusHistory[]>>;

  // Fetch battery diagnostics
  fetchDiagnostics(
    batteryId: string
  ): Promise<ApiResponse<TechnicalDiagnostics>>;

  // Update battery status
  updateBatteryStatus(
    batteryId: string,
    newStatus: BatteryStatus,
    notes?: string
  ): Promise<ApiResponse<BatteryRecord>>;

  // Save diagnostics data
  saveDiagnostics(
    batteryId: string,
    diagnostics: DiagnosticsFormData
  ): Promise<ApiResponse<TechnicalDiagnostics>>;
}

// Mock implementation for development
export class MockBatteryApi implements BatteryApiContract {
  private delay(ms: number = 1000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async listBatteries(
    params?: ListBatteriesParams
  ): Promise<ApiResponse<BatteryRecord[]>> {
    await this.delay();
    // Simple mock: reuse a few generated entries based on params
    const base = await this.fetchBattery('mock-1');
    const batteries = base.success && base.data ? [base.data] : [];
    return { success: true, data: batteries };
  }

  async createBattery(
    data: BatteryFormData
  ): Promise<ApiResponse<BatteryRecord>> {
    await this.delay();
    const created: BatteryRecord = {
      id: `mock-${Date.now()}`,
      serial_number: data.serial_number,
      brand: data.brand,
      model: data.model,
      battery_type: data.battery_type,
      voltage: data.voltage,
      capacity: data.capacity,
      cell_type: data.cell_type,
      customer_id: data.customer_id,
      received_date: new Date().toISOString(),
      status: BatteryStatus.RECEIVED,
      repair_notes: data.repair_notes,
      bms_status: 'unknown',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'mock-user',
      updated_by: 'mock-user'
    };
    return { success: true, data: created };
  }

  async listCustomers(): Promise<ApiResponse<Customer[]>> {
    await this.delay();
    return {
      success: true,
      data: [
        {
          id: 'cust-1',
          name: 'Basheer',
          contact: '9946467546',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'cust-2',
          name: 'Abdhul Manaf',
          contact: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    };
  }

  async fetchBattery(batteryId: string): Promise<ApiResponse<BatteryRecord>> {
    await this.delay();

    // If batteryId is a UUID, extract simple ID for mock data lookup
    // This allows the mock API to work with both UUID and simple ID formats
    const simpleId = isValidUUID(batteryId)
      ? extractSimpleId(batteryId)
      : batteryId;

    // Mock battery data
    const mockBattery: BatteryRecord = {
      id: simpleId,
      serial_number: 'RGEKE72390722KLB07783',
      brand: 'E-Wheels',
      battery_type: BatteryType.LITHIUM_ION,
      voltage: 72,
      capacity: 39,
      cell_type: CellType.CYLINDRICAL_18650,
      customer_id: 'cust-1',
      customer: {
        id: 'cust-1',
        name: 'Basheer',
        contact: '9946467546',
        created_at: '2025-07-29T00:00:00Z',
        updated_at: '2025-07-29T00:00:00Z'
      },
      received_date: '2025-07-29T00:00:00Z',
      delivered_date: '2025-08-07T00:00:00Z',
      status: BatteryStatus.COMPLETED,
      bms_status: 'ok',
      repair_notes: '72v 39Ah. All cell ok, bms ok, Cell above 40 Ohms',
      technician_notes:
        'Customer reported reduced range. Initial testing shows cell imbalance.',
      estimated_cost: 4400,
      final_cost: 4400,
      parts_cost: 3200,
      labor_cost: 1200,
      load_test_result: 85,
      initial_voltage: 68.2,
      created_at: '2025-07-29T00:00:00Z',
      updated_at: '2025-08-07T00:00:00Z',
      created_by: 'user-1',
      updated_by: 'user-1'
    };

    return {
      success: true,
      data: mockBattery
    };
  }

  async fetchStatusHistory(
    batteryId: string
  ): Promise<ApiResponse<BatteryStatusHistory[]>> {
    await this.delay();

    // Handle both UUID and simple ID formats
    const simpleId = isValidUUID(batteryId)
      ? extractSimpleId(batteryId)
      : batteryId;

    const mockHistory: BatteryStatusHistory[] = [
      {
        id: 'hist-1',
        battery_id: simpleId,
        previous_status: BatteryStatus.RECEIVED,
        new_status: BatteryStatus.DIAGNOSED,
        changed_by: 'user-1',
        changed_at: '2025-07-30T10:00:00Z',
        notes:
          'Initial diagnosis completed. Cell imbalance detected, BMS functioning normally.'
      },
      {
        id: 'hist-2',
        battery_id: simpleId,
        previous_status: BatteryStatus.DIAGNOSED,
        new_status: BatteryStatus.IN_PROGRESS,
        changed_by: 'user-1',
        changed_at: '2025-07-31T09:00:00Z',
        notes: 'Started cell balancing procedure.'
      },
      {
        id: 'hist-3',
        battery_id: simpleId,
        previous_status: BatteryStatus.IN_PROGRESS,
        new_status: BatteryStatus.COMPLETED,
        changed_by: 'user-1',
        changed_at: '2025-08-06T16:30:00Z',
        notes:
          'Cell balancing completed. Load test passed at 85% efficiency. Ready for delivery.'
      }
    ];

    return {
      success: true,
      data: mockHistory
    };
  }

  async fetchDiagnostics(
    batteryId: string
  ): Promise<ApiResponse<TechnicalDiagnostics>> {
    await this.delay();

    // Handle both UUID and simple ID formats
    const simpleId = isValidUUID(batteryId)
      ? extractSimpleId(batteryId)
      : batteryId;

    const mockDiagnostics: TechnicalDiagnostics = {
      id: `diag-${simpleId}`,
      battery_id: simpleId,
      total_cells: 390,
      healthy_cells: 378,
      weak_cells: 12,
      dead_cells: 0,
      cells_above_threshold: 12,
      ir_threshold: 40,
      current_capacity: 37.2,
      capacity_retention: 95.4,
      load_test_current: 10.8,
      load_test_duration: 60,
      efficiency_rating: 85,
      bms_firmware_version: '2.1.4',
      bms_error_codes: ['None'],
      balancing_status: 'completed',
      test_temperature: 25,
      humidity: 45,
      diagnosed_at: '2025-07-30T10:30:00Z',
      diagnosed_by: 'user-1'
    };

    return {
      success: true,
      data: mockDiagnostics
    };
  }

  async updateBatteryStatus(
    batteryId: string,
    newStatus: BatteryStatus,
    notes?: string
  ): Promise<ApiResponse<BatteryRecord>> {
    await this.delay();

    // In real implementation, this would update the database
    console.log('Updating battery status:', { batteryId, newStatus, notes });

    // Return updated battery data
    const updatedBattery = await this.fetchBattery(batteryId);
    if (updatedBattery.success && updatedBattery.data) {
      updatedBattery.data.status = newStatus;
      updatedBattery.data.updated_at = new Date().toISOString();
    }

    return updatedBattery;
  }

  async saveDiagnostics(
    batteryId: string,
    diagnostics: DiagnosticsFormData
  ): Promise<ApiResponse<TechnicalDiagnostics>> {
    await this.delay();

    // In real implementation, this would save to database
    console.log('Saving diagnostics:', { batteryId, diagnostics });

    const savedDiagnostics: TechnicalDiagnostics = {
      id: `diag-${batteryId}`,
      battery_id: batteryId,
      total_cells: diagnostics.total_cells,
      healthy_cells: diagnostics.healthy_cells,
      weak_cells: diagnostics.weak_cells,
      dead_cells: diagnostics.dead_cells,
      cells_above_threshold: diagnostics.weak_cells + diagnostics.dead_cells,
      ir_threshold: diagnostics.ir_threshold,
      current_capacity: diagnostics.current_capacity,
      capacity_retention: 95.4, // Calculate based on original capacity
      load_test_current: diagnostics.load_test_current,
      load_test_duration: diagnostics.load_test_duration,
      efficiency_rating: diagnostics.efficiency_rating,
      bms_error_codes: diagnostics.bms_error_codes
        ? [diagnostics.bms_error_codes]
        : [],
      balancing_status: diagnostics.balancing_status,
      test_temperature: diagnostics.test_temperature,
      diagnosed_at: new Date().toISOString(),
      diagnosed_by: 'current-user' // TODO: Get from auth context
    };

    return {
      success: true,
      data: savedDiagnostics
    };
  }
}

// Import real Supabase implementation
import { supabaseBatteryRepository } from './batteries.supabase';

// Use real Supabase repository in production, mock for development/testing
const USE_MOCK =
  process.env.NODE_ENV === 'development' && process.env.USE_MOCK_API === 'true';

// Create singleton instance - switch between mock and real implementation
export const batteryApi = USE_MOCK
  ? new MockBatteryApi()
  : supabaseBatteryRepository;
