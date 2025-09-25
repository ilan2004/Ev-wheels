'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  IconClockCheck,
  IconArrowRight,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
  IconPackage,
  IconTruck
} from '@tabler/icons-react';
import { BatteryStatus, BatteryStatusHistory } from '@/types/bms';

interface BatteryStatusWorkflowProps {
  currentStatus: BatteryStatus;
  batteryId: string;
  onStatusChange: (newStatus: BatteryStatus, notes: string) => void;
  statusHistory?: BatteryStatusHistory[];
}

// Define valid status transitions
const statusTransitions: Record<BatteryStatus, BatteryStatus[]> = {
  [BatteryStatus.RECEIVED]: [BatteryStatus.DIAGNOSED, BatteryStatus.CANCELLED],
  [BatteryStatus.DIAGNOSED]: [BatteryStatus.IN_PROGRESS, BatteryStatus.ON_HOLD, BatteryStatus.CANCELLED],
  [BatteryStatus.IN_PROGRESS]: [BatteryStatus.COMPLETED, BatteryStatus.ON_HOLD, BatteryStatus.CANCELLED],
  [BatteryStatus.ON_HOLD]: [BatteryStatus.IN_PROGRESS, BatteryStatus.CANCELLED],
  [BatteryStatus.COMPLETED]: [BatteryStatus.DELIVERED],
  [BatteryStatus.DELIVERED]: [], // Final status
  [BatteryStatus.CANCELLED]: [] // Final status
};

const getStatusIcon = (status: BatteryStatus) => {
  switch (status) {
    case BatteryStatus.RECEIVED: return <IconPackage className="h-4 w-4" />;
    case BatteryStatus.DIAGNOSED: return <IconClockCheck className="h-4 w-4" />;
    case BatteryStatus.IN_PROGRESS: return <IconPlayerPlay className="h-4 w-4" />;
    case BatteryStatus.COMPLETED: return <IconCheck className="h-4 w-4" />;
    case BatteryStatus.DELIVERED: return <IconTruck className="h-4 w-4" />;
    case BatteryStatus.ON_HOLD: return <IconPlayerPause className="h-4 w-4" />;
    case BatteryStatus.CANCELLED: return <IconX className="h-4 w-4" />;
  }
};

const getStatusColor = (status: BatteryStatus): string => {
  switch (status) {
    case BatteryStatus.RECEIVED: return 'bg-blue-500';
    case BatteryStatus.DIAGNOSED: return 'bg-yellow-500';
    case BatteryStatus.IN_PROGRESS: return 'bg-orange-500';
    case BatteryStatus.COMPLETED: return 'bg-green-500';
    case BatteryStatus.DELIVERED: return 'bg-gray-500';
    case BatteryStatus.CANCELLED: return 'bg-red-500';
    case BatteryStatus.ON_HOLD: return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const formatStatusLabel = (status: BatteryStatus): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusDescription = (status: BatteryStatus): string => {
  switch (status) {
    case BatteryStatus.RECEIVED: return 'Battery has been received and logged into the system';
    case BatteryStatus.DIAGNOSED: return 'Initial diagnosis completed, repair plan established';
    case BatteryStatus.IN_PROGRESS: return 'Repair work is actively being performed';
    case BatteryStatus.COMPLETED: return 'All repair work has been completed and tested';
    case BatteryStatus.DELIVERED: return 'Battery has been delivered back to customer';
    case BatteryStatus.ON_HOLD: return 'Work is temporarily paused (awaiting parts, customer decision, etc.)';
    case BatteryStatus.CANCELLED: return 'Service request has been cancelled';
    default: return '';
  }
};

export function BatteryStatusWorkflow({ 
  currentStatus, 
  batteryId, 
  onStatusChange, 
  statusHistory = [] 
}: BatteryStatusWorkflowProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BatteryStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableTransitions = statusTransitions[currentStatus] || [];

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) return;

    setIsLoading(true);
    try {
      await onStatusChange(selectedStatus as BatteryStatus, notes);
      setIsDialogOpen(false);
      setSelectedStatus('');
      setNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setSelectedStatus('');
    setNotes('');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Status</span>
            {availableTransitions.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <IconArrowRight className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Battery Status</DialogTitle>
                    <DialogDescription>
                      Change the current status of this battery and add optional notes.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-status">New Status</Label>
                      <Select onValueChange={(value) => setSelectedStatus(value as BatteryStatus)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTransitions.map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(status)}
                                {formatStatusLabel(status)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedStatus && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {getStatusDescription(selectedStatus as BatteryStatus)}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="status-notes">Notes (Optional)</Label>
                      <Textarea
                        id="status-notes"
                        placeholder="Add any relevant notes about this status change..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleStatusChange}
                      disabled={!selectedStatus || isLoading}
                    >
                      {isLoading ? 'Updating...' : 'Update Status'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getStatusColor(currentStatus)}`}>
              <div className="text-white">
                {getStatusIcon(currentStatus)}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-sm">
                  {formatStatusLabel(currentStatus)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getStatusDescription(currentStatus)}
              </p>
            </div>
          </div>

          {availableTransitions.length === 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This battery has reached a final status. No further status changes are available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Status Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            {[
              BatteryStatus.RECEIVED,
              BatteryStatus.DIAGNOSED,
              BatteryStatus.IN_PROGRESS,
              BatteryStatus.COMPLETED,
              BatteryStatus.DELIVERED
            ].map((status, index, array) => {
              const isCompleted = statusHistory.some(h => h.new_status === status) || currentStatus === status;
              const isCurrent = currentStatus === status;
              const isLast = index === array.length - 1;

              return (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCurrent 
                          ? getStatusColor(status)
                          : isCompleted 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                      }`}
                    >
                      <div className="text-white text-xs">
                        {isCompleted && !isCurrent ? (
                          <IconCheck className="h-4 w-4" />
                        ) : (
                          getStatusIcon(status)
                        )}
                      </div>
                    </div>
                    <span className={`text-xs text-center ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                      {formatStatusLabel(status)}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusHistory.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${getStatusColor(entry.new_status)}`}>
                    <div className="text-white">
                      {getStatusIcon(entry.new_status)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{formatStatusLabel(entry.new_status)}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {entry.previous_status && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Changed from {formatStatusLabel(entry.previous_status)}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-sm bg-muted p-2 rounded">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
