'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { serviceTicketsApi } from "@/lib/api/service-tickets";
import { CombinedStatus } from "@/components/ui/status-pills";
import { formatDashboardDate } from "@/lib/dashboard-utils";
import { IconArrowRight, IconInbox } from "@tabler/icons-react";

export function InboxList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["service-tickets", "inbox"],
    queryFn: async () => {
      const res = await serviceTicketsApi.listTickets({ status: "reported", limit: 20 });
      if (!res.success) throw new Error(res.error || "Failed to load inbox");
      return res.data || [];
    },
    staleTime: 30_000
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <IconInbox className="h-5 w-5" />
          <CardTitle className="text-lg font-semibold">New & Untriaged</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="self-start sm:self-auto">
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
                <div className="mt-2 h-3 w-48 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="text-sm text-destructive">Failed to load. Try again.</div>
        )}
        {!isLoading && !isError && (!data || data.length === 0) && (
<div className="text-sm text-muted-foreground">You&apos;re all caught up.</div>
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
                      {formatDashboardDate(new Date(t.created_at))}
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
                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none min-h-[36px]">
                      <Link href={`/dashboard/tickets/${t.id}`}>Open</Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="flex-1 sm:flex-none min-h-[36px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/dashboard/tickets/${t.id}`;
                      }}
                    >
                      Triage
                      <IconArrowRight className="ml-1 h-4 w-4" />
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

