import { describe, it, expect } from 'vitest';
import { mergeSmallRegions } from '../../algorithms/regionMerge';
import type { RegionInfo } from '../../state/types';

const palette: [number, number, number][] = [
  [200, 150, 120],
  [140, 200, 90],
];
// Rough LAB equivalents — only relative distances matter for these tests
const labPalette: [number, number, number][] = [
  [66, 14, 22],
  [75, -35, 48],
];

function makeRegions(labelMap: Int32Array, colorByLabel: number[]): RegionInfo[] {
  const counts = new Map<number, number>();
  for (const label of labelMap) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, pixelCount]) => ({
    id,
    colorIndex: colorByLabel[id],
    pixelCount,
    boundingBox: { x: 0, y: 0, w: 8, h: 8 },
  }));
}

describe('mergeSmallRegions', () => {
  it('absorbed sliver at raster start adopts the target region color', () => {
    // 8x8: 2-pixel sliver (label 1, color 1) at top-left, rest is label 0 (color 0).
    // The sliver's pixels come first in raster order — before the fix, the merged
    // region took its colorIndex from those pixels.
    const labelMap = new Int32Array(64).fill(0);
    labelMap[0] = 1;
    labelMap[1] = 1;
    const regions = makeRegions(labelMap, [0, 1]);

    const result = mergeSmallRegions(labelMap, regions, 8, 8, 4, palette, labPalette);

    expect(result.regions).toHaveLength(1);
    expect(result.regions[0].colorIndex).toBe(0);
    expect(result.regions[0].pixelCount).toBe(64);
  });

  it('absorbed sliver elsewhere also adopts the target region color', () => {
    const labelMap = new Int32Array(64).fill(0);
    labelMap[62] = 1;
    labelMap[63] = 1;
    const regions = makeRegions(labelMap, [0, 1]);

    const result = mergeSmallRegions(labelMap, regions, 8, 8, 4, palette, labPalette);

    expect(result.regions).toHaveLength(1);
    expect(result.regions[0].colorIndex).toBe(0);
    expect(result.regions[0].pixelCount).toBe(64);
  });

  it('leaves regions at or above minRegionSize untouched', () => {
    // Left half label 0, right half label 1 — both 32 pixels.
    const labelMap = new Int32Array(64);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        labelMap[y * 8 + x] = x < 4 ? 0 : 1;
      }
    }
    const regions = makeRegions(labelMap, [0, 1]);

    const result = mergeSmallRegions(labelMap, regions, 8, 8, 4, palette, labPalette);

    expect(result.regions).toHaveLength(2);
    const byId = new Map(result.regions.map((r) => [r.id, r]));
    expect(byId.get(0)!.colorIndex).toBe(0);
    expect(byId.get(1)!.colorIndex).toBe(1);
  });
});
