import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { scopeQueryServer } from '@/lib/location/scope.server';
import {
  isCurrentUserAdmin,
  getCurrentUserRole
} from '@/lib/location/admin-check';

export interface ActivityItem {
  id: string;
  type:
    | 'ticket_status'
    | 'customer_created'
    | 'payment_received'
    | 'ticket_created';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const isAdmin = await isCurrentUserAdmin();
    const role = await getCurrentUserRole();
    const isFrontDesk = role === 'front_desk_manager';

    // Fetch recent ticket status changes from history
    let ticketHistoryQuery = supabase
      .from('service_ticket_history')
      .select(
        `
        id,
        ticket_id,
        action,
        changed_at,
        new_values,
        previous_values,
        service_tickets!inner(ticket_number, location_id)
      `
      )
      .order('changed_at', { ascending: false })
      .limit(limit) as any;

    ticketHistoryQuery = scopeQueryServer(
      'service_ticket_history',
      ticketHistoryQuery,
      {
        isAdmin,
        isFrontDesk
      }
    );

    const { data: ticketHistory, error: historyError } =
      await ticketHistoryQuery;

    // Fetch recent customers
    let customersQuery = supabase
      .from('customers')
      .select('id, name, contact, created_at, location_id')
      .order('created_at', { ascending: false })
      .limit(10) as any;

    customersQuery = scopeQueryServer('customers', customersQuery, {
      isAdmin,
      isFrontDesk
    });

    const { data: customers, error: customersError } = await customersQuery;

    // Fetch recent tickets
    let ticketsQuery = supabase
      .from('service_tickets')
      .select('id, ticket_number, status, created_at, location_id')
      .order('created_at', { ascending: false })
      .limit(10) as any;

    ticketsQuery = scopeQueryServer('service_tickets', ticketsQuery, {
      isAdmin,
      isFrontDesk
    });

    const { data: tickets, error: ticketsError } = await ticketsQuery;

    if (historyError || customersError || ticketsError) {
      throw new Error('Failed to fetch activity data');
    }

    // Combine and format activities
    const activities: ActivityItem[] = [];

    // Add ticket status changes
    if (ticketHistory) {
      ticketHistory.forEach((h: any) => {
        if (h.action === 'status_change' && h.new_values?.status) {
          activities.push({
            id: h.id,
            type: 'ticket_status',
            title: `${h.service_tickets.ticket_number} status changed`,
            description: `Changed to ${h.new_values.status}`,
            timestamp: h.changed_at,
            metadata: {
              ticket_number: h.service_tickets.ticket_number,
              ticket_id: h.ticket_id,
              old_status: h.previous_values?.status,
              new_status: h.new_values?.status
            }
          });
        }
      });
    }

    // Add new customers
    if (customers) {
      customers.forEach((c: any) => {
        activities.push({
          id: `customer-${c.id}`,
          type: 'customer_created',
          title: 'New customer registered',
          description: c.name,
          timestamp: c.created_at,
          metadata: {
            customer_id: c.id,
            customer_name: c.name,
            contact: c.contact
          }
        });
      });
    }

    // Add new tickets
    if (tickets) {
      tickets.forEach((t: any) => {
        activities.push({
          id: `ticket-${t.id}`,
          type: 'ticket_created',
          title: 'New job card created',
          description: t.ticket_number,
          timestamp: t.created_at,
          metadata: {
            ticket_id: t.id,
            ticket_number: t.ticket_number,
            status: t.status
          }
        });
      });
    }

    // Sort by timestamp and limit
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: activities.slice(0, limit)
    });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch activity'
      },
      { status: 500 }
    );
  }
}
