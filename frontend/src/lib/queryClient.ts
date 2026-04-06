// TanStack Query client configuration
// Provides centralized query caching, refetching, and retry configuration

import { QueryClient } from '@tanstack/react-query';
import type {
  AlertQueryParams,
  CheckpointQueryParams,
} from './api/types';

/**
 * Create and configure the QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Static data (stats, health) - 5 minutes stale time
      staleTime: 5 * 60 * 1000,
      
      // Garbage collection time - 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry configuration - 3 attempts with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus and network reconnection
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // Refetch on mount when data is stale
      refetchOnMount: true,
    },
  },
});

/**
 * Query key factory for all endpoints
 * Ensures consistent cache key generation and includes filter parameters
 */
export const queryKeys = {
  /**
   * Alert query keys
   */
  alerts: {
    all: ['alerts'] as const,
    lists: () => [...queryKeys.alerts.all, 'list'] as const,
    list: (filters: AlertQueryParams) => [...queryKeys.alerts.lists(), filters] as const,
    latest: (n: number) => [...queryKeys.alerts.all, 'latest', n] as const,
    detail: (id: number) => [...queryKeys.alerts.all, 'detail', id] as const,
  },
  
  /**
   * Checkpoint query keys
   */
  checkpoints: {
    all: ['checkpoints'] as const,
    lists: () => [...queryKeys.checkpoints.all, 'list'] as const,
    list: (filters: CheckpointQueryParams) => [...queryKeys.checkpoints.lists(), filters] as const,
    summary: () => [...queryKeys.checkpoints.all, 'summary'] as const,
    geojson: (status?: string) => [...queryKeys.checkpoints.all, 'geojson', status ?? 'all'] as const,
    stats: () => [...queryKeys.checkpoints.all, 'stats'] as const,
  },
  
  /**
   * System query keys
   */
  health: () => ['health'] as const,
  stats: () => ['stats'] as const,
};
