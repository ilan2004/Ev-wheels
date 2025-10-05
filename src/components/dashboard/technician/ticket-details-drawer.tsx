'use client';

import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceTicketsApi } from "@/lib/api/service-tickets";
import { CombinedStatus } from "@/components/ui/status-pills";
import { Badge } from "@/components/ui/badge";
import { formatDashboardDate } from "@/lib/dashboard-utils";
import { IconExternalLink, IconPlayerPlay, IconCircleCheck, IconPlayerPause, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

export function TicketDetailsDrawer({
  ticketId,
  open,
  onOpenChange
}: {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["service-tickets", "detail", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await serviceTicketsApi.fetchTicketWithRelations(ticketId);
      if (!res.success) throw new Error(res.error || "Failed to load ticket");
      return res.data;
    },
    enabled: !!ticketId
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, note }: { status: any; note?: string }) => {
      if (!ticketId) return;
      const res = await serviceTicketsApi.updateTicketStatus(ticketId, status, note);
      if (!res.success) throw new Error(res.error || "Failed to update");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update status")
  });

  const t = data?.ticket as any;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] sm:w-[540px] lg:w-[600px] xl:max-w-2xl overflow-y-auto p-0 max-h-screen">
        <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle className="text-lg sm:text-xl font-semibold">Job Details</SheetTitle>
              <SheetDescription className="hidden sm:block">Quick overview and actions for this service ticket</SheetDescription>
            </div>
            {/* Mobile close button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="sm:hidden h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <IconX className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </SheetHeader>

        {!t && isLoading && (
          <div className="px-4 sm:px-6 py-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}

        {t && (
          <div className="px-4 sm:px-6 py-6 space-y-6">
            {/* Ticket Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border gap-3 sm:gap-4">
              <div className="space-y-1 flex-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ticket Number</div>
                <div className="text-lg sm:text-xl font-bold">{t.ticket_number || t.id}</div>
              </div>
              <div className="self-start sm:self-center">
                <CombinedStatus status={t.status} priority={t.priority as any} />
              </div>
            </div>

            {/* Job Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</div>
                <div className="text-sm font-medium">{formatDashboardDate(new Date(t.created_at))}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Updated</div>
                <div className="text-sm font-medium">{formatDashboardDate(new Date(t.updated_at))}</div>
              </div>
              {t.location?.name && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</div>
                  <div className="text-sm font-medium">{t.location?.name}</div>
                </div>
              )}
              {t.vehicle_reg_no && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vehicle Reg</div>
                  <div><Badge variant="outline" className="font-mono">{t.vehicle_reg_no}</Badge></div>
                </div>
              )}
              {t.due_date && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</div>
                  <div className="text-sm font-medium">{new Date(t.due_date).toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Complaint Details */}
            <div className="p-3 sm:p-4 bg-muted/20 rounded-lg border-l-4 border-l-orange-500">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Complaint</div>
              <div className="text-sm font-medium leading-relaxed">{t.symptom}</div>
              {t.description && (
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.description}</div>
              )}
            </div>

            {/* Customer Information */}
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Customer</div>
              <div className="text-sm font-semibold">{t.customer?.name || 'No customer assigned'}</div>
              {t.customer?.contact && (
                <div className="text-sm text-muted-foreground font-mono">{t.customer.contact}</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</div>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href={`/dashboard/tickets/${t.id}`}>
                    <IconExternalLink className="mr-2 h-4 w-4" /> Open Full Ticket Details
                  </Link>
                </Button>

                {(t.status === 'reported' || t.status === 'triaged') && (
                  <Button onClick={() => updateStatus.mutate({ status: 'in_progress' })} size="sm" className="justify-start">
                    <IconPlayerPlay className="mr-2 h-4 w-4" /> Start Working on This Job
                  </Button>
                )}

                {t.status === 'in_progress' && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => updateStatus.mutate({ status: 'on_hold' })} size="sm" className="flex-1">
                      <IconPlayerPause className="mr-2 h-4 w-4" /> Put On Hold
                    </Button>
                    <Button variant="default" onClick={() => updateStatus.mutate({ status: 'completed' })} size="sm" className="flex-1">
                      <IconCircleCheck className="mr-2 h-4 w-4" /> Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Related Cases */}
            {(t.vehicle_case_id || t.battery_case_id) && (
              <div className="space-y-3 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Related Cases</div>
                <div className="grid grid-cols-1 gap-3">
                  {t.vehicle_case_id && (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vehicle Case</div>
                        <div className="text-sm font-semibold">Case #{t.vehicle_case_id.slice(-6)}</div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/vehicles/${t.vehicle_case_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  )}
                  {t.battery_case_id && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Battery Case</div>
                        <div className="text-sm font-semibold">Case #{t.battery_case_id.slice(-6)}</div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/batteries/${t.battery_case_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

