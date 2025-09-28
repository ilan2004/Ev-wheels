"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Car,
  FileText,
  Wrench,
  CheckCircle2,
  Package,
  Clock,
  XCircle,
  ArrowRight,
  Info,
  AlertTriangle,
  Loader2,
  Timer,
  Calendar,
  User,
  Zap,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { VehicleStatus, VehicleCase } from "@/lib/api/vehicles";

// Status configuration with enhanced metadata
const STATUS_CONFIG: Record<VehicleStatus, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  stage: number;
  estimatedDays: number;
  nextActions: string[];
  requirements?: string[];
}> = {
  received: {
    label: "Received",
    description: "Vehicle has been received and logged into the system",
    icon: Car,
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    stage: 1,
    estimatedDays: 1,
    nextActions: ["Perform initial inspection", "Document vehicle condition", "Assign technician"],
    requirements: ["Customer information complete", "Vehicle intake photos"]
  },
  diagnosed: {
    label: "Diagnosed", 
    description: "Initial diagnosis completed, issues identified",
    icon: FileText,
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    stage: 2,
    estimatedDays: 2,
    nextActions: ["Create repair estimate", "Source required parts", "Schedule repair work"],
    requirements: ["Diagnostic report complete", "Customer approval for inspection"]
  },
  in_progress: {
    label: "In Progress",
    description: "Repair work is actively underway",
    icon: Wrench,
    color: "text-orange-700", 
    bgColor: "bg-orange-50 border-orange-200",
    stage: 3,
    estimatedDays: 5,
    nextActions: ["Continue repair work", "Update customer on progress", "Quality checks"],
    requirements: ["Parts available", "Customer approval for repairs", "Technician assigned"]
  },
  completed: {
    label: "Completed",
    description: "All repair work has been completed successfully",
    icon: CheckCircle2,
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200", 
    stage: 4,
    estimatedDays: 7,
    nextActions: ["Final quality inspection", "Prepare for delivery", "Contact customer"],
    requirements: ["All repairs completed", "Quality check passed", "Final invoice ready"]
  },
  delivered: {
    label: "Delivered",
    description: "Vehicle has been delivered back to customer",
    icon: Package,
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
    stage: 5,
    estimatedDays: 8,
    nextActions: ["Close case", "Follow up with customer", "Archive documentation"],
    requirements: ["Customer pickup completed", "Payment processed", "Handover documentation"]
  },
  on_hold: {
    label: "On Hold",
    description: "Work paused pending approval, parts, or customer response",
    icon: Clock,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200",
    stage: 0,
    estimatedDays: 0,
    nextActions: ["Resolve blocking issue", "Contact customer if needed", "Resume work when ready"],
    requirements: ["Issue resolution", "Customer response", "Parts availability"]
  },
  cancelled: {
    label: "Cancelled",
    description: "Service request has been cancelled",
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    stage: 0,
    estimatedDays: 0,
    nextActions: ["Process cancellation", "Handle any partial work", "Update customer"],
    requirements: ["Cancellation reason documented", "Partial work invoiced", "Customer notified"]
  },
};

const STATUS_FLOW: VehicleStatus[] = ["received", "diagnosed", "in_progress", "completed", "delivered"];

// Helper function to render status icons
const renderStatusIcon = (status: VehicleStatus, className?: string) => {
  const iconProps = { className };
  switch (status) {
    case "received":
      return <Car {...iconProps} />;
    case "diagnosed":
      return <FileText {...iconProps} />;
    case "in_progress":
      return <Wrench {...iconProps} />;
    case "completed":
      return <CheckCircle2 {...iconProps} />;
    case "delivered":
      return <Package {...iconProps} />;
    case "on_hold":
      return <Clock {...iconProps} />;
    case "cancelled":
      return <XCircle {...iconProps} />;
    default:
      return <Car {...iconProps} />;
  }
};

interface EnhancedStatusWorkflowProps {
  vehicle: VehicleCase;
  onStatusChange: (newStatus: VehicleStatus, notes?: string) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
}

