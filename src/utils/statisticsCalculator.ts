import type { RegionInfo } from '../state/types';

export interface RegionStatistics {
  totalRegions: number;
  regionsPerColor: Map<number, number>;
  largestRegion: RegionInfo | null;
  smallestRegion: RegionInfo | null;
  averageRegionSize: number;
  colorSizes: Array<{
    colorIndex: number;
    count: number;
    totalPixels: number;
    averagePixels: number;
  }>;
}

export function calculateRegionStatistics(regions: RegionInfo[]): RegionStatistics {
  if (regions.length === 0) {
    return {
      totalRegions: 0,
      regionsPerColor: new Map(),
      largestRegion: null,
      smallestRegion: null,
      averageRegionSize: 0,
      colorSizes: [],
    };
  }

  const regionsPerColor = new Map<number, number>();
  const pixelsPerColor = new Map<number, number>();
  let largestRegion: RegionInfo | null = null;
  let smallestRegion: RegionInfo | null = null;
  let totalPixels = 0;

  for (const region of regions) {
    // Count regions and pixels per color
    regionsPerColor.set(region.colorIndex, (regionsPerColor.get(region.colorIndex) ?? 0) + 1);
    pixelsPerColor.set(
      region.colorIndex,
      (pixelsPerColor.get(region.colorIndex) ?? 0) + region.pixelCount
    );

    // Track largest and smallest
    if (!largestRegion || region.pixelCount > largestRegion.pixelCount) {
      largestRegion = region;
    }
    if (!smallestRegion || region.pixelCount < smallestRegion.pixelCount) {
      smallestRegion = region;
    }

    totalPixels += region.pixelCount;
  }

  // Build color sizes array sorted by pixel count descending
  const colorSizes = Array.from(regionsPerColor.entries())
    .map(([colorIndex, count]) => ({
      colorIndex,
      count,
      totalPixels: pixelsPerColor.get(colorIndex) ?? 0,
      averagePixels: Math.round((pixelsPerColor.get(colorIndex) ?? 0) / count),
    }))
    .sort((a, b) => b.totalPixels - a.totalPixels);

  return {
    totalRegions: regions.length,
    regionsPerColor,
    largestRegion,
    smallestRegion,
    averageRegionSize: Math.round(totalPixels / regions.length),
    colorSizes,
  };
}
