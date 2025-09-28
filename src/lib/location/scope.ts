// Utilities to apply active location scoping to Supabase queries
'use client';

import { getActiveLocationId } from './session';
import { isLocationScopeEnabled } from '@/lib/config/flags';

export const SCOPED_TABLES = new Set<string>([
  'customers',
  'battery_records',
  'service_tickets',
  'quotes',
  'invoices',
  'payments',
]);

// Apply a location_id filter to a Postgrest query builder if applicable.
export function scopeQuery<T extends { eq: (col: string, val: any) => T }>(
  table: string,
  query: T
): T {
  if (!isLocationScopeEnabled()) {
    return query;
  }
  const locId = getActiveLocationId();
  if (locId && SCOPED_TABLES.has(table)) {
    try {
      return query.eq('location_id', locId);
    } catch {
      return query; // best-effort, in case the builder shape differs
    }
  }
  return query;
}

// Add location_id to insert payloads if not present and if the table is scoped.
export function withLocationId<T extends Record<string, any>>(table: string, payload: T): T {
  if (!isLocationScopeEnabled()) {
    return payload;
  }
  const locId = getActiveLocationId();
  if (locId && SCOPED_TABLES.has(table)) {
    if (!('location_id' in payload) || payload.location_id == null) {
      return { ...payload, location_id: locId } as T;
    }
  }
  return payload;
}

