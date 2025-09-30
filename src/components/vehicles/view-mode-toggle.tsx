'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { LayoutGrid, Table, List } from 'lucide-react';

export type ViewMode = 'grid' | 'table' | 'compact';

interface ViewModeToggleProps {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
}

const viewModeConfig = {
  grid: {
    icon: LayoutGrid,
    label: 'Grid View',
    tooltip: 'Show vehicles in a grid layout'
  },
  table: {
    icon: Table,
    label: 'Table View',
    tooltip: 'Show vehicles in a detailed table'
  },
  compact: {
    icon: List,
    label: 'Compact View',
    tooltip: 'Show vehicles in a compact list'
  }
};

export function ViewModeToggle({ value, onValueChange }: ViewModeToggleProps) {
  return (
    <TooltipProvider>
      <ToggleGroup
        type='single'
        value={value}
        onValueChange={(newValue) => {
          if (newValue) onValueChange(newValue as ViewMode);
        }}
        className='bg-muted/50'
      >
        {(
          Object.entries(viewModeConfig) as [
            ViewMode,
            (typeof viewModeConfig)[ViewMode]
          ][]
        ).map(([mode, config]) => {
          const Icon = config.icon;
          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={mode}
                  aria-label={config.label}
                  className='data-[state=on]:bg-background data-[state=on]:shadow-sm'
                >
                  <Icon className='h-4 w-4' />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ToggleGroup>
    </TooltipProvider>
  );
}
