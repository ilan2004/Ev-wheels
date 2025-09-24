'use client';

import React from 'react';
import { BatteryStatusWorkflow } from '@/components/bms/battery-status-workflow';
import { BatteryStatus } from '@/types/bms';

interface StatusPageClientProps {
  currentStatus: BatteryStatus;
  batteryId: string;
}

export function StatusPageClient({ currentStatus, batteryId }: StatusPageClientProps) {
  const handleStatusChange = async () => {
    // TODO: integrate with backend route to update status
    // This stays on the client and can call a server action or /api route
  };

  return (
    <BatteryStatusWorkflow
      currentStatus={currentStatus}
      batteryId={batteryId}
      onStatusChange={handleStatusChange}
      statusHistory={[]}
    />
  );
}
