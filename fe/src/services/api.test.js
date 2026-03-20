import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios BEFORE importing api
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Import after mock
import api from './api';

describe('API Service', () => {
  it('should register interceptors during initialization', () => {
    // Check if use() was called on interceptors
    expect(api.interceptors.request.use).toHaveBeenCalled();
    expect(api.interceptors.response.use).toHaveBeenCalled();
  });
});
