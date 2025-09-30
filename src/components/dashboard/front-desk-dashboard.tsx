"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, UserPlus, FilePlus2, AlertTriangle, Clock, CheckCircle, Phone, Wrench } from "lucide-react";
import { globalSearch, type GlobalSearchResults } from "@/lib/api/global-search";
import { useDebounce } from "@/hooks/use-debounce";
import { useDashboardBundle } from "@/hooks/use-dashboard-data";
import { serviceTicketsApi } from "@/lib/api/service-tickets";
import { getCustomerVariant, getTicketVariant } from "./front-desk-helpers";
import { useActivity } from "@/hooks/use-activity";
import type { ActivityItem } from "@/app/api/activity/route";

interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  imageUrl: string;
  publicMetadata: Record<string, any>;
}

export function FrontDeskDashboard({ user }: { user: SerializedUser }) {
  const [q, setQ] = React.useState("");

  // Styling helpers moved to ./front-desk-helpers to avoid TSX parser edge cases
  const userName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : (user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState({
    tickets: [],
    batteries: [],
    customers: [],
  } as GlobalSearchResults);
  const debouncedQ = useDebounce(q, 250);

  // Default content sources
  const bundle = useDashboardBundle();
  const topCustomers = bundle.data?.topCustomers ?? [];

  // Rank existing customers without changing the set
  const rankedTopCustomers = React.useMemo(() => {
    if (!topCustomers || topCustomers.length === 0) return [] as any[];

    // Extract metrics with safe defaults
    const items = topCustomers.map((c: any) => ({
      ...c,
      _revenue: Number(c.total_revenue ?? 0),
      _activity: Number(c.total_batteries ?? 0),
      _recencyDays: c.last_battery_received
        ? Math.max(
            0,
            (Date.now() - new Date(c.last_battery_received).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : Number.POSITIVE_INFINITY
    }));

    const revMin = Math.min(...items.map((i) => i._revenue));
    const revMax = Math.max(...items.map((i) => i._revenue));
    const actMin = Math.min(...items.map((i) => i._activity));
    const actMax = Math.max(...items.map((i) => i._activity));

    // For recency, fewer days is better. We'll invert after normalization
    const recMin = Math.min(...items.map((i) => i._recencyDays));
    const recMax = Math.max(...items.map((i) => i._recencyDays));

    const norm = (v: number, min: number, max: number) =>
      max === min ? 0 : (v - min) / (max - min);

    // Compute composite score
    const scored = items.map((i) => {
      const revenueScore = norm(i._revenue, revMin, revMax);
      const activityScore = norm(i._activity, actMin, actMax);
      // Recency: convert days to a score where 1 = most recent, 0 = oldest
      const recencyRaw = norm(i._recencyDays, recMin, recMax);
      const recencyScore = 1 - (isFinite(recencyRaw) ? recencyRaw : 1);

      const score = 0.6 * revenueScore + 0.3 * activityScore + 0.1 * recencyScore;
      return { ...i, _score: score };
    });

    return scored.sort((a, b) => b._score - a._score);
  }, [topCustomers]);

  const [recentTickets, setRecentTickets] = React.useState(
    [] as { id: string; ticket_number: string; status: string; vehicle_reg_no: string | null; created_at: string; location?: { id: string; name: string; code?: string | null } | null }[]
  );
  const [recentLoading, setRecentLoading] = React.useState(false);

  // Default registered customers (location-scoped)
  const [defaultCustomers, setDefaultCustomers] = React.useState(
    [] as { id: string; name: string; contact: string | null; location?: { id: string; name: string; code?: string | null } | null }[]
  );
  const [defaultCustomersLoading, setDefaultCustomersLoading] = React.useState(false);

  // Fetch recent activity
  const { activities, loading: activitiesLoading, formatTimeAgo } = useActivity(5);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!debouncedQ.trim()) {
        // When there's no search query, clear results and stop loading
        setResults({ tickets: [], batteries: [], customers: [] });
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await globalSearch(debouncedQ);
      if (!cancelled) {
        if (res.success && res.data) setResults(res.data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const hasQuery = debouncedQ.trim().length > 0;

  // Prefetch default recent tickets when no search query
  React.useEffect(() => {
    let cancelled = false;
    const loadRecent = async () => {
      if (hasQuery || recentTickets.length > 0) return;
      setRecentLoading(true);
      const res = await serviceTicketsApi.listTickets({ limit: 20 });
      if (!cancelled) {
        if (res.success && res.data) {
          // Filter to "open-like" statuses
          const openStatuses = new Set([
            'reported',
            'triaged',
            'in_progress',
            'waiting_approval',
            'on_hold'
          ]);
          const filtered = (res.data as any[])
            .filter((t) => openStatuses.has(t.status))
            .slice(0, 8)
            .map((t) => ({
              id: t.id,
              ticket_number: t.ticket_number,
              status: t.status,
              vehicle_reg_no: t.vehicle_reg_no ?? null,
              created_at: t.created_at,
              location: t.location ?? null
            }));
          setRecentTickets(filtered);
        }
        setRecentLoading(false);
      }
    };
    loadRecent();
    return () => {
      cancelled = true;
    };
  }, [hasQuery, recentTickets.length]);

  // Load default registered customers when not searching
  React.useEffect(() => {
    let cancelled = false;
    const loadCustomers = async () => {
      if (hasQuery || defaultCustomers.length > 0) return;
      setDefaultCustomersLoading(true);
      const res = await serviceTicketsApi.listCustomers();
      if (!cancelled) {
        if (res.success && res.data) {
          const rows = (res.data as any[]).map((c) => ({
            id: c.id,
            name: c.name,
            contact: c.contact ?? null,
            location: c.location ?? null
          }));
          setDefaultCustomers(rows);
        }
        setDefaultCustomersLoading(false);
      }
    };
    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [hasQuery, defaultCustomers.length]);

  return (
    <ScrollArea className="h-[calc(100dvh-52px)]">
      <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6">
        {/* Simple header with primary actions for front desk */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hi Front Desk Manager, {userName}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Find customers and job cards quickly. Create a new job card in seconds.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/job-cards/new">
                <FilePlus2 className="mr-2 h-4 w-4" /> New Job Card
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/customers/new">
                <UserPlus className="mr-2 h-4 w-4" /> New Customer
              </Link>
            </Button>
          </div>
        </div>

        {/* Unified quick search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by job card number, customer name/contact, vehicle reg no, battery serial..."
                className="pl-9"
              />
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
              {/* Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Customers <Badge variant="secondary">{hasQuery ? results.customers.length : (defaultCustomers.length || topCustomers.length)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-muted-foreground text-sm">Searching…</div>
                  ) : !hasQuery ? (
                    defaultCustomersLoading ? (
                      <div className="text-muted-foreground text-sm">Loading customers…</div>
                    ) : defaultCustomers.length > 0 ? (
                      <ul className="space-y-2">
                        {defaultCustomers.slice(0, 10).map((c) => {
                          const v = getCustomerVariant(c.id);
                          return (
                            <li key={c.id}>
                              <Link
                                href={`/dashboard/customers/${c.id}`}
                                className={`group relative block rounded-md border ${v.border} p-3 ${v.hover} transition-colors`}
                              >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${v.accent} rounded-l`}></span>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="truncate font-medium">{c.name}</div>
                                      {c.location && (
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          {c.location.code || c.location.name}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground truncate text-xs">{c.contact || ""}</div>
                                  </div>
                                  <div className="text-primary/70 opacity-0 transition-opacity group-hover:opacity-100">Open →</div>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : topCustomers.length > 0 ? (
                      <ul className="space-y-2">
                        {rankedTopCustomers.slice(0, 6).map((c) => {
                          const v = getCustomerVariant(c.id);
                          return (
                            <li key={c.id}>
                              <Link
                                href={`/dashboard/customers/${c.id}`}
                                className={`group relative block rounded-md border ${v.border} p-3 ${v.hover} transition-colors`}
                              >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${v.accent} rounded-l`}></span>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="truncate font-medium">{c.name}</div>
                                      {(c as any).location && (
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          {(c as any).location.code || (c as any).location.name}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground truncate text-xs">{c.contact || ""}</div>
                                  </div>
                                  <div className="text-primary/70 opacity-0 transition-opacity group-hover:opacity-100">Open →</div>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-muted-foreground text-sm">No customers yet</div>
                    )
                  ) : results.customers.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No customers found</div>
                  ) : (
                    <ul className="space-y-2">
                      {results.customers.slice(0, 6).map((c) => {
                      const v = getCustomerVariant(c.id);
                      return (
                        <li key={c.id}>
                          <Link
                            href={`/dashboard/customers/${c.id}`}
                            className={`group relative block rounded-md border ${v.border} p-3 ${v.hover} transition-colors`}
                          >
                            <span className={`absolute left-0 top-0 bottom-0 w-1 ${v.accent} rounded-l`}></span>
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="truncate font-medium">{c.name}</div>
                                  {c.location && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {c.location.code || c.location.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-muted-foreground truncate text-xs">{c.contact || ""}</div>
                              </div>
                              <div className="text-primary/70 opacity-0 transition-opacity group-hover:opacity-100">Open →</div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Job Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Job Cards <Badge variant="secondary">{hasQuery ? results.tickets.length : recentTickets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-muted-foreground text-sm">Searching…</div>
                  ) : !hasQuery ? (
                    recentLoading ? (
                      <div className="text-muted-foreground text-sm">Loading recent job cards…</div>
                    ) : recentTickets.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No recent job cards</div>
                    ) : (
                      <ul className="space-y-2">
                        {recentTickets.map((t) => {
                          const v = getTicketVariant(t.status);
                          const createdDate = new Date((t as any).created_at);
                          const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                          const dateStr = createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                          return (
                            <li key={t.id}>
                              <Link
                                href={`/dashboard/job-cards/${t.id}`}
                                className={`group relative block rounded-md border ${v.border} p-3 ${v.hover} transition-colors`}
                              >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${v.accent} rounded-l`}></span>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="truncate font-mono">
                                        {t.ticket_number} <span className="text-muted-foreground font-normal">• {t.status}</span>
                                      </div>
                                      {t.location && (
                                        <Badge variant="outline" className="text-xs shrink-0">
                                          {t.location.code || t.location.name}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground truncate text-xs">
                                      {t.vehicle_reg_no || ''}
                                      {t.vehicle_reg_no && ' • '}
                                      <span className="font-medium">{dateStr}</span>
                                      <span className="text-xs"> ({daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`})</span>
                                    </div>
                                  </div>
                                  <div className="text-primary/70 opacity-0 transition-opacity group-hover:opacity-100">Open →</div>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : results.tickets.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No job cards found</div>
                  ) : (
                    <ul className="space-y-2">
                      {results.tickets.slice(0, 8).map((t) => {
                      const v = getTicketVariant(t.status);
                      const createdDate = new Date(t.created_at);
                      const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                      const dateStr = createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                      return (
                        <li key={t.id}>
                          <Link
                            href={`/dashboard/job-cards/${t.id}`}
                            className={`group relative block rounded-md border ${v.border} p-3 ${v.hover} transition-colors`}
                          >
                            <span className={`absolute left-0 top-0 bottom-0 w-1 ${v.accent} rounded-l`}></span>
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="truncate font-mono">
                                    {t.ticket_number} <span className="text-muted-foreground font-normal">• {t.status}</span>
                                  </div>
                                  {t.location && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {t.location.code || t.location.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-muted-foreground truncate text-xs">
                                  {t.vehicle_reg_no || ''}
                                  {t.vehicle_reg_no && ' • '}
                                  <span className="font-medium">{dateStr}</span>
                                  <span className="text-xs"> ({daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`})</span>
                                </div>
                              </div>
                              <div className="text-primary/70 opacity-0 transition-opacity group-hover:opacity-100">Open →</div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Priority/Urgent Jobs Indicator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Priority & Urgent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Overdue Jobs */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-800">Overdue</div>
                    <div className="text-xs text-red-600">Past expected date</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700">2</div>
                </div>
              </div>
              
              {/* Waiting Approval more than 3 days */}
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-orange-800">Long Wait</div>
                    <div className="text-xs text-orange-600">Approval &gt; 3 days</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-700">5</div>
                </div>
              </div>
              
              {/* High Value Customers */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800">High Value</div>
                    <div className="text-xs text-blue-600">VIP customers</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">3</div>
                </div>
              </div>
              
              {/* SLA at Risk */}
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-yellow-800">SLA Risk</div>
                    <div className="text-xs text-yellow-600">Due tomorrow</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">4</div>
                </div>
              </div>
            </div>
            
            {/* Quick action to view all priority jobs */}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/job-cards?priority=urgent">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View All Priority Jobs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="text-muted-foreground text-sm py-4">Loading recent activity...</div>
            ) : activities.length === 0 ? (
              <div className="text-muted-foreground text-sm py-4">No recent activity</div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const getIcon = (type: ActivityItem['type']) => {
                    switch (type) {
                      case 'ticket_status':
                        return <CheckCircle className="h-4 w-4 text-green-500" />;
                      case 'customer_created':
                        return <UserPlus className="h-4 w-4 text-blue-500" />;
                      case 'ticket_created':
                        return <FilePlus2 className="h-4 w-4 text-purple-500" />;
                      case 'payment_received':
                        return (
                          <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          </div>
                        );
                      default:
                        return <Wrench className="h-4 w-4 text-gray-500" />;
                    }
                  };

                  const renderContent = () => {
                    switch (activity.type) {
                      case 'ticket_status':
                        return (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/dashboard/job-cards/${activity.metadata?.ticket_id}`}
                              className="font-medium hover:underline"
                            >
                              {activity.metadata?.ticket_number}
                            </Link>
                            <span className="text-muted-foreground">status changed to</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata?.new_status}
                            </Badge>
                          </div>
                        );
                      case 'customer_created':
                        return (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground">New customer:</span>
                            <Link
                              href={`/dashboard/customers/${activity.metadata?.customer_id}`}
                              className="font-medium hover:underline"
                            >
                              {activity.description}
                            </Link>
                          </div>
                        );
                      case 'ticket_created':
                        return (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground">New job card:</span>
                            <Link
                              href={`/dashboard/job-cards/${activity.metadata?.ticket_id}`}
                              className="font-medium hover:underline"
                            >
                              {activity.description}
                            </Link>
                          </div>
                        );
                      default:
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.title}</span>
                          </div>
                        );
                    }
                  };

                  return (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5">{getIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        {renderContent()}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/dashboard/activity">
                  View All Activity
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="h-5 w-5 rounded bg-purple-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded bg-purple-500"></div>
              </div>
              Quick Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Common Battery Types & Prices */}
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Battery Types & Prices</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Lithium 12V 100Ah</span>
                    <span className="font-medium">₹25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lead Acid 12V 150Ah</span>
                    <span className="font-medium">₹12,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LiFePO4 24V 200Ah</span>
                    <span className="font-medium">₹45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AGM 12V 75Ah</span>
                    <span className="font-medium">₹8,500</span>
                  </div>
                </div>
              </div>
              
              {/* Service Time Estimates */}
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Service Time Estimates</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Basic Diagnostics</span>
                    <span className="font-medium">30-45 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cell Replacement</span>
                    <span className="font-medium">2-3 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BMS Repair</span>
                    <span className="font-medium">4-6 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complete Rebuild</span>
                    <span className="font-medium">1-2 days</span>
                  </div>
                </div>
              </div>
              
              {/* Important Contacts */}
              <div>
                <h4 className="font-medium text-sm mb-3 text-slate-700">Important Contacts</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <div className="flex justify-between flex-1">
                      <span>Head Technician</span>
                      <span className="font-medium">+91 98765 43210</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <div className="flex justify-between flex-1">
                      <span>Workshop Manager</span>
                      <span className="font-medium">+91 87654 32109</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <div className="flex justify-between flex-1">
                      <span>Parts Supplier</span>
                      <span className="font-medium">+91 76543 21098</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <div className="flex justify-between flex-1">
                      <span>Emergency Support</span>
                      <span className="font-medium">+91 98765 00000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Warranty Quick Lookup */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm mb-3 text-slate-700">Warranty Periods</h4>
              <div className="grid grid-cols-2 gap-4 text-xs lg:grid-cols-4">
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="font-medium">Lithium</div>
                  <div className="text-muted-foreground">3 years</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="font-medium">Lead Acid</div>
                  <div className="text-muted-foreground">1 year</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="font-medium">LiFePO4</div>
                  <div className="text-muted-foreground">5 years</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="font-medium">AGM</div>
                  <div className="text-muted-foreground">2 years</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick tips */}
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Tip: To create a job card, search/select the customer, then click &ldquo;New Job Card&rdquo;. You can also directly use the New Job Card button above.
          </CardContent>
        </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

