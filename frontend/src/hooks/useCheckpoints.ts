// Custom query hooks for checkpoint data
// Provides type-safe React hooks for fetching checkpoint information

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  getCheckpoints,
  getCheckpointSummary,
  getCheckpointGeoJSON,
  getPaginatedCheckpoints,
} from '../lib/api/endpoints';
import type {
  CheckpointQueryParams,
  CheckpointListResponse,
  CheckpointSummary,
  GeoJSONFeatureCollection,
} from '../lib/api/types';

/**
 * Hook to fetch checkpoints with optional filtering
 * 
 * @param filters - Optional query parameters for filtering checkpoints
 * @returns Query result with checkpoint list data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCheckpoints({ status: 'closed' });
 * ```
 */
export function useCheckpoints(filters?: CheckpointQueryParams) {
  return useQuery<CheckpointListResponse>({
    queryKey: queryKeys.checkpoints.list(filters || {}),
    queryFn: () => getCheckpoints(filters),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every 60 seconds
  });
}

/**
 * Hook to fetch paginated checkpoints with infinite scroll support
 * 
 * @param filters - Optional query parameters for filtering
 * @param perPage - Number of items per page (default: 100)
 * @returns Infinite query result with paginated checkpoint data
 * 
 * @example
 * ```tsx
 * const { 
 *   data, 
 *   fetchNextPage, 
 *   hasNextPage, 
 *   isFetchingNextPage 
 * } = useInfiniteCheckpoints({ status: 'closed' }, 100);
 * ```
 */
export function useInfiniteCheckpoints(filters?: Omit<CheckpointQueryParams, 'page' | 'per_page'>, perPage: number = 100) {
  return useInfiniteQuery<CheckpointListResponse>({
    queryKey: [...queryKeys.checkpoints.list(filters || {}), 'infinite', perPage],
    queryFn: ({ pageParam = 1 }) => getPaginatedCheckpoints({ ...filters, page: pageParam as number, per_page: perPage }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(lastPage.total / perPage);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Re-poll every 60s
  });
}

/**
 * Hook to fetch checkpoint summary for dashboard KPIs
 * Polls every 30 seconds for fresh data
 * 
 * @returns Query result with checkpoint summary data
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useCheckpointSummary();
 * console.log(data?.by_status.closed); // Number of closed checkpoints
 * ```
 */
export function useCheckpointSummary() {
  return useQuery<CheckpointSummary>({
    queryKey: queryKeys.checkpoints.summary(),
    queryFn: getCheckpointSummary,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

/**
 * Hook to fetch checkpoints in GeoJSON format for map rendering
 * Caches data for 60 seconds to optimize map performance
 * 
 * @param status - Optional status filter
 * @returns Query result with GeoJSON feature collection
 * 
 * @example
 * ```tsx
 * const { data } = useCheckpointGeoJSON('closed');
 * // Render data.features on map
 * ```
 */
export function useCheckpointGeoJSON(status?: string) {
  return useQuery<GeoJSONFeatureCollection>({
    queryKey: queryKeys.checkpoints.geojson(status),
    queryFn: () => getCheckpointGeoJSON(status),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every 60s for map freshness
  });
}