export function EnhancedStatusWorkflow({
  vehicle,
  onStatusChange,
  isUpdating = false,
  className
}: EnhancedStatusWorkflowProps) {
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const currentConfig = STATUS_CONFIG[vehicle.status];
  const currentStageIndex = STATUS_FLOW.indexOf(vehicle.status);
  const progress = currentStageIndex >= 0 ? ((currentStageIndex + 1) / STATUS_FLOW.length) * 100 : 0;

  // Calculate days in current status
  const daysInStatus = vehicle.updated_at 
    ? differenceInDays(new Date(), new Date(vehicle.updated_at))
    : 0;

  // Determine if status is overdue
  const isOverdue = daysInStatus > currentConfig.estimatedDays;

  // Get available status transitions
  const getAvailableTransitions = (): VehicleStatus[] => {
    const current = vehicle.status;
    const transitions: VehicleStatus[] = [];

    // Always allow on_hold and cancelled from any status (except delivered)
    if (current !== "delivered") {
      if (current !== "on_hold") transitions.push("on_hold");
      if (current !== "cancelled") transitions.push("cancelled");
    }

    // Allow backward movement (except from delivered)
    if (current !== "delivered" && currentStageIndex > 0) {
      transitions.push(STATUS_FLOW[currentStageIndex - 1]);
    }

    // Allow forward movement
    if (currentStageIndex >= 0 && currentStageIndex < STATUS_FLOW.length - 1) {
      transitions.push(STATUS_FLOW[currentStageIndex + 1]);
    }

    // Resume from on_hold - allow any forward status
    if (current === "on_hold") {
      STATUS_FLOW.forEach(status => {
        if (!transitions.includes(status)) transitions.push(status);
      });
    }

    return transitions.filter(status => status !== current);
  };

  const handleStatusClick = (newStatus: VehicleStatus) => {
    setSelectedStatus(newStatus);
    setNotes("");
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedStatus) return;
    
    try {
      await onStatusChange(selectedStatus, notes || undefined);
      setShowConfirmDialog(false);
      setSelectedStatus(null);
      setNotes("");
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const StatusTimeline = () => (
    <div className="flex items-center justify-between mb-6">
      {STATUS_FLOW.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const isCurrent = vehicle.status === status;
        const isPassed = currentStageIndex > index;
        
        return (
          <div key={status} className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isPassed && "border-green-500 bg-green-500 text-white",
                    !isCurrent && !isPassed && "border-muted-foreground/30 bg-muted text-muted-foreground"
                  )}>
                    {renderStatusIcon(status, "w-5 h-5")}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Est. {config.estimatedDays} days
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {index < STATUS_FLOW.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-2 transition-all",
                isPassed ? "bg-green-500" : "bg-muted-foreground/30"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Vehicle Repair Workflow
            </CardTitle>
            <CardDescription>
              Track the progress of vehicle diagnosis and repair work
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">Overall Progress</div>
            <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Timeline */}
        <StatusTimeline />

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Repair Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Status Info */}
        <div className={cn(
          "p-4 rounded-lg border-2 transition-all",
          currentConfig.bgColor,
          isOverdue && "ring-2 ring-yellow-400"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {renderStatusIcon(vehicle.status, cn("w-6 h-6", currentConfig.color))}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{currentConfig.label}</h3>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {daysInStatus} days
                  </Badge>
                  {isOverdue && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentConfig.description}
                </p>
              </div>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Est. {currentConfig.estimatedDays} days
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Since {format(new Date(vehicle.updated_at), 'MMM dd')}
              </div>
            </div>
          </div>

          {isOverdue && (
            <Alert className="mt-3 border-yellow-400 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                This status is taking longer than expected. Consider reviewing progress or updating the customer.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Next Actions */}
        {currentConfig.nextActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Recommended Next Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentConfig.nextActions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {action}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {currentConfig.requirements && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Requirements for This Status
            </h4>
            <div className="space-y-1">
              {currentConfig.requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {req}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Status Actions */}
        <div className="space-y-4">
          <h4 className="font-medium">Change Status</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {getAvailableTransitions().map((status) => {
              const config = STATUS_CONFIG[status];
              const isAdvancing = STATUS_FLOW.indexOf(status) > currentStageIndex;
              
              return (
                <TooltipProvider key={status}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusClick(status)}
                        disabled={isUpdating}
                        className={cn(
                          "flex flex-col items-center gap-2 h-auto p-3 transition-all",
                          "hover:shadow-md",
                          config.bgColor.replace('bg-', 'hover:bg-'),
                          isAdvancing && "border-green-300 hover:border-green-400"
                        )}
                      >
                        {renderStatusIcon(status, cn("w-5 h-5", config.color))}
                        <span className="text-xs font-medium">{config.label}</span>
                        {isAdvancing && <ArrowRight className="w-3 h-3 text-green-600" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-48">
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Technician Notes Section */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <User className="w-4 h-4" />
            Technician Notes
          </h4>
          <Textarea
            placeholder="Add notes about current status, findings, or next steps..."
            value={vehicle.technician_notes || ""}
            className="min-h-[80px]"
            readOnly
          />
          {vehicle.technician_notes && (
            <p className="text-xs text-muted-foreground">
              Last updated: {formatDistanceToNow(new Date(vehicle.updated_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </CardContent>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStatus && (
                <>
                  {renderStatusIcon(selectedStatus, "w-5 h-5")}
                  Change Status to {STATUS_CONFIG[selectedStatus]?.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedStatus && STATUS_CONFIG[selectedStatus]?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedStatus && (
            <div className="space-y-4">
              {/* Status Impact */}
              <div className={cn("p-3 rounded-lg border", STATUS_CONFIG[selectedStatus].bgColor)}>
                <h4 className="font-medium mb-2">What happens next:</h4>
                <ul className="space-y-1 text-sm">
                  {STATUS_CONFIG[selectedStatus].nextActions.map((action, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Add Notes (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Document why you're making this change, any findings, or next steps..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={isUpdating}
              className="min-w-[100px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Change"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
