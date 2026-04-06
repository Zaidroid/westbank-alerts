// Custom query hook for checkpoint statistics
// Provides type-safe React Query hook for fetching checkpoint status stats

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { getCheckpointStats } from '../lib/api/endpoints';
import type { CheckpointStats } from '../lib/api/types';

/**
 * Hook to fetch checkpoint statistics
 * 
 * @returns Query result with checkpoint stats including counts by status,
 *          confidence levels, update frequencies, and monitored channel
 * 
 * @example
 * ```tsx
 * const { data: checkpointStats, isLoading, error } = useCheckpointStats();
 * ```
 */
export function useCheckpointStats() {
  return useQuery<CheckpointStats>({
    queryKey: queryKeys.checkpoints.stats(),
    queryFn: getCheckpointStats,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}
