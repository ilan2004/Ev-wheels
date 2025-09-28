import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Don't refetch on window focus by default (can be overridden per query)
      refetchOnWindowFocus: false,
      // Retry failed requests twice with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query client configuration for production optimizations
if (typeof window !== 'undefined') {
  // Enable background refetching when the app comes back into focus
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      queryClient.refetchQueries({
        predicate: (query) => {
          // Only refetch critical queries on visibility change
          return query.queryKey[0] === 'dashboard' || 
                 query.queryKey[0] === 'urgent-tickets';
        },
      });
    }
  });
}
