'use client';

import React, { useState, useEffect } from 'react';
import { Control } from 'react-hook-form';
import { DynamicBatteryInput } from './dynamic-battery-input';

interface DynamicBatteryInputClientProps {
  control: Control<any>;
  name: string;
  disabled?: boolean;
  className?: string;
}

export function DynamicBatteryInputClient(props: DynamicBatteryInputClientProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-32 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Loading battery input...</p>
        </div>
      </div>
    );
  }

  return <DynamicBatteryInput {...props} />;
}
