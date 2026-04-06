/**
 * Error handling utilities and components
 * Centralized exports for error handling system
 */

// Error classes
export {
  APIError,
  NetworkError,
  TimeoutError,
  NotFoundError,
  AuthenticationError,
  RateLimitError,
  ServerError,
} from './api/errors';

// Error messages
export {
  getErrorMessage,
  formatErrorForDisplay,
  getErrorStatusCode,
  errorMessages,
  type ErrorMessage,
} from './errorMessages';

// Components
export { ErrorBoundary } from '@/components/ErrorBoundary';
export { AppErrorFallback } from '@/components/AppErrorFallback';
export { ComponentErrorFallback } from '@/components/ComponentErrorFallback';
export { RateLimitNotification } from '@/components/RateLimitNotification';
export { VersionMismatchError } from '@/components/VersionMismatchError';

// Hooks
export { useRateLimitHandler } from '@/hooks/useRateLimitHandler';
export { useVersionMismatch } from '@/hooks/useVersionMismatch';
