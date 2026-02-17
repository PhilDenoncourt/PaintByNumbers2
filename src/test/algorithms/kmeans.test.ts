import { describe, it, expect } from 'vitest';
import { kmeansQuantize } from '../../algorithms/kmeans';

describe('kmeans quantization', () => {
  // Helper function to create test ImageData
  function createTestImage(width: number, height: number, fillColor: [number, number, number]) {
    const data = new Uint8ClampedArray(width * height * 4);
    const [r, g, b] = fillColor;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r;     // R
      data[i + 1] = g; // G
      data[i + 2] = b; // B
      data[i + 3] = 255; // A
    }
    return data;
  }

  it('should return result with all expected properties', () => {
    const pixels = createTestImage(10, 10, [255, 0, 0]);
    const result = kmeansQuantize(pixels, 10, 10, 8);
    
    expect(result).toHaveProperty('indexMap');
    expect(result).toHaveProperty('palette');
    expect(result).toHaveProperty('labPalette');
    expect(result.indexMap).toBeInstanceOf(Uint8Array);
    expect(Array.isArray(result.palette)).toBe(true);
    expect(Array.isArray(result.labPalette)).toBe(true);
  });

  it('should create palette with requested size', () => {
    const pixels = createTestImage(10, 10, [100, 150, 200]);
    const result = kmeansQuantize(pixels, 10, 10, 8);
    
    expect(result.palette).toHaveLength(8);
    expect(result.labPalette).toHaveLength(8);
  });

  it('should create correct size index map', () => {
    const width = 20, height = 15;
    const pixels = createTestImage(width, height, [50, 100, 150]);
    const result = kmeansQuantize(pixels, width, height, 6);
    
    expect(result.indexMap).toHaveLength(width * height);
  });

  it('should have valid color indices in index map', () => {
    const pixels = createTestImage(10, 10, [200, 50, 100]);
    const result = kmeansQuantize(pixels, 10, 10, 8);
    
    // Each index should be between 0 and paletteSize-1
    for (let i = 0; i < result.indexMap.length; i++) {
      expect(result.indexMap[i]).toBeGreaterThanOrEqual(0);
      expect(result.indexMap[i]).toBeLessThan(8);
    }
  });

  it('should work with small k (single color)', () => {
    const pixels = createTestImage(5, 5, [100, 100, 100]);
    const result = kmeansQuantize(pixels, 5, 5, 1);
    
    expect(result.palette).toHaveLength(1);
    expect(result.indexMap.length).toBe(25);
    // All indices should be 0
    for (let i = 0; i < result.indexMap.length; i++) {
      expect(result.indexMap[i]).toBe(0);
    }
  });

  it('should handle large palette sizes', () => {
    const pixels = createTestImage(100, 100, [50, 100, 150]);
    const result = kmeansQuantize(pixels, 100, 100, 256);
    
    expect(result.palette).toHaveLength(256);
    expect(result.labPalette).toHaveLength(256);
  });

  it('should generate progress callbacks', () => {
    const pixels = createTestImage(20, 20, [100, 100, 100]);
    const progressCalls: number[] = [];
    
    kmeansQuantize(pixels, 20, 20, 8, (percent) => {
      progressCalls.push(percent);
    });
    
    // Should have called progress at least once
    expect(progressCalls.length).toBeGreaterThan(0);
    // Final progress should be around 100
    expect(progressCalls[progressCalls.length - 1]).toBeGreaterThanOrEqual(90);
  });

  it('should produce different results for different input colors', () => {
    const pixels1 = createTestImage(10, 10, [255, 0, 0]);     // Red
    const pixels2 = createTestImage(10, 10, [0, 0, 255]);     // Blue
    const result1 = kmeansQuantize(pixels1, 10, 10, 8);
    const result2 = kmeansQuantize(pixels2, 10, 10, 8);
    
    // Palettes should be different
    let isDifferent = false;
    for (let i = 0; i < 8; i++) {
      if (result1.palette[i][0] !== result2.palette[i][0] ||
          result1.palette[i][1] !== result2.palette[i][1] ||
          result1.palette[i][2] !== result2.palette[i][2]) {
        isDifferent = true;
        break;
      }
    }
    expect(isDifferent).toBe(true);
  });

  it('should have valid RGB values in palette', () => {
    const pixels = createTestImage(30, 30, [100, 150, 200]);
    const result = kmeansQuantize(pixels, 30, 30, 12);
    
    for (const [r, g, b] of result.palette) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('should have valid LAB values in palette', () => {
    const pixels = createTestImage(30, 30, [150, 100, 50]);
    const result = kmeansQuantize(pixels, 30, 30, 10);
    
    for (const [L, a, b] of result.labPalette) {
      expect(L).toBeGreaterThanOrEqual(-10);
      expect(L).toBeLessThanOrEqual(110);
      expect(a).toBeGreaterThanOrEqual(-150);
      expect(a).toBeLessThanOrEqual(150);
      expect(b).toBeGreaterThanOrEqual(-150);
      expect(b).toBeLessThanOrEqual(150);
    }
  });
});
