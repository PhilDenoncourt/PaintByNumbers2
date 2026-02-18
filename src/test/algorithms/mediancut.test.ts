import { describe, it, expect } from 'vitest';
import { medianCutQuantize } from '../../algorithms/mediancut';

describe('mediancut quantization', () => {
  // Helper function to create test ImageData
  function createTestImage(width: number, height: number, fillColor: [number, number, number]) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = fillColor[0];     // R
      data[i * 4 + 1] = fillColor[1]; // G
      data[i * 4 + 2] = fillColor[2]; // B
      data[i * 4 + 3] = 255;          // A
    }
    return data;
  }

  it('should return result with all expected properties', () => {
    const pixels = createTestImage(10, 10, [255, 0, 0]);
    const result = medianCutQuantize(pixels, 10, 10, 8);
    
    expect(result).toHaveProperty('indexMap');
    expect(result).toHaveProperty('palette');
    expect(result).toHaveProperty('labPalette');
    expect(result.indexMap).toBeInstanceOf(Uint8Array);
    expect(Array.isArray(result.palette)).toBe(true);
    expect(Array.isArray(result.labPalette)).toBe(true);
  });

  it('should create palette with requested size', () => {
    const pixels = createTestImage(10, 10, [100, 150, 200]);
    const result = medianCutQuantize(pixels, 10, 10, 8);
    
    expect(result.palette).toHaveLength(8);
    expect(result.labPalette).toHaveLength(8);
  });

  it('should create correct size index map', () => {
    const width = 20, height = 15;
    const pixels = createTestImage(width, height, [50, 100, 150]);
    const result = medianCutQuantize(pixels, width, height, 6);
    
    expect(result.indexMap).toHaveLength(width * height);
  });

  it('should have valid color indices in index map', () => {
    const pixels = createTestImage(10, 10, [200, 50, 100]);
    const result = medianCutQuantize(pixels, 10, 10, 8);
    
    // Each index should be between 0 and paletteSize-1
    for (let i = 0; i < result.indexMap.length; i++) {
      expect(result.indexMap[i]).toBeGreaterThanOrEqual(0);
      expect(result.indexMap[i]).toBeLessThan(8);
    }
  });

  it('should handle different palette sizes', () => {
    const pixels = createTestImage(10, 10, [100, 100, 100]);
    
    for (const k of [4, 8, 16, 32]) {
      const result = medianCutQuantize(pixels, 10, 10, k);
      expect(result.palette).toHaveLength(k);
      expect(result.labPalette).toHaveLength(k);
    }
  });

  it('should generate progress callbacks', () => {
    const pixels = createTestImage(20, 20, [100, 100, 100]);
    const progressCalls: number[] = [];
    
    medianCutQuantize(pixels, 20, 20, 8, (percent) => {
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
    
    const result1 = medianCutQuantize(pixels1, 10, 10, 8);
    const result2 = medianCutQuantize(pixels2, 10, 10, 8);
    
    // Palettes should be different
    let allSame = true;
    for (let i = 0; i < 8; i++) {
      if (result1.palette[i][0] !== result2.palette[i][0] ||
          result1.palette[i][1] !== result2.palette[i][1] ||
          result1.palette[i][2] !== result2.palette[i][2]) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(false);
  });

  it('should handle large palette sizes', () => {
    const pixels = createTestImage(20, 20, [100, 100, 100]);
    const result = medianCutQuantize(pixels, 20, 20, 256);
    expect(result.palette).toHaveLength(256);
    expect(result.labPalette).toHaveLength(256);
  });

  it('should produce consistent results for uniform color', () => {
    const pixels = createTestImage(10, 10, [128, 128, 128]);
    const result = medianCutQuantize(pixels, 10, 10, 8);
    
    // All indices should map to the same color (within rounding)
    const firstIdx = result.indexMap[0];
    let allSame = true;
    for (let i = 1; i < result.indexMap.length; i++) {
      if (result.indexMap[i] !== firstIdx) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(true);
  });
});
