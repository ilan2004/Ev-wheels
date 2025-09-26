import { NextRequest, NextResponse } from 'next/server';
import { TechnicalDiagnostics, DiagnosticsFormData } from '@/types/bms';

// GET /api/batteries/[id]/diagnostics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Mock diagnostics data
    const diagnostics: TechnicalDiagnostics = {
      id: `diag-${id}`,
      battery_id: id,
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

    return NextResponse.json({
      success: true,
      data: diagnostics
    });
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch diagnostics data' 
      },
      { status: 500 }
    );
  }
}

// POST /api/batteries/[id]/diagnostics - Save diagnostics data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const diagnosticsData: DiagnosticsFormData = await request.json();
    
    // In a real implementation:
    // 1. Validate input data
    // 2. Check user permissions  
    // 3. Save to database
    // 4. Update battery record if needed
    
    console.log('Saving diagnostics:', { batteryId: id, diagnosticsData });
    
    // Mock saved diagnostics response
    const savedDiagnostics: TechnicalDiagnostics = {
      id: `diag-${id}`,
      battery_id: id,
      total_cells: diagnosticsData.total_cells,
      healthy_cells: diagnosticsData.healthy_cells,
      weak_cells: diagnosticsData.weak_cells,
      dead_cells: diagnosticsData.dead_cells,
      cells_above_threshold: diagnosticsData.weak_cells + diagnosticsData.dead_cells,
      ir_threshold: diagnosticsData.ir_threshold,
      current_capacity: diagnosticsData.current_capacity,
      capacity_retention: 95.4,
      load_test_current: diagnosticsData.load_test_current,
      load_test_duration: diagnosticsData.load_test_duration,
      efficiency_rating: diagnosticsData.efficiency_rating,
      bms_error_codes: diagnosticsData.bms_error_codes ? [diagnosticsData.bms_error_codes] : [],
      balancing_status: diagnosticsData.balancing_status,
      test_temperature: diagnosticsData.test_temperature,
      diagnosed_at: new Date().toISOString(),
      diagnosed_by: 'current-user'
    };

    return NextResponse.json({
      success: true,
      data: savedDiagnostics,
      message: 'Diagnostics data saved successfully'
    });
  } catch (error) {
    console.error('Error saving diagnostics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save diagnostics data' 
      },
      { status: 500 }
    );
  }
}
