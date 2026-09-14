import { describe, expect, it } from 'vitest';
import { kmeansQuantize } from '../../algorithms/kmeans';
import { medianCutQuantize } from '../../algorithms/mediancut';
import limits from '../../data/automaticPaletteLimits.json';

describe('automatic palettes at the UI ceiling', () => {
  it.each([
    ['K-Means', kmeansQuantize],
    ['Median-Cut', medianCutQuantize],
  ] as const)('%s maps a multicolor image with more than 30 usable colors', (_name, quantize) => {
    const width = 64;
    const height = 64;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        pixels.set([x * 4, y * 4, ((x + y) % 64) * 4, 255], (y * width + x) * 4);
      }
    }
    const result = quantize(pixels, width, height, limits.max);
    expect(result.palette).toHaveLength(100);
    expect(result.indexMap).toHaveLength(width * height);
    const usedIndices = [...new Set(result.indexMap)];
    expect(usedIndices.length).toBeGreaterThan(30);
    expect(Math.max(...usedIndices)).toBeLessThan(result.palette.length);
    for (const color of result.palette) {
      for (const channel of color) {
        expect(Number.isFinite(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });
});
