// Simple client-side helpers for managing active location until DB wiring is complete
'use client';

import { supabase } from '@/lib/supabase/client';

export type LocationRow = { id: string; name: string; code?: string | null };

const ACTIVE_LOCATION_ID_KEY = 'activeLocationId';
const ACTIVE_LOCATION_NAME_KEY = 'activeLocationName';

export function setActiveLocation(loc: { id: string | null; name: string }) {
  try {
    if (loc.id) localStorage.setItem(ACTIVE_LOCATION_ID_KEY, loc.id);
    else localStorage.removeItem(ACTIVE_LOCATION_ID_KEY);
    localStorage.setItem(ACTIVE_LOCATION_NAME_KEY, loc.name);
  } catch {}
}

export function getActiveLocation(): {
  id: string | null;
  name: string | null;
} {
  try {
    const id = localStorage.getItem(ACTIVE_LOCATION_ID_KEY);
    const name = localStorage.getItem(ACTIVE_LOCATION_NAME_KEY);
    return { id, name };
  } catch {
    return { id: null, name: null };
  }
}

export function getActiveLocationId(): string | null {
  return getActiveLocation().id;
}

export async function fetchLocations(): Promise<LocationRow[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, code')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as LocationRow[];
  } catch (e) {
    // Fallback before migrations are applied
    return [{ id: 'default', name: 'Default', code: 'DEFAULT' }];
  }
}
