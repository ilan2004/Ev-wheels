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
import { BatteryRecord, BatteryStatus, BatteryStatusHistory, BatteryType, CellType } from '@/types/bms';
import { BatteryStatusWorkflow } from './battery-status-workflow';

interface BatteryDetailsProps {
  batteryId: string;
}

// Mock data - replace with actual API call
const mockBattery: BatteryRecord = {
  id: '1',
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
  technician_notes: 'Customer reported reduced range. Initial testing shows cell imbalance.',
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

const mockStatusHistory: BatteryStatusHistory[] = [
  {
    id: 'hist-1',
    battery_id: '1',
    previous_status: BatteryStatus.RECEIVED,
    new_status: BatteryStatus.DIAGNOSED,
    changed_by: 'user-1',
    changed_at: '2025-07-30T10:00:00Z',
    notes: 'Initial diagnosis completed. Cell imbalance detected, BMS functioning normally.'
  },
  {
    id: 'hist-2',
    battery_id: '1',
    previous_status: BatteryStatus.DIAGNOSED,
    new_status: BatteryStatus.IN_PROGRESS,
    changed_by: 'user-1',
    changed_at: '2025-07-31T09:00:00Z',
    notes: 'Started cell balancing procedure.'
  },
  {
    id: 'hist-3',
    battery_id: '1',
    previous_status: BatteryStatus.IN_PROGRESS,
    new_status: BatteryStatus.COMPLETED,
    changed_by: 'user-1',
    changed_at: '2025-08-06T16:30:00Z',
    notes: 'Cell balancing completed. Load test passed at 85% efficiency. Ready for delivery.'
  }
];

export function BatteryDetails({ batteryId }: BatteryDetailsProps) {
  const router = useRouter();
  const [battery, setBattery] = useState<BatteryRecord | null>(null);
  const [statusHistory, setStatusHistory] = useState<BatteryStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchBattery = async () => {
      setIsLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setBattery(mockBattery);
      setStatusHistory(mockStatusHistory);
      setIsLoading(false);
    };

    fetchBattery();
  }, [batteryId]);

  const handleStatusChange = async (newStatus: BatteryStatus, notes: string) => {
    if (!battery) return;

    // TODO: Replace with actual API call
    console.log('Updating status:', { batteryId, newStatus, notes });
    
    // Update local state
    const updatedBattery = { ...battery, status: newStatus };
    setBattery(updatedBattery);

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
          <Tabs defaultValue="overview" className="space-y-6">
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
              <Card>
                <CardHeader>
                  <CardTitle>Technical Diagnostics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Diagnostics data will be displayed here once implemented.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
