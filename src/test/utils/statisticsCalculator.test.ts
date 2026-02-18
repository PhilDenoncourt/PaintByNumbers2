import { describe, it, expect } from 'vitest';
import { calculateRegionStatistics } from '../../utils/statisticsCalculator';
import type { RegionInfo } from '../../state/types';

describe('statisticsCalculator', () => {
  describe('calculateRegionStatistics', () => {
    it('should handle empty regions array', () => {
      const stats = calculateRegionStatistics([]);
      expect(stats.totalRegions).toBe(0);
      expect(stats.largestRegion).toBeNull();
      expect(stats.smallestRegion).toBeNull();
      expect(stats.averageRegionSize).toBe(0);
      expect(stats.colorSizes).toEqual([]);
    });

    it('should calculate statistics for single region', () => {
      const regions: RegionInfo[] = [
        {
          id: 0,
          colorIndex: 0,
          pixelCount: 100,
          boundingBox: { x: 0, y: 0, w: 10, h: 10 },
        },
      ];
      const stats = calculateRegionStatistics(regions);
      expect(stats.totalRegions).toBe(1);
      expect(stats.largestRegion?.pixelCount).toBe(100);
      expect(stats.smallestRegion?.pixelCount).toBe(100);
      expect(stats.averageRegionSize).toBe(100);
      expect(stats.regionsPerColor.get(0)).toBe(1);
    });

    it('should identify largest and smallest regions', () => {
      const regions: RegionInfo[] = [
        { id: 0, colorIndex: 0, pixelCount: 50, boundingBox: { x: 0, y: 0, w: 5, h: 10 } },
        { id: 1, colorIndex: 1, pixelCount: 200, boundingBox: { x: 0, y: 0, w: 10, h: 20 } },
        { id: 2, colorIndex: 0, pixelCount: 100, boundingBox: { x: 0, y: 0, w: 10, h: 10 } },
      ];
      const stats = calculateRegionStatistics(regions);
      expect(stats.largestRegion?.pixelCount).toBe(200);
      expect(stats.smallestRegion?.pixelCount).toBe(50);
    });

    it('should count regions per color', () => {
      const regions: RegionInfo[] = [
        { id: 0, colorIndex: 0, pixelCount: 100, boundingBox: { x: 0, y: 0, w: 10, h: 10 } },
        { id: 1, colorIndex: 0, pixelCount: 150, boundingBox: { x: 0, y: 0, w: 10, h: 15 } },
        { id: 2, colorIndex: 1, pixelCount: 75, boundingBox: { x: 0, y: 0, w: 5, h: 15 } },
      ];
      const stats = calculateRegionStatistics(regions);
      expect(stats.regionsPerColor.get(0)).toBe(2);
      expect(stats.regionsPerColor.get(1)).toBe(1);
    });

    it('should calculate average region size', () => {
      const regions: RegionInfo[] = [
        { id: 0, colorIndex: 0, pixelCount: 100, boundingBox: { x: 0, y: 0, w: 10, h: 10 } },
        { id: 1, colorIndex: 0, pixelCount: 200, boundingBox: { x: 0, y: 0, w: 10, h: 20 } },
        { id: 2, colorIndex: 0, pixelCount: 300, boundingBox: { x: 0, y: 0, w: 10, h: 30 } },
      ];
      const stats = calculateRegionStatistics(regions);
      expect(stats.averageRegionSize).toBe(200);
    });

    it('should build color sizes array sorted by pixel count', () => {
      const regions: RegionInfo[] = [
        { id: 0, colorIndex: 0, pixelCount: 100, boundingBox: { x: 0, y: 0, w: 10, h: 10 } },
        { id: 1, colorIndex: 1, pixelCount: 150, boundingBox: { x: 0, y: 0, w: 10, h: 15 } },
        { id: 2, colorIndex: 2, pixelCount: 200, boundingBox: { x: 0, y: 0, w: 10, h: 20 } },
      ];
      const stats = calculateRegionStatistics(regions);
      expect(stats.colorSizes).toHaveLength(3);
      expect(stats.colorSizes[0].colorIndex).toBe(1); // 300 pixels
      expect(stats.colorSizes[1].colorIndex).toBe(2); // 200 pixels
      expect(stats.colorSizes[2].colorIndex).toBe(0); // 150 pixels
    });

    it('should calculate average pixels per region for each color', () => {
      const regions: RegionInfo[] = [
        { id: 0, colorIndex: 0, pixelCount: 100, boundingBox: { x: 0, y: 0, w: 10, h: 10 } },
        { id: 1, colorIndex: 0, pixelCount: 200, boundingBox: { x: 0, y: 0, w: 10, h: 20 } },
        { id: 2, colorIndex: 1, pixelCount: 150, boundingBox: { x: 0, y: 0, w: 10, h: 15 } },
      ];
      const stats = calculateRegionStatistics(regions);
      const color0 = stats.colorSizes.find(c => c.colorIndex === 0);
      const color1 = stats.colorSizes.find(c => c.colorIndex === 1);
      expect(color0?.averagePixels).toBe(150); // (100 + 200) / 2
      expect(color1?.averagePixels).toBe(150); // 150 / 1
    });
  });
});
