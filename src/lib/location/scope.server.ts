// Server-side utilities to apply location scoping to Supabase queries
// This version does NOT use localStorage and is safe for API routes

import { isLocationScopeEnabled } from '@/lib/config/flags';

export const SCOPED_TABLES = new Set<string>([
  'customers',
  'battery_records',
  'service_tickets',
  'vehicle_cases',
  'service_ticket_history',
  'quotes',
  'invoices',
  'payments'
]);

/**
 * Server-side version of scopeQuery that relies on RLS policies
 * instead of client-side localStorage.
 *
 * On the server, we don't have access to the active location from localStorage.
 * Instead, we rely on:
 * 1. Admin/Front Desk users can see all data (bypass scoping)
 * 2. Regular users are filtered by RLS policies in the database
 * 3. OR location_id can be passed explicitly if needed
 */
export function scopeQueryServer<
  T extends { eq: (col: string, val: any) => T }
>(
  table: string,
  query: T,
  options?: {
    isAdmin?: boolean;
    isFrontDesk?: boolean;
    locationId?: string | null; // Optional explicit location ID
  }
): T {
  if (!isLocationScopeEnabled()) {
    return query;
  }

  // Admins and front desk managers bypass location filtering
  if (options?.isAdmin || options?.isFrontDesk) {
    return query;
  }

  // If explicit location ID is provided and table is scoped, apply it
  if (options?.locationId && SCOPED_TABLES.has(table)) {
    try {
      return query.eq('location_id', options.locationId);
    } catch {
      return query; // best-effort, in case the builder shape differs
    }
  }

  // Otherwise, rely on RLS policies to filter by location
  // The database RLS policies should automatically filter based on the authenticated user
  return query;
}

/**
 * Server-side version of withLocationId
 * Adds location_id to insert payloads if provided
 */
export function withLocationIdServer<T extends Record<string, any>>(
  table: string,
  payload: T,
  locationId?: string | null
): T {
  if (!isLocationScopeEnabled()) {
    return payload;
  }

  if (locationId && SCOPED_TABLES.has(table)) {
    if (!('location_id' in payload) || payload.location_id == null) {
      return { ...payload, location_id: locationId } as T;
    }
  }

  return payload;
}
