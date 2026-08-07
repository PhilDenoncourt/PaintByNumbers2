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

describe('mergeSmallRegions minThickness', () => {
  /** size x size with `inside(x, y)` marking label 1 against a label-0 background. */
  function makeMap(size: number, inside: (x: number, y: number) => boolean) {
    const labelMap = new Int32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        labelMap[y * size + x] = inside(x, y) ? 1 : 0;
      }
    }
    return labelMap;
  }

  it('absorbs a diagonal sliver that a bounding-box test would let through', () => {
    // A 3px-wide band running corner to corner: its bbox is the whole 16x16 image,
    // so only a real thickness measure catches it.
    const labelMap = makeMap(16, (x, y) => Math.abs(x - y) < 2);
    const regions = makeRegions(labelMap, [0, 1]);
    const sliverPixels = regions.find((r) => r.id === 1)!.pixelCount;

    const result = mergeSmallRegions(labelMap, regions, 16, 16, 1, palette, labPalette, {
      minThickness: 6,
    });

    expect(result.regions).toHaveLength(1);
    expect(result.regions[0].colorIndex).toBe(0);
    expect(result.regions[0].pixelCount).toBe(256);
    expect(sliverPixels).toBeGreaterThan(1); // guard: the sliver really was there
  });

  it('keeps a blob that is wide enough', () => {
    // 8x8 square centred in a 24x24 field, so the surrounding background is itself
    // 8px thick — otherwise the background is the sliver and gets merged instead.
    const labelMap = makeMap(24, (x, y) => x >= 8 && x < 16 && y >= 8 && y < 16);
    const regions = makeRegions(labelMap, [0, 1]);

    const result = mergeSmallRegions(labelMap, regions, 24, 24, 1, palette, labPalette, {
      minThickness: 6,
    });

    expect(result.regions).toHaveLength(2);
    expect(result.regions.find((r) => r.id === 1)!.pixelCount).toBe(64);
  });

  it('absorbs the thin arm case — wide bbox, narrow shape', () => {
    // A hollow ring: 2px walls, but a bbox spanning nearly the whole image.
    const labelMap = makeMap(
      16,
      (x, y) =>
        x >= 2 && x < 14 && y >= 2 && y < 14 && !(x >= 4 && x < 12 && y >= 4 && y < 12)
    );
    const regions = makeRegions(labelMap, [0, 1]);
    // The ring encloses a second label-0 component, but CCL-style ids aren't modelled
    // here — one label-0 region is enough to prove the ring gets absorbed.
    const ring = regions.find((r) => r.id === 1)!;
    expect(ring.pixelCount).toBe(144 - 64);

    const result = mergeSmallRegions(labelMap, regions, 16, 16, 1, palette, labPalette, {
      minThickness: 5,
    });

    expect(result.regions).toHaveLength(1);
    expect(result.regions[0].pixelCount).toBe(256);
  });

  it('leaves everything alone when minThickness is 1', () => {
    const labelMap = makeMap(16, (x, y) => Math.abs(x - y) < 2);
    const regions = makeRegions(labelMap, [0, 1]);

    const result = mergeSmallRegions(labelMap, regions, 16, 16, 1, palette, labPalette, {
      minThickness: 1,
    });

    expect(result.regions).toHaveLength(2);
  });
});
