// Typed endpoint functions for Backend API
// Provides type-safe access to all REST endpoints

import { apiClient } from './client';
import type {
  Alert,
  AlertQueryParams,
  AlertResponse,
  Checkpoint,
  CheckpointQueryParams,
  CheckpointListResponse,
  CheckpointSummary,
  CheckpointStats,
  CheckpointHistoryResponse,
  UpdateFeedResponse,
  Stats,
  HealthResponse,
  GeoJSONFeatureCollection,
  MarketData,
  WeatherResponse,
  PrayerTimesResponse,
} from './types';

/**
 * Build query string from parameters object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get alerts with optional filtering and pagination
 * 
 * @param params - Query parameters for filtering alerts
 * @returns Promise resolving to paginated alert response
 */
export async function getAlerts(params?: AlertQueryParams): Promise<AlertResponse> {
  const queryString = params ? buildQueryString(params as Record<string, unknown>) : '';
  return apiClient.get<AlertResponse>(`/alerts${queryString}`);
}

/**
 * Get paginated alerts for infinite scroll
 * 
 * @param params - Query parameters including page and per_page
 * @returns Promise resolving to paginated alert response
 */
export async function getPaginatedAlerts(params?: AlertQueryParams & { page?: number; per_page?: number }): Promise<AlertResponse> {
  const defaultParams = { page: 1, per_page: 50, ...params };
  const queryString = buildQueryString(defaultParams as Record<string, unknown>);
  return apiClient.get<AlertResponse>(`/alerts${queryString}`);
}

/**
 * Get the latest N alerts
 * 
 * @param n - Number of latest alerts to retrieve (default: 10)
 * @returns Promise resolving to array of alerts
 */
export async function getLatestAlerts(n: number = 10): Promise<Alert[]> {
  return apiClient.get<Alert[]>(`/alerts/latest?n=${n}`);
}

/**
 * Get checkpoints with optional filtering
 * 
 * @param params - Query parameters for filtering checkpoints
 * @returns Promise resolving to checkpoint list response
 */
export async function getCheckpoints(params?: CheckpointQueryParams): Promise<CheckpointListResponse> {
  const queryString = params ? buildQueryString(params as Record<string, unknown>) : '';
  return apiClient.get<CheckpointListResponse>(`/checkpoints${queryString}`);
}

/**
 * Get paginated checkpoints for infinite scroll
 * 
 * @param params - Query parameters including page and per_page
 * @returns Promise resolving to paginated checkpoint response
 */
export async function getPaginatedCheckpoints(params?: CheckpointQueryParams & { page?: number; per_page?: number }): Promise<CheckpointListResponse> {
  const defaultParams = { page: 1, per_page: 100, ...params };
  const queryString = buildQueryString(defaultParams as Record<string, unknown>);
  return apiClient.get<CheckpointListResponse>(`/checkpoints${queryString}`);
}

/**
 * Get checkpoint summary for dashboard KPIs
 * Lightweight endpoint optimized for frequent polling
 * 
 * @returns Promise resolving to checkpoint summary
 */
export async function getCheckpointSummary(): Promise<CheckpointSummary> {
  return apiClient.get<CheckpointSummary>('/checkpoints/summary');
}

/**
 * Get checkpoints in GeoJSON format for map rendering
 * 
 * @param status - Optional status filter
 * @returns Promise resolving to GeoJSON feature collection
 */
export async function getCheckpointGeoJSON(status?: string): Promise<GeoJSONFeatureCollection> {
  const queryString = status ? `?status=${status}` : '';
  return apiClient.get<GeoJSONFeatureCollection>(`/checkpoints/geojson${queryString}`);
}

/**
 * Get overall system statistics
 * 
 * @returns Promise resolving to stats
 */
export async function getStats(): Promise<Stats> {
  return apiClient.get<Stats>('/stats');
}

/**
 * Get checkpoint-specific statistics
 * 
 * @returns Promise resolving to checkpoint stats
 */
export async function getCheckpointStats(): Promise<CheckpointStats> {
  return apiClient.get<CheckpointStats>('/checkpoints/stats');
}

/**
 * Get WB zone polygons as GeoJSON for map overlays
 */
export async function getZonePolygons(): Promise<GeoJSONFeatureCollection> {
  return apiClient.get<GeoJSONFeatureCollection>('/zones');
}

/**
 * Get checkpoint history (current status + timeline of updates)
 */
export async function getCheckpointHistory(key: string, historyLimit: number = 50): Promise<CheckpointHistoryResponse> {
  return apiClient.get<CheckpointHistoryResponse>(`/checkpoints/${encodeURIComponent(key)}?history_limit=${historyLimit}`);
}

/**
 * Get checkpoint updates feed (recent updates across all checkpoints)
 */
export async function getUpdatesFeed(params?: { per_page?: number; since?: string }): Promise<UpdateFeedResponse> {
  const queryString = params ? buildQueryString(params as Record<string, unknown>) : '';
  return apiClient.get<UpdateFeedResponse>(`/checkpoints/updates/feed${queryString}`);
}

/**
 * Get checkpoint regions with counts
 */
export async function getCheckpointRegions(): Promise<{ regions: Array<{ region: string; total: number; active: number }> }> {
  return apiClient.get('/checkpoints/regions');
}

/**
 * Get system health status
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health');
}

/** All market data: currency, gold, fuel */
export async function getMarketData(): Promise<MarketData> {
  return apiClient.get<MarketData>('/market');
}

/** Current weather for WB cities */
export async function getWeather(): Promise<WeatherResponse> {
  return apiClient.get<WeatherResponse>('/weather');
}

/** Prayer times for WB cities */
export async function getPrayerTimes(): Promise<PrayerTimesResponse> {
  return apiClient.get<PrayerTimesResponse>('/prayer-times');
}

export interface ActiveSirensResponse {
  active: boolean;
  count: number;
  sirens: Alert[];
  window_minutes: number;
  checked_at: string;
}

/**
 * Get ACTIVE sirens only (last 30 min). Empty = all clear.
 * Use for the real-time warning banner ONLY.
 */
export async function getActiveSirens(minutes = 30): Promise<ActiveSirensResponse> {
  return apiClient.get<ActiveSirensResponse>(`/alerts/sirens?minutes=${minutes}`);
}
