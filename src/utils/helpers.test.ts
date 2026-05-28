import { formatCurrency, getMonthKey, truncate, debounce } from './helpers';

describe('helpers.ts utils', () => {
  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    });

    it('formats JPY correctly without decimals', () => {
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
    });

    it('formats AED with suffix correctly', () => {
      expect(formatCurrency(1000, 'AED')).toBe('1,000.00 د.إ');
    });
    
    it('handles negative numbers correctly', () => {
      expect(formatCurrency(-500.5, 'USD')).toBe('-$500.50');
    });
  });

  describe('getMonthKey', () => {
    it('returns YYYY-MM format correctly padded', () => {
      const date = new Date('2026-05-15T12:00:00Z');
      // JS Date.getMonth is 0-indexed, but getMonthKey adds 1 and pads
      expect(getMonthKey(date)).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('truncate', () => {
    it('truncates long strings and adds ellipsis', () => {
      expect(truncate('Hello World', 5)).toBe('Hello…');
    });

    it('does not truncate short strings', () => {
      expect(truncate('Hi', 5)).toBe('Hi');
    });
  });
  
  describe('debounce', () => {
    jest.useFakeTimers();
    it('only calls the function once after the delay', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(fn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
    afterAll(() => {
      jest.useRealTimers();
    });
  });
});
