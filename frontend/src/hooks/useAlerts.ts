// Custom query hooks for alert data
// Provides type-safe React hooks for fetching alert information

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  getAlerts,
  getLatestAlerts,
  getPaginatedAlerts,
  getActiveSirens,
  type ActiveSirensResponse,
} from '../lib/api/endpoints';
import type {
  AlertQueryParams,
  AlertResponse,
  Alert,
} from '../lib/api/types';

/**
 * Hook to fetch alerts with optional filtering and pagination
 * 
 * @param filters - Optional query parameters for filtering and pagination
 * @returns Query result with paginated alert data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAlerts({ 
 *   severity: 'critical',
 *   page: 1,
 *   per_page: 50
 * });
 * ```
 */
export function useAlerts(filters?: AlertQueryParams) {
  return useQuery<AlertResponse>({
    queryKey: queryKeys.alerts.list(filters || {}),
    queryFn: () => getAlerts(filters),
    staleTime: 30 * 1000, // 30 seconds for dynamic data
  });
}

/**
 * Hook to fetch paginated alerts with infinite scroll support
 * 
 * @param filters - Optional query parameters for filtering
 * @param perPage - Number of items per page (default: 50)
 * @returns Infinite query result with paginated alert data
 * 
 * @example
 * ```tsx
 * const { 
 *   data, 
 *   fetchNextPage, 
 *   hasNextPage, 
 *   isFetchingNextPage 
 * } = useInfiniteAlerts({ severity: 'critical' }, 50);
 * ```
 */
export function useInfiniteAlerts(filters?: Omit<AlertQueryParams, 'page' | 'per_page'>, perPage: number = 50) {
  return useInfiniteQuery<AlertResponse>({
    queryKey: [...queryKeys.alerts.list(filters || {}), 'infinite', perPage],
    queryFn: ({ pageParam = 1 }) => getPaginatedAlerts({ ...filters, page: pageParam as number, per_page: perPage }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(lastPage.total / perPage);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000, // 30 seconds for dynamic data
  });
}

/**
 * Hook to fetch the latest N alerts
 * Useful for displaying recent alerts in a feed or notification panel
 * 
 * @param n - Number of latest alerts to retrieve (default: 10)
 * @returns Query result with array of latest alerts
 * 
 * @example
 * ```tsx
 * const { data: latestAlerts } = useLatestAlerts(20);
 * ```
 */
export function useLatestAlerts(n: number = 10) {
  return useQuery<Alert[]>({
    queryKey: queryKeys.alerts.latest(n),
    queryFn: () => getLatestAlerts(n),
    staleTime: 30 * 1000, // 30 seconds for dynamic data
  });
}

/**
 * Hook to check for ACTIVE missile/siren alerts in the last 30 minutes.
 * Polls every 45s. Returns { active: false } when the situation is clear.
 * Use ONLY for the real-time warning banner — not for the alerts list.
 */
export function useActiveSirens(windowMinutes = 30) {
  return useQuery<ActiveSirensResponse>({
    queryKey: ['alerts', 'sirens', windowMinutes],
    queryFn: () => getActiveSirens(windowMinutes),
    refetchInterval: 45_000, // poll every 45 seconds
    staleTime: 30_000,
    retry: 1,
  });
}
