import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth hook', () => {
  it('should throw error when used outside of AuthProvider', () => {
    // Vitest/JSDOM will catch the error thrown by the hook
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });
});
