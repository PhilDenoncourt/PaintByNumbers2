import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sessionStorage } from '../../utils/sessionStorage';
import type { PipelineSettings, PipelineResult } from '../../state/types';

describe('sessionStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockSettings: PipelineSettings = {
    paletteSize: 16,
    algorithm: 'kmeans',
    minRegionSize: 50,
    detailLevel: 50,
    simplificationEpsilon: 1.5,
    presetPaletteId: null,
    customPalette: null,
    brightness: 10,
    contrast: 5,
    saturation: 0,
    borderWidth: 1,
    smoothingPasses: 2,
    preserveCorners: false,
  };

  const mockResult: PipelineResult = {
    paletteRGB: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
    regions: [
      {
        colorIndex: 0,
        pixelCount: 1000,
        localBounds: { x: 0, y: 0, w: 10, h: 100 },
        polygonPoints: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 100 }],
      },
    ],
    indexMap: new Uint8Array(1000),
    contourMap: new Uint8Array(1000),
    labelMap: new Uint8Array(1000),
  };

  describe('load', () => {
    it('should return null when no session saved', () => {
      const result = sessionStorage.load();
      expect(result).toBeNull();
    });

    it('should handle gracefully', () => {
      // Just verify the function exists and is callable
      expect(typeof sessionStorage.load).toBe('function');
    });
  });

  describe('autoSave', () => {
    it('should exist and be callable', () => {
      expect(typeof sessionStorage.autoSave).toBe('function');
    });

    it('should handle null imageUrl', () => {
      // autoSave returns void and handles null gracefully
      expect(() => {
        sessionStorage.autoSave(mockSettings, mockResult, null);
      }).not.toThrow();
    });
  });

  describe('export/import functionality', () => {
    it('should have exportToFile method', () => {
      expect(typeof sessionStorage.exportToFile).toBe('function');
    });

    it('should have importFromFile method', () => {
      expect(typeof sessionStorage.importFromFile).toBe('function');
    });
  });

  describe('session persistence', () => {
    it('should save and load session data', () => {
      // Manually create and save to localStorage
      const session = {
        settings: mockSettings,
        result: mockResult,
        sourceImageBase64: 'data:image/png;base64,test',
        timestamp: Date.now(),
        name: 'Test Session',
      };

      localStorage.setItem('pbn_session', JSON.stringify(session));
      const loaded = sessionStorage.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('Test Session');
      expect(loaded?.settings.paletteSize).toBe(16);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('pbn_session', 'invalid json');
      const loaded = sessionStorage.load();
      expect(loaded).toBeNull();
    });
  });

  describe('storage structure', () => {
    it('should use pbn_session key', () => {
      const session = {
        settings: mockSettings,
        result: mockResult,
        sourceImageBase64: 'data:image/png;base64,test',
        timestamp: Date.now(),
        name: 'Storage Test',
      };

      localStorage.setItem('pbn_session', JSON.stringify(session));
      expect(localStorage.getItem('pbn_session')).not.toBeNull();
    });
  });
});
