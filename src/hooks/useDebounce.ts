/**
 * useDebounce — Generic debounce hook
 *
 * Delays updating the returned value until after the specified delay
 * has elapsed since the last change. Useful for search inputs to
 * prevent excessive re-renders and API calls on every keystroke.
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * // Only triggers filter/fetch logic 300ms after the user stops typing
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timer if value changes before delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
