'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { LocationProvider } from '@/lib/location/context';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <LocationProvider>{children}</LocationProvider>
    </ActiveThemeProvider>
  );
}
