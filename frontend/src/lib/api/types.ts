// TypeScript type definitions for API models
// Matches Backend FastAPI response schemas

// Enums and Union Types
export type AlertType = 
  | 'west_bank_siren'
  | 'regional_attack'
  | 'idf_raid'
  | 'settler_attack'
  | 'road_closure'
  | 'flying_checkpoint'
  | 'injury_report'
  | 'demolition'
  | 'arrest_campaign'
  | 'rocket_attack'
  | 'idf_operation'
  | 'airstrike'
  | 'explosion'
  | 'shooting'
  | 'general';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type CheckpointStatus = 
  | 'open'
  | 'closed'
  | 'congested'
  | 'slow'
  | 'military'
  | 'unknown';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type CheckpointType =
  | 'checkpoint'
  | 'gate'
  | 'police'
  | 'traffic_signal'
  | 'roundabout'
  | 'bridge'
  | 'entrance'
  | 'bypass_road'
  | 'tunnel'
  | 'crossing';

export type Direction = 'inbound' | 'outbound' | 'both';

export type Confidence = 'high' | 'medium' | 'low';

export type SourceType = 'admin' | 'crowd';

export type AlertZone = 'north' | 'middle' | 'south' | 'west_bank';

// Alert Models
export interface Alert {
  id: number;
  type: AlertType;
  severity: Severity;
  title: string;
  title_ar?: string;
  body: string;
  source: string;
  source_msg_id?: number;
  area?: string;
  zone?: AlertZone;
  raw_text: string;
  timestamp: string; // ISO 8601
  created_at: string; // ISO 8601
  event_subtype?: string;
  latitude?: number;
  longitude?: number;
}

export interface AlertQueryParams {
  type?: AlertType;
  severity?: Severity;
  area?: string;
  since?: string; // ISO 8601
  page?: number;
  per_page?: number;
}

export interface AlertResponse {
  alerts: Alert[];
  total: number;
  page: number;
  per_page: number;
}

// Checkpoint Models
export interface Checkpoint {
  canonical_key: string;
  name_ar: string;
  name_en?: string;
  region?: string;
  checkpoint_type?: CheckpointType;
  latitude?: number;
  longitude?: number;
  status: CheckpointStatus;
  status_raw?: string;
  direction?: Direction | null;
  confidence: Confidence;
  crowd_reports_1h: number;
  last_updated: string; // ISO 8601
  last_source_type?: SourceType;
  last_active_hours?: number;
  is_stale: boolean;
}

export interface CheckpointQueryParams {
  status?: CheckpointStatus;
  region?: string;
  active?: boolean;
  since?: string; // ISO 8601
}

export interface CheckpointListResponse {
  checkpoints: Checkpoint[];
  total: number;
  snapshot_at: string; // ISO 8601
}

export interface CheckpointUpdate {
  id?: number;
  canonical_key: string;
  name_raw: string;
  status: CheckpointStatus;
  status_raw?: string;
  direction?: Direction | null;
  source_type: SourceType;
  source_channel: string;
  source_msg_id?: number;
  raw_line?: string;
  raw_message?: string;
  timestamp: string; // ISO 8601
  created_at?: string; // ISO 8601
}

export interface CheckpointSummary {
  by_status: Record<CheckpointStatus, number>;
  fresh_last_1h: number;
  fresh_last_6h: number;
  total_active: number;
  last_update: string; // ISO 8601
  is_data_stale: boolean;
}

// Statistics Models
export interface Stats {
  total_alerts: number;
  alerts_last_24h: number;
  alerts_last_hour: number;
  by_type: Record<AlertType, number>;
  by_severity: Record<Severity, number>;
  by_area: Record<string, number>;
  monitored_channels: string[];
  uptime_seconds: number;
}

export interface CheckpointStats {
  total_checkpoints: number;
  total_directory: number;
  total_with_geo: number;
  by_status: Record<CheckpointStatus, number>;
  by_confidence: Record<string, number>;
  by_type: Record<CheckpointType, number>;
  updates_last_1h: number;
  updates_last_24h: number;
  admin_updates_24h: number;
  monitored_channel: string;
  snapshot_at: string; // ISO 8601
}

