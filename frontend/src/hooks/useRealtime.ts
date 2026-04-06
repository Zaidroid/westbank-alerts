// Custom hook for managing real-time connections (SSE or WebSocket)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Alert, CheckpointUpdate, ConnectionStatus } from '../lib/api/types';
import { SSEConnectionManager } from '../lib/realtime/SSEConnectionManager';
import { WebSocketConnectionManager } from '../lib/realtime/WebSocketConnectionManager';
import type { ConnectionManager } from '../lib/realtime/SSEConnectionManager';
import { environment } from '../config/environment';
import { queryKeys } from '../lib/queryClient';

export type ConnectionType = 'sse' | 'websocket';

export interface UseRealtimeOptions {
  connectionType?: ConnectionType;
  onAlert?: (alert: Alert) => void;
  onCheckpointUpdate?: (update: CheckpointUpdate) => void;
  autoConnect?: boolean;
  initialAlerts?: number;
}

export interface UseRealtimeReturn {
  alerts: Alert[];
  checkpointUpdates: CheckpointUpdate[];
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for managing real-time connections to the backend.
 * Supports both SSE and WebSocket connections with automatic reconnection.
 * Fetches initial data on mount and then subscribes to real-time updates.
 * 
 * @param options Configuration options for the real-time connection
 * @returns Real-time data and connection control functions
 * 
 * @example
 * ```tsx
 * const { alerts, connectionStatus, reconnect } = useRealtime({
 *   connectionType: 'sse',
 *   onAlert: (alert) => console.log('New alert:', alert),
 * });
 * ```
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    connectionType = 'sse',
    onAlert,
    onCheckpointUpdate,
    autoConnect = true,
    initialAlerts = 50,
  } = options;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkpointUpdates, setCheckpointUpdates] = useState<CheckpointUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  // Use refs to store connection managers to avoid recreating them
  const alertManagerRef = useRef<ConnectionManager | null>(null);
  const checkpointManagerRef = useRef<ConnectionManager | null>(null);
  const hasInitialDataLoaded = useRef(false);
  
  // Get query client for invalidating queries on real-time updates
  const queryClient = useQueryClient();

  // Fetch initial data on mount
  useEffect(() => {
    if (hasInitialDataLoaded.current) return;
    hasInitialDataLoaded.current = true;

    const baseURL = environment.API_BASE_URL || '';

    // Load initial alerts
    fetch(`${baseURL}/alerts/latest?n=${initialAlerts}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setAlerts(data); })
      .catch(e => console.error('[useRealtime] Failed to load initial alerts:', e));

    // Load initial checkpoint updates
    fetch(`${baseURL}/checkpoints/updates/feed?per_page=50`)
      .then(r => r.ok ? r.json() : { updates: [] })
      .then(data => { if (data.updates?.length) setCheckpointUpdates(data.updates); })
      .catch(e => console.error('[useRealtime] Failed to load initial checkpoint updates:', e));
  }, [initialAlerts]);

  // Create connection managers
  useEffect(() => {
    const baseURL = environment.API_BASE_URL || '';
    const wsBaseURL = environment.WS_BASE_URL || baseURL.replace(/^http/, 'ws');

    // Create alert connection manager
    if (connectionType === 'sse') {
      alertManagerRef.current = new SSEConnectionManager({
        url: `${baseURL}/stream`,
        onStatusChange: setConnectionStatus,
      });
    } else {
      alertManagerRef.current = new WebSocketConnectionManager({
        url: `${wsBaseURL}/ws`,
        onStatusChange: setConnectionStatus,
      });
    }

    // Create checkpoint connection manager
    if (connectionType === 'sse') {
      checkpointManagerRef.current = new SSEConnectionManager({
        url: `${baseURL}/checkpoints/stream`,
        onStatusChange: (status) => {
          // Only update status if alert connection is also in same state
          if (alertManagerRef.current?.status === status) {
            setConnectionStatus(status);
          }
        },
      });
    } else {
      checkpointManagerRef.current = new WebSocketConnectionManager({
        url: `${wsBaseURL}/checkpoints/ws`,
        onStatusChange: (status) => {
          // Only update status if alert connection is also in same state
          if (alertManagerRef.current?.status === status) {
            setConnectionStatus(status);
          }
        },
      });
    }

    // Set up event handlers for alerts
    // SSE sends flat: {event: "alert", id, type, severity, title, body, source, area, timestamp}
    // WS sends nested: {event: "alert", data: {id, type, severity, ...}}
    const handleAlert = (data: unknown) => {
      const payload = data as Record<string, any>;
      // Extract alert data - handle both flat (SSE) and nested (WS) formats
      const alert: Alert = payload.data || {
        id: payload.id,
        type: payload.type,
        severity: payload.severity,
        title: payload.title,
        body: payload.body,
        source: payload.source,
        area: payload.area,
        timestamp: payload.timestamp,
        raw_text: payload.raw_text || '',
      };

      if (alert.type) {
        setAlerts(prev => [alert, ...prev].slice(0, 200));
        onAlert?.(alert);
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
      }
    };

    // Set up event handlers for checkpoint updates
    // Both SSE and WS send: {event: "checkpoint_update", updates: [...]}
    const handleCheckpointUpdate = (data: unknown) => {
      const payload = data as { event: string; updates: CheckpointUpdate[] };
      const updates = payload.updates || [];

      if (updates.length > 0) {
        setCheckpointUpdates(prev => [...updates, ...prev].slice(0, 200));
        updates.forEach(update => onCheckpointUpdate?.(update));
        queryClient.invalidateQueries({ queryKey: queryKeys.checkpoints.all });
      }
    };

    alertManagerRef.current.on('alert', handleAlert);
    checkpointManagerRef.current.on('checkpoint_update', handleCheckpointUpdate);

    // Auto-connect if enabled
    if (autoConnect) {
      alertManagerRef.current.connect();
      checkpointManagerRef.current.connect();
    }

    // Cleanup on unmount
    return () => {
      if (alertManagerRef.current) {
        alertManagerRef.current.off('alert', handleAlert);
        alertManagerRef.current.disconnect();
        alertManagerRef.current = null;
      }
      if (checkpointManagerRef.current) {
        checkpointManagerRef.current.off('checkpoint_update', handleCheckpointUpdate);
        checkpointManagerRef.current.disconnect();
        checkpointManagerRef.current = null;
      }
    };
  }, [connectionType, onAlert, onCheckpointUpdate, autoConnect, queryClient]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (alertManagerRef.current) {
      alertManagerRef.current.disconnect();
      alertManagerRef.current.connect();
    }
    if (checkpointManagerRef.current) {
      checkpointManagerRef.current.disconnect();
      checkpointManagerRef.current.connect();
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (alertManagerRef.current) {
      alertManagerRef.current.disconnect();
    }
    if (checkpointManagerRef.current) {
      checkpointManagerRef.current.disconnect();
    }
  }, []);

  return {
    alerts,
    checkpointUpdates,
    connectionStatus,
    reconnect,
    disconnect,
  };
}
