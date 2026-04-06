// Custom query hook for stats data
// Provides type-safe React Query hook for fetching system statistics

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { getStats } from '../lib/api/endpoints';
import type { Stats } from '../lib/api/types';

/**
 * Hook to fetch system statistics
 * 
 * @returns Query result with stats data including alert counts, severity breakdown,
 *          area breakdown, monitored channels, and uptime
 * 
 * @example
 * ```tsx
 * const { data: stats, isLoading, error } = useStats();
 * ```
 */
export function useStats() {
  return useQuery<Stats>({
    queryKey: queryKeys.stats(),
    queryFn: getStats,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}
