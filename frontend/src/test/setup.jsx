// Set env before any imports!
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_REACT_APP_BACKEND_URL: 'http://localhost:3000',
    VITE_REACT_APP_ADMIN_PASSWORD: 'parkingadmin',
    VITE_MAINTENANCE_MODE: 'false',
  },
  writable: true,
  configurable: true,
});

// Also override process.env to ensure consistency
process.env.VITE_REACT_APP_ADMIN_PASSWORD = 'parkingadmin';

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as React from 'react';

// Mock fetch globally with default response
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set default fetch response
mockFetch.mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ availableSpots: [1, 2, 3, 4, 5, 6, 7] })
});

// Mock window.confirm
window.confirm = vi.fn(() => true);

// Mock react-hot-toast as a proper spy
const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign((msg) => toastSuccess(msg), {
    error: toastError,
    success: toastSuccess,
  }),
  Toaster: () => null,
}));

global.__toastError = toastError;
global.__toastSuccess = toastSuccess;

// Mock date-fns with all required exports
vi.mock('date-fns', () => ({
  isFriday: vi.fn(() => false),
  isSaturday: vi.fn(() => false),
  isSunday: vi.fn(() => false),
  startOfWeek: vi.fn(() => new Date()),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  format: vi.fn(() => '2024-01-01'),
  parse: vi.fn(() => new Date()),
  startOfToday: vi.fn(() => new Date()),
  getDay: vi.fn(() => 1),
  parseISO: vi.fn(() => new Date()),
  isBefore: vi.fn(() => false),
}));

// Mock react-datepicker
vi.mock('react-datepicker', () => ({
  default: vi.fn(() => <input data-testid="datepicker" />),
}));

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: vi.fn(() => <div data-testid="calendar">Calendar</div>),
  momentLocalizer: vi.fn(() => () => {}),
  dateFnsLocalizer: vi.fn(() => () => {}),
}));

// Mock @heroicons/react
vi.mock('@heroicons/react/24/outline', () => ({
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  TruckIcon: () => <div data-testid="truck-icon" />,
  UserIcon: () => <div data-testid="user-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  CalendarDaysIcon: () => <div data-testid="calendar-days-icon" />,
  ListBulletIcon: () => <div data-testid="list-bullet-icon" />,
}));

// Mock clsx
vi.mock('clsx', () => ({
  default: vi.fn((...args) => args.filter(Boolean).join(' ')),
}));

// Reset fetch mock before each test
beforeEach(() => {
  mockFetch.mockClear();
  // Default availability response
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ availableSpots: [1, 2, 3, 4, 5, 6, 7] })
  });
}); 