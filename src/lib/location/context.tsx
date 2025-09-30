'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  fetchLocations as fetchAllLocations,
  getActiveLocation as getStoredActive,
  setActiveLocation as storeActive,
  type LocationRow
} from '@/lib/location/session';

interface LocationContextValue {
  locations: LocationRow[];
  activeLocationId: string | null;
  activeLocationName: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setActive: (locId: string) => void;
  isAdmin: boolean;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined
);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeLocationName, setActiveLocationName] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const role = (userRes?.user?.user_metadata as any)?.role as
        | string
        | undefined;
      const uid = userRes?.user?.id;
      const admin = role === 'admin';
      setIsAdmin(!!admin);

      let locs: LocationRow[] = [];
      if (admin) {
        locs = await fetchAllLocations();
        // Prepend an "All locations" pseudo option for admins
        locs = [{ id: '', name: 'All locations', code: null }, ...locs];
      } else {
        // Fetch only user-assigned locations
        try {
          if (!uid) {
            throw new Error('User not authenticated');
          }
          const { data, error } = await supabase
            .from('user_locations')
            .select('location:locations(id, name, code)')
            .eq('user_id', uid);
          if (error) throw error;
          locs = (data || []).map((r: any) => r.location).filter(Boolean);
          // Fallback to all if something odd happens
          if (!Array.isArray(locs) || locs.length === 0) {
            locs = await fetchAllLocations();
          }
        } catch {
          locs = await fetchAllLocations();
        }
      }
      setLocations(locs);

      // Initialize active from storage or default to first
      const stored = getStoredActive();
      const storedId = stored?.id ?? null; // may be '' or null
      const match = locs.find((l) => l.id === (storedId ?? ''));
      if (match) {
        setActiveLocationId(match.id || null);
        setActiveLocationName(match.name);
      } else if (locs.length > 0) {
        setActiveLocationId(locs[0].id || null);
        setActiveLocationName(locs[0].name);
        storeActive({ id: locs[0].id || null, name: locs[0].name });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActive = useCallback(
    (locId: string) => {
      const isAll = !locId; // empty string indicates "All locations"
      const loc =
        locations.find((l) => l.id === locId) ||
        (isAll ? ({ id: '', name: 'All locations' } as any) : undefined);
      const name = loc?.name || (isAll ? 'All locations' : null);
      setActiveLocationId(isAll ? null : locId);
      setActiveLocationName(name);
      storeActive({ id: isAll ? null : locId, name: name || 'Unknown' });
    },
    [locations]
  );

  const value = useMemo(
    () => ({
      locations,
      activeLocationId,
      activeLocationName,
      loading,
      refresh,
      setActive,
      isAdmin
    }),
    [
      locations,
      activeLocationId,
      activeLocationName,
      loading,
      refresh,
      setActive,
      isAdmin
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx)
    throw new Error(
      'useLocationContext must be used within a LocationProvider'
    );
  return ctx;
}
