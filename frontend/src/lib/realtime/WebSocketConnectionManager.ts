// WebSocket Connection Manager with ping/pong keepalive and automatic reconnection
import type { ConnectionStatus } from '../api/types';
import { environment } from '../../config/environment';
import type { ConnectionConfig, ConnectionManager } from './SSEConnectionManager';

type EventHandler = (data: unknown) => void;

export interface WebSocketConfig extends ConnectionConfig {
  pingInterval?: number; // Interval for sending ping messages in ms
}

export class WebSocketConnectionManager implements ConnectionManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private _status: ConnectionStatus = 'disconnected';
  private config: WebSocketConfig;
  private lastPongReceived: number | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      ...config,
      reconnectDelays: config.reconnectDelays || [2000, 5000, 10000, 30000], // Default: 2s, 5s, 10s, max 30s
      pingInterval: config.pingInterval || 25000, // Default: 25 seconds
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
        console.log(`[WebSocket] Status changed to: ${status}`);
      }
    }
  }

  connect(): void {
    if (this.socket) {
      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log('[WebSocket] Already connected or connecting');
      }
      return;
    }

    this.setStatus('connecting');

    try {
      this.socket = new WebSocket(this.config.url);

      this.socket.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0; // Reset on successful connection
        this.lastPongReceived = Date.now();
        this.startPingInterval();
        
        if (environment.ENABLE_DEBUG_LOGGING) {
          console.log('[WebSocket] Connection established');
        }
      };

      this.socket.onclose = (event) => {
        this.handleClose(event);
      };

      this.socket.onerror = (event) => {
        console.error('[WebSocket] Connection error:', event);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event);
      };

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.stopPingInterval();

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
    
    if (environment.ENABLE_DEBUG_LOGGING) {
      console.log('[WebSocket] Disconnected');
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

      // Handle keepalive responses
      if (eventType === 'ack' || eventType === 'ping') {
        this.handlePong();
        return;
      }

      if (!eventType) return;

      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log(`[WebSocket] Received ${eventType}:`, data);
      }

      // Emit to registered handlers
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`[WebSocket] Error in event handler for ${eventType}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error, event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    if (environment.ENABLE_DEBUG_LOGGING) {
      console.log(`[WebSocket] Connection closed: ${event.code} ${event.reason}`);
    }

    this.stopPingInterval();
    this.socket = null;
    this.setStatus('disconnected');
    
    // Don't reconnect if it was a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handlePong(): void {
    this.lastPongReceived = Date.now();
    
    // Reset reconnection delay on successful pong
    if (this.reconnectAttempts > 0) {
      this.reconnectAttempts = 0;
      
      if (environment.ENABLE_DEBUG_LOGGING) {
        console.log('[WebSocket] Pong received, reconnection delay reset');
      }
    }
  }

  private startPingInterval(): void {
    if (this.pingInterval !== null) {
      return; // Already started
    }

    this.pingInterval = window.setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval!);
  }

  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: 'ping' }));
        
        if (environment.ENABLE_DEBUG_LOGGING) {
          console.log('[WebSocket] Ping sent');
        }
      } catch (error) {
        console.error('[WebSocket] Failed to send ping:', error);
      }
    }
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
      console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}
