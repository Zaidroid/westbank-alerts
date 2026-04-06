import { useState, useCallback, useEffect } from 'react';
import { RateLimitError } from '@/lib/api/errors';

/**
 * Rate limit state
 */
interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number;
  reducedPolling: boolean;
}

/**
 * Hook for managing rate limit state and polling frequency adjustments.
 * Detects rate limit errors and reduces polling frequency during throttling.
 * 
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7
 */
export function useRateLimitHandler() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: 0,
    reducedPolling: false,
  });

  /**
   * Handle rate limit error by extracting retry-after duration
   */
  const handleRateLimitError = useCallback((error: Error) => {
    if (error instanceof RateLimitError) {
      const retryAfter = error.retryAfter || 60;
      
      setRateLimitState({
        isRateLimited: true,
        retryAfter,
        reducedPolling: true,
      });

      // Log rate limit event for debugging
      console.warn('[RateLimit] Rate limit encountered:', {
        retryAfter,
        timestamp: new Date().toISOString(),
      });

      return true;
    }
    return false;
  }, []);

  /**
   * Clear rate limit state when countdown completes
   */
  const clearRateLimit = useCallback(() => {
    setRateLimitState({
      isRateLimited: false,
      retryAfter: 0,
      reducedPolling: false,
    });

    console.log('[RateLimit] Rate limit cleared, resuming normal frequency');
  }, []);

  /**
   * Get adjusted polling interval based on rate limit state
   * 
   * @param normalInterval - Normal polling interval in milliseconds
   * @returns Adjusted interval (doubled if rate limited)
   */
  const getPollingInterval = useCallback(
    (normalInterval: number): number => {
      if (rateLimitState.reducedPolling) {
        // Double the polling interval during rate limit
        return normalInterval * 2;
      }
      return normalInterval;
    },
    [rateLimitState.reducedPolling]
  );

  /**
   * Check if an error is a rate limit error and handle it
   */
  const checkAndHandleRateLimit = useCallback(
    (error: Error): boolean => {
      return handleRateLimitError(error);
    },
    [handleRateLimitError]
  );

  return {
    isRateLimited: rateLimitState.isRateLimited,
    retryAfter: rateLimitState.retryAfter,
    reducedPolling: rateLimitState.reducedPolling,
    handleRateLimitError: checkAndHandleRateLimit,
    clearRateLimit,
    getPollingInterval,
  };
}
