import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { useState, useMemo, useEffect, useRef } from "react";
import type { Alert, AlertType } from "@/lib/api";
import type { CheckpointUpdate } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker, Polyline, useMap } from "react-leaflet";
import { useLang, getStatusLabel, getTypeLabel, formatRelativeTime } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useCheckpointGeoJSON } from "@/hooks/useCheckpoints";
import { getZonePolygons } from "@/lib/api/endpoints";
import { Loader2, Layers, Filter } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface MapViewProps {
  checkpoints: any[];
  alerts: Alert[];
  checkpointUpdates?: CheckpointUpdate[];
  onCheckpointClick: (c: any) => void;
  onAlertClick: (a: Alert) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedRoute?: any | null;
}

type FilterMode = "all" | "checkpoints" | "alerts";
type MapStyle = "clean" | "streets" | "satellite" | "terrain";

const CHECKPOINT_COLORS: Record<string, string> = {
  open: "#22c55e",
  closed: "#ef4444",
  congested: "#f97316",
  military: "#a855f7",
  slow: "#f59e0b",
  unknown: "#6b7280",
};

const ALERT_TYPE_COLORS: Record<AlertType, string> = {
  west_bank_siren: "#ef4444",
  regional_attack: "#f97316",
  idf_raid: "#a855f7",
  settler_attack: "#f59e0b",
  road_closure: "#6b7280",
  flying_checkpoint: "#3b82f6",
  injury_report: "#dc2626",
  demolition: "#78716c",
  arrest_campaign: "#6366f1",
  rocket_attack: "#ef4444",
  idf_operation: "#a855f7",
  airstrike: "#dc2626",
  explosion: "#f97316",
  shooting: "#ef4444",
  general: "#6b7280",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
};

const TILE_CONFIGS: Record<MapStyle, { url: string; darkUrl?: string; attr: string; label: string }> = {
  clean: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    darkUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "Clean",
  },
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Streets",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: '&copy; Esri &mdash; Earthstar Geographics',
    label: "Satellite",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    label: "Terrain",
  },
};

// Alert type filter options — grouped for the detailed filter panel
const ALERT_TYPE_OPTIONS: { type: AlertType; icon: string }[] = [
  { type: "west_bank_siren", icon: "🚨" },
  { type: "regional_attack", icon: "💥" },
  { type: "idf_raid", icon: "⚔️" },
  { type: "settler_attack", icon: "🔥" },
  { type: "injury_report", icon: "🏥" },
  { type: "demolition", icon: "🏚️" },
  { type: "arrest_campaign", icon: "🚔" },
  { type: "road_closure", icon: "🚧" },
  { type: "flying_checkpoint", icon: "🛑" },
];


function createCheckpointIcon(status: string, isRecent?: boolean) {
  const color = CHECKPOINT_COLORS[status] || "#6b7280";
  const size = isRecent ? 15 : 12;
  const pulseRing = isRecent
    ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size + 16}px;height:${size + 16}px;border-radius:50%;border:2px solid ${color};animation:cp-pulse 2s ease-out 3;opacity:0;"></div>`
    : '';
  return L.divIcon({
    className: "checkpoint-marker",
    html: `<div style="position:relative;width:${size + 16}px;height:${size + 16}px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      ${pulseRing}
      <div class="cp-dot" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 6px ${color}80,0 1px 3px rgba(0,0,0,0.3);transition:transform 0.15s,box-shadow 0.15s;"></div>
    </div>`,
    iconSize: [size + 16, size + 16],
    iconAnchor: [(size + 16) / 2, (size + 16) / 2],
  });
}

