// Custom error classes for API client
// Provides type-safe error handling with HTTP status codes and response bodies

/**
 * Base class for all API-related errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Network connectivity error (no response received)
 */
export class NetworkError extends APIError {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Request timeout error (exceeded configured timeout)
 */
export class TimeoutError extends APIError {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Resource not found error (HTTP 404)
 */
export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found', responseBody?: unknown) {
    super(message, 404, responseBody);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Authentication error (HTTP 401)
 */
export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', responseBody?: unknown) {
    super(message, 401, responseBody);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Rate limit error (HTTP 429)
 * Includes retry-after duration in seconds
 */
export class RateLimitError extends APIError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter: number = 60,
    responseBody?: unknown
  ) {
    super(message, 429, responseBody);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Server error (HTTP 500-599)
 */
export class ServerError extends APIError {
  constructor(message: string = 'Server error', statusCode: number = 500, responseBody?: unknown) {
    super(message, statusCode, responseBody);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}
