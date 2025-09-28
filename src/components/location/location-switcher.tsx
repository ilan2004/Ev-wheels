'use client';

import React from 'react';
import { useLocationContext } from '@/lib/location/context';

export default function LocationSwitcher() {
  const { locations, activeLocationId, setActive, loading } =
    useLocationContext();

  if (loading) {
    return (
      <div className='text-muted-foreground text-xs'>Loading locations...</div>
    );
  }

  if (!locations.length) {
    return null;
  }

  return (
    <select
      className='bg-background h-9 rounded border px-2 text-sm'
      value={activeLocationId ?? ''}
      onChange={(e) => setActive(e.target.value)}
      aria-label='Select location'
    >
      {locations.map((loc) => (
        <option key={loc.id} value={loc.id}>
          {loc.name}
        </option>
      ))}
    </select>
  );
}
