import { renderHook, act } from '@testing-library/react-native';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  // Reset store before each test to ensure a clean slate
  beforeEach(() => {
    act(() => {
      useAppStore.getState().reset();
    });
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useAppStore());
    
    expect(result.current.isOnboarded).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.language).toBe('en');
    expect(result.current.currency).toBe('INR');
    expect(result.current.budgetAlertsEnabled).toBe(true);
    expect(result.current.isAppLockEnabled).toBe(false);
  });

  it('updates language correctly', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.setLanguage('es');
    });
    
    expect(result.current.language).toBe('es');
  });

  it('updates currency correctly', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.setCurrency('USD');
    });
    
    expect(result.current.currency).toBe('USD');
  });

  it('toggles App Lock setting securely', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.setAppLockEnabled(true);
    });
    
    expect(result.current.isAppLockEnabled).toBe(true);
  });
  
  it('resets completely when reset() is called', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.setLanguage('fr');
      result.current.setCurrency('EUR');
      result.current.setAppLockEnabled(true);
    });
    
    // Validate it changed
    expect(result.current.language).toBe('fr');
    
    act(() => {
      result.current.reset();
    });
    
    // Validate it went back to defaults
    expect(result.current.language).toBe('en');
    expect(result.current.currency).toBe('INR');
    expect(result.current.isAppLockEnabled).toBe(false);
  });
});
