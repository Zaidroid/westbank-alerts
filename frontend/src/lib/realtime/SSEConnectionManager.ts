// SSE Connection Manager with automatic reconnection and exponential backoff
import type { ConnectionStatus } from '../api/types';
import { environment } from '../../config/environment';

export interface ConnectionConfig {
  url: string;
  reconnectDelays?: number[]; // Exponential backoff delays in ms
  onStatusChange?: (status: ConnectionStatus) => void;
}

export interface ConnectionManager {
  status: ConnectionStatus;
  connect(): void;
  disconnect(): void;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
}

type EventHandler = (data: unknown) => void;

export class SSEConnectionManager implements ConnectionManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private _status: ConnectionStatus = 'disconnected';
  private config: ConnectionConfig;
  private lastHeartbeat: number | null = null;

  constructor(config: ConnectionConfig) {
    this.config = {
      ...config,
      reconnectDelays: config.reconnectDelays || [2000, 5000, 10000, 30000], // Default: 2s, 5s, 10s, max 30s
    };
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.config.onStatusChange?.(status);
      
      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log(`[SSE] Status changed to: ${status}`);
      }
    }
  }

  connect(): void {
    if (this.eventSource) {
      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log('[SSE] Already connected or connecting');
      }
      return;
    }

    this.setStatus('connecting');

    try {
      this.eventSource = new EventSource(this.config.url);

      this.eventSource.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0; // Reset on successful connection
        this.lastHeartbeat = Date.now();
        
        if (environment.ENABLE_DEBUG_LOGGING) {
          console.log('[SSE] Connection established');
        }
      };

      this.eventSource.onerror = (event) => {
        this.handleError(event);
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

    } catch (error) {
      console.error('[SSE] Connection error:', error);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
    
    if (environment.ENABLE_DEBUG_LOGGING) {
      console.log('[SSE] Disconnected');
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      // Backend uses "event" field to identify message type
      const eventType = data.event;

      if (!eventType) return; // Ignore messages without event type (e.g. heartbeats)

      if (eventType === 'connected') {
        // Connection confirmation from server, update heartbeat
        this.lastHeartbeat = Date.now();
        return;
      }

      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log(`[SSE] Received ${eventType}:`, data);
      }

      // Emit to registered handlers
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`[SSE] Error in event handler for ${eventType}:`, error);
          }
        });
      }
    } catch (error) {
      // Ignore heartbeat comments (": heartbeat")
      if (typeof event.data === 'string' && event.data.trim() === '') return;
      console.error('[SSE] Failed to parse message:', error, event.data);
    }
  }

  private handleHeartbeat(event: MessageEvent): void {
    this.lastHeartbeat = Date.now();
    
    // Reset reconnection delay on successful heartbeat
    if (this.reconnectAttempts > 0) {
      this.reconnectAttempts = 0;
      
      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log('[SSE] Heartbeat received, reconnection delay reset');
      }
    }
  }

  private handleError(event: Event): void {
    console.error('[SSE] Connection error:', event);
    
    // Close the connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setStatus('disconnected');
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return; // Already scheduled
    }

    // Get delay based on attempt count (capped at max delay)
    const delays = this.config.reconnectDelays || [2000, 5000, 10000, 30000];
    const delayIndex = Math.min(this.reconnectAttempts, delays.length - 1);
    const delay = delays[delayIndex];

    if (environment.ENABLE_DEBUG_LOGGING) {
      console.log(`[SSE] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}
