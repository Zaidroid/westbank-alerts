import { useState, useCallback } from 'react';
import { environment } from '@/config/environment';

/**
 * Version mismatch state
 */
interface VersionMismatchState {
  hasVersionMismatch: boolean;
  currentVersion: string;
  requiredVersion: string;
}

/**
 * Hook for detecting and handling API version mismatch (HTTP 426).
 * Extracts version information from error responses.
 * 
 * Requirements: 21.5, 21.6, 21.7
 */
export function useVersionMismatch() {
  const [versionState, setVersionState] = useState<VersionMismatchState>({
    hasVersionMismatch: false,
    currentVersion: environment.API_VERSION,
    requiredVersion: '',
  });

  /**
   * Check if response is a 426 Upgrade Required error
   * Extract required version from response body
   */
  const checkVersionMismatch = useCallback((error: Error, responseBody?: unknown) => {
    // Check if error has status code 426
    const statusCode = (error as any).statusCode;
    
    if (statusCode === 426) {
      let requiredVersion = 'unknown';
      
      // Try to extract required version from response body
      if (responseBody && typeof responseBody === 'object') {
        const body = responseBody as any;
        requiredVersion = body.required_version || body.requiredVersion || body.version || 'unknown';
      }
      
      setVersionState({
        hasVersionMismatch: true,
        currentVersion: environment.API_VERSION,
        requiredVersion,
      });
      
      console.error('[VersionMismatch] API version mismatch detected:', {
        current: environment.API_VERSION,
        required: requiredVersion,
      });
      
      return true;
    }
    
    return false;
  }, []);

  /**
   * Clear version mismatch state
   */
  const clearVersionMismatch = useCallback(() => {
    setVersionState({
      hasVersionMismatch: false,
      currentVersion: environment.API_VERSION,
      requiredVersion: '',
    });
  }, []);

  return {
    hasVersionMismatch: versionState.hasVersionMismatch,
    currentVersion: versionState.currentVersion,
    requiredVersion: versionState.requiredVersion,
    checkVersionMismatch,
    clearVersionMismatch,
  };
}