function createAlertIcon(type: AlertType, severity: string) {
  const color = ALERT_TYPE_COLORS[type] || SEVERITY_COLORS[severity] || "#ef4444";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:24px;height:24px;border-radius:50%;border:1.5px solid ${color};animation:alert-ping 1.8s ease-out 5;opacity:0;"></div>
      <div style="position:absolute;width:16px;height:16px;border-radius:50%;border:1px solid ${color};animation:alert-ping 1.8s ease-out 5 0.4s;opacity:0;"></div>
      <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 10px ${color}cc;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Inject CSS animations
const STYLE_ID = "map-marker-animations";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes cp-pulse {
      0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.7; }
      100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; }
    }
    @keyframes alert-ping {
      0% { transform: scale(0.5); opacity: 0.7; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    @keyframes zone-pulse {
      0% { fill-opacity: 0.15; stroke-opacity: 0.6; }
      50% { fill-opacity: 0.35; stroke-opacity: 0.9; }
      100% { fill-opacity: 0.15; stroke-opacity: 0.6; }
    }
    .zone-overlay {
      animation: zone-pulse 2s ease-in-out infinite;
    }
    .checkpoint-marker:hover .cp-dot {
      transform: scale(1.5);
      box-shadow: 0 0 14px currentColor, 0 2px 8px rgba(0,0,0,0.3) !important;
    }
  `;
  document.head.appendChild(style);
}


function ZoneOverlays({ alerts, t }: { alerts: Alert[]; t: any }) {
  // Group alerts by zone and compute pulse intensity
  const zoneAlerts = useMemo(() => {
    const zones: Record<string, { count: number; maxSeverity: string; types: Set<string>; latest: Alert | null }> = {
      north: { count: 0, maxSeverity: "low", types: new Set(), latest: null },
      middle: { count: 0, maxSeverity: "low", types: new Set(), latest: null },
      south: { count: 0, maxSeverity: "low", types: new Set(), latest: null },
    };
    const sevRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

    for (const a of alerts) {
      if (!a.zone || a.zone === "west_bank") continue;
      const z = zones[a.zone];
      if (!z) continue;
      z.count++;
      z.types.add(a.type);
      if (sevRank[a.severity] > sevRank[z.maxSeverity]) z.maxSeverity = a.severity;
      if (!z.latest || new Date(a.timestamp) > new Date(z.latest.timestamp)) z.latest = a;
    }
    return zones;
  }, [alerts]);

  const zonePolygons = useRef<Record<string, { polygon: number[][]; center: [number, number] }>>({
    north: {
      polygon: [[32.55, 34.95], [32.55, 35.50], [32.00, 35.50], [32.00, 34.95]],
      center: [32.22, 35.25],
    },
    middle: {
      polygon: [[32.00, 35.05], [32.00, 35.50], [31.70, 35.50], [31.70, 35.05]],
      center: [31.90, 35.20],
    },
    south: {
      polygon: [[31.70, 34.90], [31.70, 35.30], [31.25, 35.30], [31.25, 34.90]],
      center: [31.53, 35.10],
    },
  });

  const zoneLabels: Record<string, string> = {
    north: t.northZone,
    middle: t.middleZone,
    south: t.southZone,
  };

  return (
    <>
      {Object.entries(zoneAlerts).map(([zoneName, data]) => {
        if (data.count === 0) return null;
        const zone = zonePolygons.current[zoneName];
        if (!zone) return null;
        const color = SEVERITY_COLORS[data.maxSeverity] || "#ef4444";
        // Convert [lat,lng] to [lng,lat] for Leaflet
        const positions = zone.polygon.map(([lat, lng]) => [lng, lat] as [number, number]);

        return (
          <Polygon
            key={zoneName}
            positions={positions}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.15 + data.count * 0.05,
              weight: 2,
              opacity: 0.6,
              className: "zone-overlay",
            }}
          >
            <Popup className="font-sans" closeButton={false}>
              <div className="flex flex-col gap-1.5 min-w-[140px] p-1">
                <div className="font-bold text-sm" style={{ color }} dir="auto">
                  {zoneLabels[zoneName]} — {data.count} {data.count === 1 ? t.alerts?.replace(/s$/, "") || "alert" : t.alerts}
                </div>
                <div className="flex flex-wrap gap-1">
                  {[...data.types].slice(0, 4).map(type => (
                    <span key={type} className="text-[10px] px-1.5 py-0.5 rounded bg-muted" dir="auto">
                      {getTypeLabel(type, t)}
                    </span>
                  ))}
                </div>
                {data.latest && (
                  <div className="text-[10px] text-muted-foreground mt-1" dir="auto">
                    {data.latest.title}
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}


function MapController({ 
  userLocation, 
  routeCoordinates 
}: { 
  userLocation: { latitude: number; longitude: number } | null,
  routeCoordinates: [number, number][]
}) {
  const map = useMap();
  const [trackedRoute, setTrackedRoute] = useState<string>("");

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const hash = routeCoordinates.map(c => `${c[0]},${c[1]}`).join('|');
      if (trackedRoute !== hash) {
        const bounds = L.latLngBounds(routeCoordinates);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
        setTrackedRoute(hash);
      }
    } else if (userLocation && !trackedRoute) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 13, { duration: 1.5 });
      setTrackedRoute("user");
    }
  }, [userLocation, routeCoordinates, map, trackedRoute]);

  return (
    <div className="leaflet-bottom leaflet-right" style={{ bottom: '20px', right: '10px' }}>
      <div className="leaflet-control">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (userLocation) {
              map.flyTo([userLocation.latitude, userLocation.longitude], 14, { duration: 1.5 });
            }
          }}
          className="w-10 h-10 bg-surface-container-highest/90 backdrop-blur-md rounded-full shadow-lg border border-outline-variant/30 flex items-center justify-center text-secondary hover:bg-surface-container-high transition-colors active:scale-95"
          style={{ pointerEvents: 'auto' }}
        >
          <span className="material-symbols-outlined text-[20px] filled">my_location</span>
        </button>
      </div>
    </div>
  );
}

function MapMarkers({
  geoJsonData, alerts, recentUpdates, showCheckpoints, showAlerts,
  onCheckpointClick, onAlertClick, t, lang,
}: any) {
  const recentKeys = useMemo(() => {
    const keys = new Set<string>();
    if (recentUpdates) {
      for (const u of recentUpdates.slice(0, 10)) {
        keys.add(u.canonical_key);
      }
    }
    return keys;
  }, [recentUpdates]);

  const checkpointMarkers = useMemo(() => {
    if (!showCheckpoints || !geoJsonData) return [];
    const seen = new Set<string>();
    return geoJsonData.features
      .filter((feature: any) => {
        const key = feature.properties?.canonical_key;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((feature: any) => ({
        key: feature.properties.canonical_key,
        position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as [number, number],
        status: feature.properties.status,
        properties: feature.properties,
        isRecent: recentKeys.has(feature.properties.canonical_key),
      }));
  }, [geoJsonData, showCheckpoints, recentKeys]);

  const activeAlerts = useMemo(() =>
    // Filter to only non-zone alerts (zone-based alerts are shown as polygons, not markers)
    alerts.filter((a: Alert) => a.latitude != null && a.longitude != null && (!a.zone || a.zone === "west_bank")),
    [alerts]
  );

  return (
    <>
      {showCheckpoints && checkpointMarkers.map((marker: any) => (
        <Marker key={marker.key} position={marker.position} icon={createCheckpointIcon(marker.status, marker.isRecent)}>
          <Popup className="font-sans" closeButton={false}>
            <div className="flex flex-col gap-1.5 min-w-[140px] p-1">
              <div className="font-bold text-sm leading-tight" dir="auto">
                {lang === "ar" ? marker.properties.name_ar : (marker.properties.name_en || marker.properties.name_ar)}
              </div>
              {marker.properties.name_en && lang === "ar" && (
                <div className="text-[11px] text-gray-500" dir="ltr">{marker.properties.name_en}</div>
              )}
              {marker.properties.name_ar && lang !== "ar" && (
                <div className="text-[11px] text-gray-500" dir="rtl">{marker.properties.name_ar}</div>
              )}
              <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t border-gray-200">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{
                    background: CHECKPOINT_COLORS[marker.status] + "22",
                    color: CHECKPOINT_COLORS[marker.status],
                  }}
                >
                  {getStatusLabel(marker.status, t)}
                </span>
                <Button size="sm" variant="secondary" className="h-5 text-[9px] px-2"
                  onClick={() => onCheckpointClick(marker.properties)}
                >{t.details}</Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {showAlerts && activeAlerts.map((a: Alert) => (
        <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={createAlertIcon(a.type, a.severity)}>
          <Popup className="font-sans" closeButton={false}>
            <div className="flex flex-col gap-1.5 min-w-[140px] p-1">
              <div className="font-bold text-sm leading-tight" style={{ color: SEVERITY_COLORS[a.severity] }} dir="auto">
                {a.title}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t border-gray-200">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted" dir="auto">
                  {getTypeLabel(a.type, t)}
                </span>
                <Button size="sm" variant="destructive" className="h-5 text-[9px] px-2"
                  onClick={() => onAlertClick(a)}
                >{t.details}</Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export function MapView({ alerts, checkpointUpdates, onCheckpointClick, onAlertClick, userLocation, selectedRoute }: MapViewProps) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [mapStyle, setMapStyle] = useState<MapStyle>("clean");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [activeTypes, setActiveTypes] = useState<Set<AlertType>>(new Set(ALERT_TYPE_OPTIONS.map(o => o.type)));
  const [zoneData, setZoneData] = useState<any>(null);

  const { data: geoJsonData, isLoading } = useCheckpointGeoJSON();

  // Fetch zone polygons
  useEffect(() => {
    getZonePolygons().then(setZoneData).catch(() => {});
  }, []);

  const showCheckpoints = filterMode === "all" || filterMode === "checkpoints";
  const showAlerts = filterMode === "all" || filterMode === "alerts";

  // Filter alerts by active types (for zone overlay AND type filtering)
  const filteredAlerts = useMemo(() => {
    if (activeTypes.size === ALERT_TYPE_OPTIONS.length) return alerts;
    return alerts.filter(a => activeTypes.has(a.type));
  }, [alerts, activeTypes]);

  // Zone alerts for zone highlighting (separate from point markers)
  const zoneAlerts = useMemo(() =>
    filteredAlerts.filter(a => a.zone && a.zone !== "west_bank"),
    [filteredAlerts]
  );

  // OSRM road-following route geometry
  const [osrmGeometry, setOsrmGeometry] = useState<[number, number][]>([]);
  const [osrmLoading, setOsrmLoading] = useState(false);

  // Fallback straight-line coordinates
  const fallbackCoordinates = useMemo(() => {
    if (!selectedRoute) return [];
    return selectedRoute.checkpoints.map((cp: any) => [cp.latitude, cp.longitude] as [number, number]);
  }, [selectedRoute]);

  // Fetch OSRM road geometry when route changes
  useEffect(() => {
    if (!selectedRoute || selectedRoute.checkpoints.length < 2) {
      setOsrmGeometry([]);
      return;
    }

    const coords = selectedRoute.checkpoints
      .map((cp: any) => `${cp.longitude},${cp.latitude}`)
      .join(';');

    setOsrmLoading(true);
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const geom = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setOsrmGeometry(geom);
        } else {
          setOsrmGeometry([]);
        }
      })
      .catch(() => setOsrmGeometry([]))
      .finally(() => setOsrmLoading(false));
  }, [selectedRoute?.id]);

  // Use OSRM geometry if available, otherwise fallback to straight lines
  const routePolylineCoordinates = osrmGeometry.length > 0 ? osrmGeometry : fallbackCoordinates;

  const tileConfig = TILE_CONFIGS[mapStyle];
  const tileUrl = (mapStyle === "clean" && theme === "dark" && tileConfig.darkUrl) ? tileConfig.darkUrl : tileConfig.url;

  const cpCount = geoJsonData?.features?.length ?? 0;
  // Count both zone alerts AND point marker alerts
  const alertCount = filteredAlerts.filter(a => a.latitude != null && a.longitude != null).length;
  const zoneAlertCount = zoneAlerts.length;

  const toggleType = (type: AlertType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
      {/* Top-right: filter + style toggle */}
      <div className="absolute top-2 right-2 z-20 flex gap-1" dir="ltr">
        <div className="bg-background/85 backdrop-blur border border-border rounded-md shadow-md p-0.5 flex gap-0.5 pointer-events-auto">
          {(["all", "checkpoints", "alerts"] as const).map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)}
              className={cn("h-7 px-2 md:px-3 rounded text-[11px] md:text-xs font-medium transition-colors",
                filterMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}>
              {mode === "all" ? t.all : mode === "checkpoints" ? `${t.checkpoints} (${cpCount})` : `${t.alerts} (${alertCount})`}
            </button>
          ))}
        </div>

        {/* Alert type filter */}
        {showAlerts && (
          <div className="relative pointer-events-auto">
            <button onClick={() => setShowTypeFilter(!showTypeFilter)}
              className={cn("h-[30px] px-2 flex items-center gap-1 bg-background/85 backdrop-blur border border-border rounded-md shadow-md hover:bg-muted/60 transition-colors text-[11px]",
                showTypeFilter ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}>
              <Filter className="h-3.5 w-3.5" />
              {activeTypes.size < ALERT_TYPE_OPTIONS.length && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                  {activeTypes.size}
                </span>
              )}
            </button>
            {showTypeFilter && (
              <div className="absolute top-full right-0 mt-1 bg-background/95 backdrop-blur border border-border rounded-md shadow-lg p-2 min-w-[180px] max-h-[300px] overflow-y-auto">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t.filter} — {t.alerts}
                </div>
                {ALERT_TYPE_OPTIONS.map(opt => {
                  const active = activeTypes.has(opt.type);
                  const count = alerts.filter(a => a.type === opt.type).length;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => toggleType(opt.type)}
                      className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                        active ? "text-foreground hover:bg-muted/60" : "text-muted-foreground/50"
                      )}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span className="flex-1 text-start">{getTypeLabel(opt.type, t)}</span>
                      {count > 0 && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                          active ? "bg-primary/10 text-primary" : "bg-muted/50"
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="relative pointer-events-auto">
          <button onClick={() => setShowStylePicker(!showStylePicker)}
            className="h-[30px] w-[30px] flex items-center justify-center bg-background/85 backdrop-blur border border-border rounded-md shadow-md hover:bg-muted/60 transition-colors">
            <Layers className="h-4 w-4 text-muted-foreground" />
          </button>
          {showStylePicker && (
            <div className="absolute top-full right-0 mt-1 bg-background/95 backdrop-blur border border-border rounded-md shadow-lg p-1 min-w-[100px]">
              {(Object.keys(TILE_CONFIGS) as MapStyle[]).map(style => (
                <button key={style} onClick={() => { setMapStyle(style); setShowStylePicker(false); }}
                  className={cn("w-full text-start px-3 py-1.5 rounded text-xs font-medium transition-colors",
                    mapStyle === style ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted/60"
                  )}>
                  {TILE_CONFIGS[style].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <MapContainer
        key={`${theme}-${mapStyle}`}
        center={userLocation ? [userLocation.latitude, userLocation.longitude] : [31.95, 35.25]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <MapController userLocation={userLocation || null} routeCoordinates={routePolylineCoordinates} />
        <TileLayer attribution={tileConfig.attr} url={tileUrl} />

        {/* Zone pulse overlays - shows zones with missile/security alerts */}
        {showAlerts && zoneAlerts.length > 0 && <ZoneOverlays alerts={zoneAlerts} t={t} />}

        {/* Selected route visualization */}
        {selectedRoute && routePolylineCoordinates.length > 0 && (
          <>
            {/* Route glow (wider, translucent line behind the main line) */}
            <Polyline
              positions={routePolylineCoordinates}
              pathOptions={{
                color: '#3b82f6',
                weight: 10,
                opacity: 0.15,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main route line */}
            <Polyline
              positions={routePolylineCoordinates}
              pathOptions={{
                color: '#3b82f6',
                weight: 4,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />

            {/* Route start marker */}
            <CircleMarker
              center={fallbackCoordinates[0] || routePolylineCoordinates[0]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#10b981',
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup className="font-sans" closeButton={false}>
                <div className="text-xs font-medium">{selectedRoute.from}</div>
              </Popup>
            </CircleMarker>
            {/* Route end marker */}
            <CircleMarker
              center={fallbackCoordinates[fallbackCoordinates.length - 1] || routePolylineCoordinates[routePolylineCoordinates.length - 1]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#ef4444',
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup className="font-sans" closeButton={false}>
                <div className="text-xs font-medium">{selectedRoute.to}</div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* User location (blue dot) */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={8}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup className="font-sans" closeButton={false}>
              <div className="text-xs font-medium">
                {lang === "ar" ? "موقعك الحالي" : "Your Location"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </div>
            </Popup>
          </CircleMarker>
        )}

        <MapMarkers
          geoJsonData={geoJsonData} alerts={filteredAlerts} recentUpdates={checkpointUpdates}
          showCheckpoints={showCheckpoints} showAlerts={showAlerts}
          onCheckpointClick={onCheckpointClick} onAlertClick={onAlertClick}
          t={t} lang={lang}
        />
      </MapContainer>

      {/* Legend - compact, bottom-left */}
      <div className="absolute bottom-2 left-2 z-20 bg-background/90 backdrop-blur border border-border rounded-md shadow-md px-2.5 py-2 text-[10px]" dir="ltr">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(["open", "closed", "congested", "military"] as const).map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHECKPOINT_COLORS[s] }} />
              <span className="text-foreground/70">{t[s]}</span>
            </div>
          ))}
        </div>
        {alertCount > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-border flex flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full shrink-0 bg-red-500 animate-pulse" />
              <span className="text-foreground/70">{t.alerts}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
