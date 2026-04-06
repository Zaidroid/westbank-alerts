/**
 * useGeolocation Hook
 *
 * Manages user's geolocation for navigation features.
 * Handles permission requests, watches position, calculates distances.
 */

import { useState, useEffect, useCallback } from 'react';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number; // milliseconds
}

export interface UseGeolocationResult {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  startWatching: () => void;
  stopWatching: () => void;
  clearLocation: () => void;
  isSupported: boolean;
}

const GEOLOCATION_TIMEOUT = 10000; // 10 seconds
const GEOLOCATION_MAX_AGE = 60000; // 1 minute

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get bearing between two coordinates
 * Returns bearing in degrees (0-360), where 0 is north
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

/**
 * Hook for managing user geolocation
 */
export function useGeolocation(): UseGeolocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Try to restore location from localStorage on mount
  useEffect(() => {
    if (!isSupported) return;

    const stored = localStorage.getItem('wb-user-location');
    if (stored) {
      try {
        const loc = JSON.parse(stored);
        // Check if cached location is recent (less than 5 minutes)
        if (Date.now() - loc.timestamp < 5 * 60 * 1000) {
          setLocation(loc);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [isSupported]);

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const userLocation: UserLocation = {
      latitude,
      longitude,
      accuracy,
      timestamp: Date.now(),
    };
    setLocation(userLocation);
    setError(null);
    setIsLoading(false);

    // Cache location in localStorage
    localStorage.setItem('wb-user-location', JSON.stringify(userLocation));
  }, []);

  const handlePositionError = useCallback((positionError: GeolocationPositionError) => {
    let errorMsg = 'Unable to get location';

    switch (positionError.code) {
      case positionError.PERMISSION_DENIED:
        errorMsg = 'Location permission denied. Enable in settings to use navigation features.';
        break;
      case positionError.POSITION_UNAVAILABLE:
        errorMsg = 'Location unavailable. Check your GPS and try again.';
        break;
      case positionError.TIMEOUT:
        errorMsg = 'Location request timed out. Try again.';
        break;
    }

    setError(errorMsg);
    setIsLoading(false);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Geolocation is not supported on this device');
      return false;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      // Try to get high-accuracy position first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handlePositionSuccess(position);
          resolve(true);
        },
        (positionError) => {
          // If high accuracy fails, try low accuracy (cached position)
          navigator.geolocation.getCurrentPosition(
            (position) => {
              handlePositionSuccess(position);
              resolve(true);
            },
            (fallbackError) => {
              handlePositionError(fallbackError);
              resolve(false);
            },
            {
              timeout: GEOLOCATION_TIMEOUT,
              maximumAge: GEOLOCATION_MAX_AGE,
              enableHighAccuracy: false,
            }
          );
        },
        {
          timeout: GEOLOCATION_TIMEOUT,
          enableHighAccuracy: true,
        }
      );
    });
  }, [isSupported, handlePositionSuccess, handlePositionError]);

  const startWatching = useCallback(() => {
    if (!isSupported || watchId !== null) return;

    const id = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        timeout: GEOLOCATION_TIMEOUT,
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  }, [isSupported, watchId, handlePositionSuccess, handlePositionError]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    stopWatching();
    localStorage.removeItem('wb-user-location');
  }, [stopWatching]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    isLoading,
    error,
    requestPermission,
    startWatching,
    stopWatching,
    clearLocation,
    isSupported,
  };
}
