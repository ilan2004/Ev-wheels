'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanVehicleCard } from './kanban-vehicle-card';
import { cn } from '@/lib/utils';
import type { VehicleCase, VehicleStatus } from '@/lib/types/service-tickets';
import { vehiclesApi } from '@/lib/api/vehicles';
import { toast } from 'sonner';
import {
  Package,
  Wrench,
  Search,
  CheckCircle,
  Truck,
  PauseCircle,
  XCircle,
} from 'lucide-react';

interface VehicleWithCustomer extends VehicleCase {
  customer?: {
    id: string;
    name: string;
    contact?: string;
  };
  technician?: {
    id: string;
    name: string;
    email: string;
  };
  thumbnail_url?: string | null;
}

interface VehicleKanbanBoardProps {
  vehicles: VehicleWithCustomer[];
  loading?: boolean;
  onStatusChange?: (vehicleId: string, newStatus: VehicleStatus) => void;
}

interface StatusColumn {
  id: VehicleStatus;
  title: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusColumns: StatusColumn[] = [
  {
    id: 'received',
    title: 'Received',
    color: 'from-blue-50 via-blue-50/80 to-white border-blue-300 hover:border-blue-400',
    icon: Package,
  },
  {
    id: 'diagnosed',
    title: 'Diagnosed',
    color: 'from-purple-50 via-purple-50/80 to-white border-purple-300 hover:border-purple-400',
    icon: Search,
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'from-amber-50 via-yellow-50/80 to-white border-yellow-400 hover:border-yellow-500',
    icon: Wrench,
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'from-emerald-50 via-green-50/80 to-white border-green-400 hover:border-green-500',
    icon: CheckCircle,
  },
  {
    id: 'delivered',
    title: 'Delivered',
    color: 'from-gray-50 via-gray-50/80 to-white border-gray-300 hover:border-gray-400',
    icon: Truck,
  },
  {
    id: 'on_hold',
    title: 'On Hold',
    color: 'from-red-50 via-orange-50/80 to-white border-red-300 hover:border-red-400',
    icon: PauseCircle,
  },
];

// Sortable wrapper for kanban cards
function SortableKanbanCard({ vehicle }: { vehicle: VehicleWithCustomer }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vehicle.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanVehicleCard
        vehicle={vehicle}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// Loading skeleton for kanban board
function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
      {statusColumns.map((column) => (
        <Card key={column.id} className="h-[600px] bg-gradient-to-b from-muted/30 to-background">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-10 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function VehicleKanbanBoard({
  vehicles,
  loading,
  onStatusChange,
}: VehicleKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Group vehicles by status
  const vehiclesByStatus = React.useMemo(() => {
    const grouped: Record<VehicleStatus, VehicleWithCustomer[]> = {
      received: [],
      diagnosed: [],
      in_progress: [],
      completed: [],
      delivered: [],
      on_hold: [],
      cancelled: [],
    };

    vehicles.forEach((vehicle) => {
      if (grouped[vehicle.status]) {
        grouped[vehicle.status].push(vehicle);
      }
    });

    return grouped;
  }, [vehicles]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const vehicleId = active.id as string;
    const newStatus = over.id as VehicleStatus;
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    if (!vehicle || vehicle.status === newStatus) return;

    // Optimistic update
    if (onStatusChange) {
      onStatusChange(vehicleId, newStatus);
    }

    // API update
    setIsUpdating(true);
    try {
      const response = await vehiclesApi.updateVehicleStatus(
        vehicleId,
        newStatus,
        `Status changed from ${vehicle.status} to ${newStatus} via kanban board`
      );

      if (response.success) {
        toast.success('Vehicle status updated successfully');
      } else {
        toast.error('Failed to update vehicle status');
        // Revert optimistic update
        if (onStatusChange) {
          onStatusChange(vehicleId, vehicle.status);
        }
      }
    } catch (error) {
      toast.error('Failed to update vehicle status');
      // Revert optimistic update
      if (onStatusChange) {
        onStatusChange(vehicleId, vehicle.status);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const activeVehicle = activeId
    ? vehicles.find((v) => v.id === activeId)
    : null;

  if (loading) {
    return <KanbanSkeleton />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 pb-6">
        {statusColumns.map((column) => {
          const Icon = column.icon;
          const columnVehicles = vehiclesByStatus[column.id] || [];
          const isActiveColumn = activeId && columnVehicles.some(v => v.id === activeId);

          return (
            <SortableContext
              key={column.id}
              items={columnVehicles.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
              id={column.id}
            >
              <Card
                className={cn(
                  "h-[calc(100vh-300px)] min-h-[500px] max-h-[900px] flex flex-col",
                  "bg-gradient-to-b shadow-sm hover:shadow-md transition-all duration-300",
                  "border-2",
                  column.color,
                  isUpdating && "opacity-75",
                  isActiveColumn && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm sticky top-0 z-10 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        "bg-background/80 shadow-sm"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{column.title}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {columnVehicles.length === 0 ? 'Empty' : 
                           columnVehicles.length === 1 ? '1 vehicle' : 
                           `${columnVehicles.length} vehicles`}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={columnVehicles.length > 5 ? "destructive" : "secondary"} 
                      className="h-6 min-w-[28px] text-xs font-bold"
                    >
                      {columnVehicles.length}
                    </Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1 px-3 pb-3">
                  <div className="space-y-3 pt-3">
                    {columnVehicles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="rounded-full bg-muted/50 p-4 mb-3">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No vehicles</p>
                        <p className="text-xs text-muted-foreground mt-1">Drag vehicles here</p>
                      </div>
                    ) : (
                      columnVehicles.map((vehicle) => (
                        <SortableKanbanCard
                          key={vehicle.id}
                          vehicle={vehicle}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                {/* Drop zone indicator */}
                <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Card>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeVehicle ? (
          <div className="animate-in zoom-in-95 duration-200">
            <KanbanVehicleCard vehicle={activeVehicle} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
