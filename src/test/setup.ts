import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Web Workers for tests
global.Worker = vi.fn(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onmessage: null,
  onerror: null,
})) as unknown as typeof Worker;

// Mock ImageData if not available
if (typeof ImageData === 'undefined') {
  (global as unknown as { ImageData: typeof ImageData }).ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(data: Uint8ClampedArray | number[], width: number, height?: number) {
      if (typeof data === 'number') {
        this.width = data;
        this.height = width;
        this.data = new Uint8ClampedArray(data * width * (height ?? 1) * 4);
      } else {
        this.data = new Uint8ClampedArray(data);
        this.width = width;
        this.height = height || 0;
      }
    }
  } as unknown as typeof ImageData;
}
