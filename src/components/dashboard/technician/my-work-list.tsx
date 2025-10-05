'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceTicketsApi } from "@/lib/api/service-tickets";
import { CombinedStatus } from "@/components/ui/status-pills";
import { formatDashboardDate } from "@/lib/dashboard-utils";
import { IconPlayerPlay, IconCircleCheck, IconPlayerPause } from "@tabler/icons-react";
import { toast } from "sonner";

const OPEN_STATUSES = new Set([
  "triaged",
  "in_progress",
  "on_hold",
  "waiting_approval"
]);

export function MyWorkList({ onSelect }: { onSelect: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["service-tickets", "my-work"],
    queryFn: async () => {
      const res = await serviceTicketsApi.listTickets({ limit: 30 });
      if (!res.success) throw new Error(res.error || "Failed to load my work");
      return (res.data || []).filter((t: any) => OPEN_STATUSES.has(t.status));
    },
    staleTime: 15_000
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: any; note?: string }) => {
      const res = await serviceTicketsApi.updateTicketStatus(id, status, note);
      if (!res.success) throw new Error(res.error || "Failed to update");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["service-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["service-tickets", "my-work"] });
      queryClient.invalidateQueries({ queryKey: ["service-tickets", "inbox"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to update status");
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">My Work</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="self-start sm:self-auto">
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-40 rounded bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted" />
                </div>
                <div className="mt-2 h-3 w-56 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="text-sm text-destructive">Failed to load. Try again.</div>
        )}
        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="text-sm text-muted-foreground">No active jobs right now.</div>
        )}
        {!isLoading && !isError && data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((t: any) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(t.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(t.id)}
                className="rounded border p-3 sm:p-4 outline-none transition-all duration-200 hover:bg-muted focus:ring-2 focus:ring-ring active:scale-[0.98] touch-manipulation cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {t.ticket_number || t.id}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDashboardDate(new Date(t.updated_at))}
                    </span>
                  </div>
                  <CombinedStatus status={t.status} priority={t.priority as any} variant="compact" />
                </div>
                <div className="mt-1 truncate text-sm text-muted-foreground">{t.symptom}</div>
                <div className="mt-3 space-y-2">
                  {/* Mobile: Stack info and actions */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {t.vehicle_reg_no && <Badge variant="outline" className="text-xs">{t.vehicle_reg_no}</Badge>}
                    {t.location?.code && <Badge variant="secondary" className="text-xs">{t.location.code}</Badge>}
                    {t.due_date && (
                      <span title="Due date" className="bg-muted px-2 py-1 rounded text-xs">
                        Due: {new Date(t.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons - mobile optimized */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(t.status === "reported" || t.status === "triaged") && (
                      <Button
                        size="sm"
                        className="min-h-[36px] flex-1 sm:flex-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ id: t.id, status: "in_progress" });
                        }}
                      >
                        <IconPlayerPlay className="mr-1 h-4 w-4" /> Start
                      </Button>
                    )}
                    
                    {t.status === "in_progress" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[36px] flex-1 sm:flex-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({ id: t.id, status: "on_hold" });
                          }}
                        >
                          <IconPlayerPause className="mr-1 h-4 w-4" /> Hold
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="min-h-[36px] flex-1 sm:flex-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({ id: t.id, status: "completed" });
                          }}
                        >
                          <IconCircleCheck className="mr-1 h-4 w-4" /> Complete
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      asChild 
                      size="sm" 
                      variant="outline" 
                      className="min-h-[36px] flex-1 sm:flex-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/dashboard/tickets/${t.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

