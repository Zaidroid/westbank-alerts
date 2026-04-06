// Retry logic with exponential backoff
// Automatically retries failed requests based on error type

import {
  NetworkError,
  ServerError,
  TimeoutError,
  AuthenticationError,
  NotFoundError,
  APIError,
} from './errors';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  delays: number[]; // Delay in milliseconds for each retry attempt
  retryableErrors: Array<new (...args: any[]) => Error>;
}

/**
 * Default retry configurations by error type
 */
export const DEFAULT_RETRY_CONFIG: Record<string, RetryConfig> = {
  NetworkError: {
    maxRetries: 3,
    delays: [1000, 2000, 4000], // 1s, 2s, 4s
    retryableErrors: [NetworkError],
  },
  ServerError: {
    maxRetries: 3,
    delays: [1000, 2000, 4000], // 1s, 2s, 4s
    retryableErrors: [ServerError],
  },
  TimeoutError: {
    maxRetries: 2,
    delays: [1000, 2000], // 1s, 2s
    retryableErrors: [TimeoutError],
  },
};

/**
 * Errors that should never be retried
 */
const NON_RETRYABLE_ERRORS = [AuthenticationError, NotFoundError];

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  // Never retry authentication or not found errors
  for (const ErrorClass of NON_RETRYABLE_ERRORS) {
    if (error instanceof ErrorClass) {
      return false;
    }
  }
  
  // Retry network, server, and timeout errors
  return (
    error instanceof NetworkError ||
    error instanceof ServerError ||
    error instanceof TimeoutError
  );
}

/**
 * Get retry configuration for a specific error
 */
function getRetryConfig(error: Error): RetryConfig | null {
  if (error instanceof NetworkError) {
    return DEFAULT_RETRY_CONFIG.NetworkError;
  }
  if (error instanceof ServerError) {
    return DEFAULT_RETRY_CONFIG.ServerError;
  }
  if (error instanceof TimeoutError) {
    return DEFAULT_RETRY_CONFIG.TimeoutError;
  }
  return null;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param context - Optional context for logging
 * @returns Promise resolving to function result
 * @throws Final error after all retries exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  let lastError: Error | null = null;
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        throw lastError;
      }
      
      // Get retry configuration
      const retryConfig = getRetryConfig(lastError);
      if (!retryConfig) {
        throw lastError;
      }
      
      // Check if we've exhausted retries
      if (attempt >= retryConfig.maxRetries) {
        throw lastError;
      }
      
      // Get delay for this attempt
      const delay = retryConfig.delays[attempt] || retryConfig.delays[retryConfig.delays.length - 1];
      
      // Log retry attempt (in development mode)
      if (import.meta.env.DEV) {
        console.warn(
          `[Retry] Attempt ${attempt + 1}/${retryConfig.maxRetries} failed${context ? ` (${context})` : ''}: ${lastError.message}. Retrying in ${delay}ms...`
        );
      }
      
      // Wait before retrying
      await sleep(delay);
      
      attempt++;
    }
  }
}

/**
 * Wrap an API client method with retry logic
 * 
 * @param method - API client method to wrap
 * @returns Wrapped method with retry logic
 */
export function withRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  method: T
): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => method(...args));
  }) as T;
}
