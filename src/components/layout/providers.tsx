'use client';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ActiveThemeProvider } from '../active-theme';
import { LocationProvider } from '@/lib/location/context';
import { queryClient } from '@/lib/react-query/query-client';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <LocationProvider>
          {children}
          {/* React Query DevTools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false} 
            />
          )}
        </LocationProvider>
      </ActiveThemeProvider>
    </QueryClientProvider>
  );
}