// Health Models
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime_seconds: number;
  ws_clients: number;
  sse_clients: number;
  cp_ws_clients: number;
  cp_sse_clients: number;
  monitor: {
    connected: boolean;
    last_message_at?: string; // ISO 8601
    messages_today: number;
    alerts_today: number;
    cp_updates_today: number;
  };
  checkpoints: {
    last_update?: string; // ISO 8601
    is_stale: boolean;
  };
  timestamp: string; // ISO 8601
}

// Checkpoint History
export interface CheckpointHistoryResponse {
  checkpoint: Checkpoint;
  history: CheckpointUpdate[];
  total: number;
}

export interface UpdateFeedResponse {
  updates: CheckpointUpdate[];
  total: number;
  page: number;
  per_page: number;
}

// Region info
export interface RegionInfo {
  region: string;
  count: number;
}

// GeoJSON Models
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    canonical_key: string;
    name_ar: string;
    name_en?: string;
    region?: string;
    checkpoint_type?: CheckpointType;
    status: CheckpointStatus;
    direction?: Direction | null;
    confidence: string;
    last_updated: string; // ISO 8601
    last_source_type?: string;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  metadata: {
    total: number;
    snapshot_at: string; // ISO 8601
  };
}

// ── Market Data ───────────────────────────────────────────────────────────────

export interface MarketData {
  currency: {
    rates: Record<string, number>; // e.g. { USD: 3.165, EUR: 3.636 }
    base: string;                   // "ILS"
    source: string;
    last_update: string;
    fetched_at: string;
    cached?: boolean;
  };
  gold: {
    karats_ils_gram: Record<string, number>; // { "24K": 1022.86, ... }
    usd_per_oz: number;
    usd_per_gram: number;
    currency: string;
    source: string;
    fetched_at: string;
  };
  fuel: {
    prices_ils_liter: {
      gasoline_95: number;
      gasoline_98: number;
      diesel: number;
    };
    prices_usd_liter: {
      gasoline_95_usd: number;
      gasoline_98_usd: number;
      diesel_usd: number;
    };
    currency: string;
    effective_date: string;
    source: string;
    fetched_at: string;
    cached?: boolean;
  };
  fetched_at: string;
}

// ── Weather ───────────────────────────────────────────────────────────────────

export interface WeatherCity {
  name: string;
  name_ar: string;
  lat: number;
  lon: number;
  temp_c: number;
  wind_kmh: number;
  wind_dir_deg?: number;
  weather_code: number;
  condition: string;
  condition_ar: string;
  is_day: boolean;
}

export interface WeatherResponse {
  cities: WeatherCity[];
  fetched_at?: string;
}

// ── Prayer Times ──────────────────────────────────────────────────────────────

export interface PrayerCity {
  name: string;
  name_ar: string;
  prayers: Record<string, string>;     // { Fajr: "04:55", ... }
  prayers_ar: Record<string, string>;  // { "الفجر": "04:55", ... }
}

export interface PrayerTimesResponse {
  date: string;
  hijri: {
    date: string;
    day: string;
    month: number;
    month_ar: string;
    year: string;
    weekday_ar: string;
  };
  cities: PrayerCity[];
}

// Internet Status
export interface InternetSignal {
  source: string;
  value: number;
  baseline: number;
  ratio: number;
  status: 'normal' | 'degraded' | 'outage';
}

export interface InternetStatusResponse {
  overall_status: 'normal' | 'degraded' | 'outage';
  signals: Record<string, InternetSignal>;
  fetched_at: string;
  is_stale: boolean;
}

// Weather
export interface WeatherData {
  city: string;
  city_ar: string;
  temperature: number;
  wind_speed: number;
  weather_code: number;
  weather_description: string;
  weather_description_ar: string;
  is_day: boolean;
  fetched_at: string;
  is_stale: boolean;
}

// Prayer Times
export interface PrayerTimesData {
  city: string;
  city_ar: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijri_date: string;
  hijri_weekday: string;
  next_prayer: string;
  next_prayer_time: string;
  fetched_at: string;
  is_stale: boolean;
}
