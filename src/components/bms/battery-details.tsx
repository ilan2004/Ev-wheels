'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconArrowLeft,
  IconEdit,
  IconPrinter,
  IconQrcode,
  IconBattery,
  IconUser,
  IconClock,
  IconCurrency
} from '@tabler/icons-react';
import { BatteryRecord, BatteryStatus, BatteryStatusHistory, TechnicalDiagnostics, DiagnosticsFormData } from '@/types/bms';
import { BatteryStatusWorkflow } from './battery-status-workflow';
import { BatteryDiagnostics } from './battery-diagnostics';
import { batteryApi } from '@/lib/api/batteries';

interface BatteryDetailsProps {
  batteryId: string;
}


export function BatteryDetails({ batteryId }: BatteryDetailsProps) {
  const router = useRouter();
  const [battery, setBattery] = useState<BatteryRecord | null>(null);
  const [statusHistory, setStatusHistory] = useState<BatteryStatusHistory[]>([]);
  const [diagnostics, setDiagnostics] = useState<TechnicalDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatteryData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch battery details and status history in parallel
        const [batteryResponse, historyResponse] = await Promise.all([
          batteryApi.fetchBattery(batteryId),
          batteryApi.fetchStatusHistory(batteryId)
        ]);

        if (batteryResponse.success && batteryResponse.data) {
          setBattery(batteryResponse.data);
        } else {
          setError(batteryResponse.error || 'Failed to fetch battery details');
        }

        if (historyResponse.success && historyResponse.data) {
          setStatusHistory(historyResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatteryData();
  }, [batteryId]);

  const fetchDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      const response = await batteryApi.fetchDiagnostics(batteryId);
      if (response.success && response.data) {
        setDiagnostics(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch diagnostics:', err);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handleDiagnosticsSave = async (diagnosticsData: DiagnosticsFormData) => {
    try {
      const response = await batteryApi.saveDiagnostics(batteryId, diagnosticsData);
      if (response.success && response.data) {
        setDiagnostics(response.data);
      }
    } catch (err) {
      console.error('Failed to save diagnostics:', err);
      throw err; // Re-throw to let the diagnostics component handle the error
    }
  };

  const handleStatusChange = async (newStatus: BatteryStatus, notes: string) => {
    if (!battery) return;

    try {
      const response = await batteryApi.updateBatteryStatus(batteryId, newStatus, notes);
      
      if (response.success && response.data) {
        setBattery(response.data);
        
        // Add to status history
        const newHistoryEntry: BatteryStatusHistory = {
          id: `hist-${Date.now()}`,
          battery_id: batteryId,
          previous_status: battery.status,
          new_status: newStatus,
          changed_by: 'current-user', // TODO: Get from auth context
          changed_at: new Date().toISOString(),
          notes
        };
        setStatusHistory([...statusHistory, newHistoryEntry]);
      }
    } catch (err) {
      console.error('Failed to update battery status:', err);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard/batteries');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Batteries
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading battery details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Batteries
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!battery) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Batteries
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Battery not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Batteries
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Battery Details</h1>
            <p className="text-muted-foreground font-mono text-sm">{battery.serial_number}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <IconQrcode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <IconPrinter className="h-4 w-4 mr-2" />
            Print Label
          </Button>
          <Button size="sm" className="w-full sm:w-auto">
            <IconEdit className="h-4 w-4 mr-2" />
            Edit Battery
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 order-2 xl:order-1">
          <Tabs 
            defaultValue="overview" 
            className="space-y-6"
            onValueChange={(value) => {
              // Load diagnostics data when diagnostics tab is selected
              if (value === 'diagnostics' && !diagnostics && !diagnosticsLoading) {
                fetchDiagnostics();
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Battery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBattery className="h-5 w-5" />
                    Battery Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-mono font-medium">{battery.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Brand & Model</p>
                        <p className="font-medium">{battery.brand}</p>
                        {battery.model && <p className="text-sm text-muted-foreground">{battery.model}</p>}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant="outline">{battery.battery_type}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Specifications</p>
                        <p className="font-medium">{battery.voltage}V / {battery.capacity}Ah</p>
                        <p className="text-sm text-muted-foreground">Cell Type: {battery.cell_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">BMS Status</p>
                        <Badge variant={battery.bms_status === 'ok' ? 'default' : 'destructive'}>
                          {battery.bms_status?.toUpperCase()}
                        </Badge>
                      </div>
                      {battery.load_test_result && (
                        <div>
                          <p className="text-sm text-muted-foreground">Load Test Result</p>
                          <p className="font-medium">{battery.load_test_result}% Efficiency</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUser className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-medium">{battery.customer?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Number</p>
                      <p className="font-medium">{battery.customer?.contact || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconClock className="h-5 w-5" />
                    Service Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Received Date</p>
                      <p className="font-medium">
                        {new Date(battery.received_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    {battery.delivered_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Delivered Date</p>
                        <p className="font-medium">
                          {new Date(battery.delivered_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCurrency className="h-5 w-5" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {battery.estimated_cost && (
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Cost</p>
                          <p className="font-medium">₹{battery.estimated_cost.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {battery.final_cost && (
                        <div>
                          <p className="text-sm text-muted-foreground">Final Cost</p>
                          <p className="font-medium text-lg">₹{battery.final_cost.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                    
                    {(battery.parts_cost || battery.labor_cost) && (
                      <div className="space-y-4">
                        {battery.parts_cost && (
                          <div>
                            <p className="text-sm text-muted-foreground">Parts Cost</p>
                            <p className="font-medium">₹{battery.parts_cost.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        {battery.labor_cost && (
                          <div>
                            <p className="text-sm text-muted-foreground">Labor Cost</p>
                            <p className="font-medium">₹{battery.labor_cost.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Repair Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Repair Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Initial Assessment</p>
                    <p className="text-sm bg-muted p-3 rounded">{battery.repair_notes}</p>
                  </div>
                  
                  {battery.technician_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Technician Notes</p>
                      <p className="text-sm bg-muted p-3 rounded">{battery.technician_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diagnostics">
              <BatteryDiagnostics
                batteryId={batteryId}
                initialData={diagnostics ? {
                  total_cells: diagnostics.total_cells,
                  healthy_cells: diagnostics.healthy_cells,
                  weak_cells: diagnostics.weak_cells,
                  dead_cells: diagnostics.dead_cells,
                  ir_threshold: diagnostics.ir_threshold,
                  current_capacity: diagnostics.current_capacity,
                  load_test_current: diagnostics.load_test_current,
                  load_test_duration: diagnostics.load_test_duration,
                  efficiency_rating: diagnostics.efficiency_rating,
                  bms_error_codes: diagnostics.bms_error_codes?.join(', ') || '',
                  balancing_status: diagnostics.balancing_status,
                  test_temperature: diagnostics.test_temperature
                } : undefined}
                onSave={handleDiagnosticsSave}
              />
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Repair History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Detailed repair history will be displayed here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Status Sidebar */}
        <div className="order-1 xl:order-2">
          <BatteryStatusWorkflow
            currentStatus={battery.status}
            batteryId={battery.id}
            onStatusChange={handleStatusChange}
            statusHistory={statusHistory}
          />
        </div>
      </div>
    </div>
  );
}
