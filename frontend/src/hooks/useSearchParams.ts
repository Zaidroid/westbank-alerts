import { useLocation, useSearch } from 'wouter';
import { useCallback } from 'react';

/**
 * Hook to manage URL search parameters with Wouter
 * 
 * @returns Object with searchParams and setSearchParam function
 * 
 * @example
 * ```tsx
 * const { searchParams, setSearchParam } = useSearchParams();
 * 
 * // Get a parameter
 * const query = searchParams.get('q');
 * 
 * // Set a parameter (updates URL without reload)
 * setSearchParam('q', 'search term');
 * 
 * // Remove a parameter
 * setSearchParam('q', null);
 * ```
 */
export function useSearchParams() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  
  const searchParams = new URLSearchParams(searchString);

  const setSearchParam = useCallback((key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchString);
    
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    
    const newSearch = newParams.toString();
    const newUrl = newSearch ? `${location.split('?')[0]}?${newSearch}` : location.split('?')[0];
    
    // Update URL without triggering page reload
    setLocation(newUrl, { replace: true });
  }, [location, searchString, setLocation]);

  const setSearchParams = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchString);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    const newSearch = newParams.toString();
    const newUrl = newSearch ? `${location.split('?')[0]}?${newSearch}` : location.split('?')[0];
    
    setLocation(newUrl, { replace: true });
  }, [location, searchString, setLocation]);

  return { searchParams, setSearchParam, setSearchParams };
}
