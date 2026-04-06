// Core API client with interceptors and error handling
// Provides centralized HTTP communication with type safety

import { environment } from '../../config/environment';
import {
  APIError,
  NetworkError,
  TimeoutError,
  NotFoundError,
  AuthenticationError,
  RateLimitError,
  ServerError,
} from './errors';

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface RequestInterceptor {
  onRequest: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  onResponse: (response: Response) => Response | Promise<Response>;
  onError: (error: Error) => Error | Promise<Error>;
}

interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Core API client for HTTP communication with the backend
 * Supports request/response interceptors, error transformation, and request cancellation
 */
export class APIClient {
  private config: APIClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || environment.API_BASE_URL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    // Add default interceptors
    this.addDefaultInterceptors();
  }

  /**
   * Add default request and response interceptors
   */
  private addDefaultInterceptors(): void {
    // Request interceptor for logging and common headers
    this.addRequestInterceptor({
      onRequest: (config) => {
        if (environment.ENABLE_DEBUG_LOGGING) {
          console.log(`[API] ${config.method} ${config.url}`);
        }
        return config;
      },
    });

    // Response interceptor for error transformation
    this.addResponseInterceptor({
      onResponse: (response) => {
        if (environment.ENABLE_DEBUG_LOGGING) {
          console.log(`[API] ${response.status} ${response.url}`);
        }
        return response;
      },
      onError: (error) => {
        if (environment.ENABLE_DEBUG_LOGGING) {
          console.error('[API] Error:', error);
        }
        return error;
      },
    });
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Create an AbortController for request cancellation
   */
  createAbortController(): AbortController {
    return new AbortController();
  }

  /**
   * Execute request interceptors
   */
  private async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let modifiedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor.onRequest(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Execute response interceptors
   */
  private async executeResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor.onResponse(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Execute error interceptors
   */
  private async executeErrorInterceptors(error: Error): Promise<Error> {
    let modifiedError = error;
    for (const interceptor of this.responseInterceptors) {
      modifiedError = await interceptor.onError(modifiedError);
    }
    return modifiedError;
  }

  /**
   * Transform HTTP response errors to custom error classes
   */
  private async transformError(response: Response): Promise<never> {
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    const { status } = response;

    if (status === 404) {
      throw new NotFoundError('Resource not found', responseBody);
    }

    if (status === 401) {
      throw new AuthenticationError('Authentication required', responseBody);
    }

    if (status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      throw new RateLimitError('Rate limit exceeded', retryAfter, responseBody);
    }

    if (status >= 500) {
      throw new ServerError('Server error', status, responseBody);
    }

    throw new APIError(`HTTP ${status}`, status, responseBody);
  }

  /**
   * Make an HTTP request with timeout and error handling
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const fullURL = `${this.config.baseURL}${url}`;
    const timeout = options.timeout || this.config.timeout;

    // Create timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

    // Combine user signal with timeout signal
    const signal = options.signal || timeoutController.signal;

    let requestConfig: RequestConfig = {
      url: fullURL,
      method,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
      body,
      signal,
    };

    try {
      // Execute request interceptors
      requestConfig = await this.executeRequestInterceptors(requestConfig);

      // Make the request
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined,
        signal: requestConfig.signal,
      });

      clearTimeout(timeoutId);

      // Execute response interceptors
      await this.executeResponseInterceptors(response);

      // Handle error responses
      if (!response.ok) {
        await this.transformError(response);
      }

      // Parse and return response
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new TimeoutError('Request timeout');
        throw await this.executeErrorInterceptors(timeoutError);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        const networkError = new NetworkError('Network request failed');
        throw await this.executeErrorInterceptors(networkError);
      }

      // Handle custom errors
      if (error instanceof APIError) {
        throw await this.executeErrorInterceptors(error);
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * Make a POST request
   */
  async post<T>(url: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', url, data, options);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }
}

// Export singleton instance
export const apiClient = new APIClient();
