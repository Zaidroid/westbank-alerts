/**
 * User-friendly error messages for API errors.
 * Translates technical error types to actionable user guidance.
 * 
 * Requirements: 3.8
 */

import { 
  APIError, 
  NetworkError, 
  TimeoutError, 
  NotFoundError, 
  AuthenticationError, 
  RateLimitError, 
  ServerError 
} from './api/errors';

/**
 * Error message structure with title, description, and action guidance
 */
export interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

/**
 * Map of error types to user-friendly messages
 * Structure supports future internationalization
 */
export const errorMessages: Record<string, ErrorMessage> = {
  NetworkError: {
    title: 'Connection Failed',
    description: 'Unable to reach the server. Please check your internet connection.',
    action: 'Check your connection and try again',
  },
  TimeoutError: {
    title: 'Request Timeout',
    description: 'The server took too long to respond.',
    action: 'Try again or check your connection speed',
  },
  NotFoundError: {
    title: 'Not Found',
    description: 'The requested resource could not be found.',
    action: 'Verify the information and try again',
  },
  AuthenticationError: {
    title: 'Authentication Required',
    description: 'You need to be authenticated to access this resource.',
    action: 'Please log in and try again',
  },
  RateLimitError: {
    title: 'Too Many Requests',
    description: 'You have made too many requests. Please wait before trying again.',
    action: 'Wait a moment and try again',
  },
  ServerError: {
    title: 'Server Error',
    description: 'The server encountered an error while processing your request.',
    action: 'Try again in a few moments',
  },
  APIError: {
    title: 'Request Failed',
    description: 'An error occurred while communicating with the server.',
    action: 'Try again',
  },
  default: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred.',
    action: 'Try again',
  },
};

/**
 * Get user-friendly error message for an error instance
 * 
 * @param error - Error instance to translate
 * @returns ErrorMessage with title, description, and action
 */
export function getErrorMessage(error: Error): ErrorMessage {
  // Check error type and return appropriate message
  if (error instanceof NetworkError) {
    return errorMessages.NetworkError;
  }
  
  if (error instanceof TimeoutError) {
    return errorMessages.TimeoutError;
  }
  
  if (error instanceof NotFoundError) {
    return errorMessages.NotFoundError;
  }
  
  if (error instanceof AuthenticationError) {
    return errorMessages.AuthenticationError;
  }
  
  if (error instanceof RateLimitError) {
    return errorMessages.RateLimitError;
  }
  
  if (error instanceof ServerError) {
    return errorMessages.ServerError;
  }
  
  if (error instanceof APIError) {
    return errorMessages.APIError;
  }
  
  // Default fallback
  return errorMessages.default;
}

/**
 * Format error for display with custom message override
 * 
 * @param error - Error instance
 * @param customMessage - Optional custom message to override default
 * @returns Formatted error message
 */
export function formatErrorForDisplay(error: Error, customMessage?: string): ErrorMessage {
  const baseMessage = getErrorMessage(error);
  
  if (customMessage) {
    return {
      ...baseMessage,
      description: customMessage,
    };
  }
  
  return baseMessage;
}

/**
 * Get HTTP status code from error if available
 * 
 * @param error - Error instance
 * @returns HTTP status code or undefined
 */
export function getErrorStatusCode(error: Error): number | undefined {
  if (error instanceof APIError) {
    return error.statusCode;
  }
  return undefined;
}
