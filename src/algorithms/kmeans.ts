import { rgbToLab, labDistanceSq } from './colorUtils';

interface KMeansResult {
  indexMap: Uint8Array;
  palette: [number, number, number][];
  labPalette: [number, number, number][];
}

export function kmeansQuantize(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  k: number,
  onProgress?: (percent: number) => void
): KMeansResult {
  const totalPixels = width * height;
  const maxSamples = 50000;

  // Step 1: Sample pixels and convert to LAB
  const stride = Math.max(1, Math.floor(totalPixels / maxSamples));
  const samplesL: number[] = [];
  const samplesA: number[] = [];
  const samplesB: number[] = [];

  for (let i = 0; i < totalPixels; i += stride) {
    const off = i * 4;
    const [l, a, b] = rgbToLab(pixels[off], pixels[off + 1], pixels[off + 2]);
    samplesL.push(l);
    samplesA.push(a);
    samplesB.push(b);
  }

  const nSamples = samplesL.length;

  // Step 2: k-means++ initialization
  const centL = new Float64Array(k);
  const centA = new Float64Array(k);
  const centB = new Float64Array(k);

  // First centroid: random sample
  let idx = Math.floor(Math.random() * nSamples);
  centL[0] = samplesL[idx];
  centA[0] = samplesA[idx];
  centB[0] = samplesB[idx];

  const minDists = new Float64Array(nSamples).fill(Infinity);

  for (let c = 1; c < k; c++) {
    // Update distances to nearest centroid
    let totalWeight = 0;
    for (let i = 0; i < nSamples; i++) {
      const d = labDistanceSq(
        samplesL[i], samplesA[i], samplesB[i],
        centL[c - 1], centA[c - 1], centB[c - 1]
      );
      if (d < minDists[i]) minDists[i] = d;
      totalWeight += minDists[i];
    }

    // Weighted random selection
    let threshold = Math.random() * totalWeight;
    let cumulative = 0;
    let chosen = 0;
    for (let i = 0; i < nSamples; i++) {
      cumulative += minDists[i];
      if (cumulative >= threshold) {
        chosen = i;
        break;
      }
    }

    centL[c] = samplesL[chosen];
    centA[c] = samplesA[chosen];
    centB[c] = samplesB[chosen];
  }

  onProgress?.(10);

  // Step 3: Lloyd's iteration
  const assignments = new Uint8Array(nSamples);
  const maxIterations = 20;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each sample to nearest centroid
    for (let i = 0; i < nSamples; i++) {
      let bestDist = Infinity;
      let bestC = 0;
      for (let c = 0; c < k; c++) {
        const d = labDistanceSq(
          samplesL[i], samplesA[i], samplesB[i],
          centL[c], centA[c], centB[c]
        );
        if (d < bestDist) {
          bestDist = d;
          bestC = c;
        }
      }
      assignments[i] = bestC;
    }

    // Recompute centroids
    const sumL = new Float64Array(k);
    const sumA = new Float64Array(k);
    const sumB = new Float64Array(k);
    const counts = new Uint32Array(k);

    for (let i = 0; i < nSamples; i++) {
      const c = assignments[i];
      sumL[c] += samplesL[i];
      sumA[c] += samplesA[i];
      sumB[c] += samplesB[i];
      counts[c]++;
    }

    let maxShift = 0;
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      const newL = sumL[c] / counts[c];
      const newA = sumA[c] / counts[c];
      const newB = sumB[c] / counts[c];
      const shift = labDistanceSq(centL[c], centA[c], centB[c], newL, newA, newB);
      if (shift > maxShift) maxShift = shift;
      centL[c] = newL;
      centA[c] = newA;
      centB[c] = newB;
    }

    onProgress?.(10 + Math.round((iter / maxIterations) * 40));

    if (maxShift < 0.25) break; // 0.5^2
  }

  onProgress?.(50);

  // Step 4: Build 3D RGB lookup table for fast all-pixel assignment
  const LUT_SIZE = 32;
  const lut = new Uint8Array(LUT_SIZE * LUT_SIZE * LUT_SIZE);

  // Pre-convert centroids to LAB (they already are)
  for (let ri = 0; ri < LUT_SIZE; ri++) {
    for (let gi = 0; gi < LUT_SIZE; gi++) {
      for (let bi = 0; bi < LUT_SIZE; bi++) {
        const r = Math.round((ri / (LUT_SIZE - 1)) * 255);
        const g = Math.round((gi / (LUT_SIZE - 1)) * 255);
        const b = Math.round((bi / (LUT_SIZE - 1)) * 255);
        const [l, a, bv] = rgbToLab(r, g, b);

        let bestDist = Infinity;
        let bestC = 0;
        for (let c = 0; c < k; c++) {
          const d = labDistanceSq(l, a, bv, centL[c], centA[c], centB[c]);
          if (d < bestDist) {
            bestDist = d;
            bestC = c;
          }
        }
        lut[ri * LUT_SIZE * LUT_SIZE + gi * LUT_SIZE + bi] = bestC;
      }
    }
  }

  onProgress?.(70);

  // Step 5: Map all pixels using LUT
  const indexMap = new Uint8Array(totalPixels);
  const scale = (LUT_SIZE - 1) / 255;

  for (let i = 0; i < totalPixels; i++) {
    const off = i * 4;
    const ri = Math.round(pixels[off] * scale);
    const gi = Math.round(pixels[off + 1] * scale);
    const bi = Math.round(pixels[off + 2] * scale);
    indexMap[i] = lut[ri * LUT_SIZE * LUT_SIZE + gi * LUT_SIZE + bi];
  }

  onProgress?.(90);

  // Build RGB palette from LAB centroids
  const palette: [number, number, number][] = [];
  const labPalette: [number, number, number][] = [];
  for (let c = 0; c < k; c++) {
    const L = centL[c], a = centA[c], b = centB[c];
    labPalette.push([L, a, b]);
    // Convert LAB back to RGB
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
    const labFInv = (t: number) => t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787;

    const x = Xn * labFInv(fx);
    const y = Yn * labFInv(fy);
    const z = Zn * labFInv(fz);

    const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
    const gl = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
    const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

    const toSrgb = (c: number) => {
      const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      return Math.round(Math.max(0, Math.min(255, v * 255)));
    };

    palette.push([toSrgb(rl), toSrgb(gl), toSrgb(bl)]);
  }

  onProgress?.(100);

  return { indexMap, palette, labPalette };
}

/**
 * Quantize an image using a pre-defined fixed palette.
 * Instead of computing centroids, we just map every pixel to the nearest
 * color in the provided palette using a 3D LUT in LAB space.
 */
export function fixedPaletteQuantize(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  fixedPalette: [number, number, number][],
  onProgress?: (percent: number) => void
): { indexMap: Uint8Array; palette: [number, number, number][]; labPalette: [number, number, number][] } {
  const totalPixels = width * height;
  const k = fixedPalette.length;

  // Convert the fixed palette to LAB
  const centL = new Float64Array(k);
  const centA = new Float64Array(k);
  const centB = new Float64Array(k);
  const labPalette: [number, number, number][] = [];

  for (let c = 0; c < k; c++) {
    const [l, a, b] = rgbToLab(fixedPalette[c][0], fixedPalette[c][1], fixedPalette[c][2]);
    centL[c] = l;
    centA[c] = a;
    centB[c] = b;
    labPalette.push([l, a, b]);
  }

  onProgress?.(20);

  // Build 3D RGB lookup table for fast assignment
  const LUT_SIZE = 32;
  const lut = new Uint8Array(LUT_SIZE * LUT_SIZE * LUT_SIZE);

  for (let ri = 0; ri < LUT_SIZE; ri++) {
    for (let gi = 0; gi < LUT_SIZE; gi++) {
      for (let bi = 0; bi < LUT_SIZE; bi++) {
        const r = Math.round((ri / (LUT_SIZE - 1)) * 255);
        const g = Math.round((gi / (LUT_SIZE - 1)) * 255);
        const b = Math.round((bi / (LUT_SIZE - 1)) * 255);
        const [l, a, bv] = rgbToLab(r, g, b);

        let bestDist = Infinity;
        let bestC = 0;
        for (let c = 0; c < k; c++) {
          const d = labDistanceSq(l, a, bv, centL[c], centA[c], centB[c]);
          if (d < bestDist) {
            bestDist = d;
            bestC = c;
          }
        }
        lut[ri * LUT_SIZE * LUT_SIZE + gi * LUT_SIZE + bi] = bestC;
      }
    }
  }

  onProgress?.(60);

  // Map all pixels using LUT
  const indexMap = new Uint8Array(totalPixels);
  const scale = (LUT_SIZE - 1) / 255;

  for (let i = 0; i < totalPixels; i++) {
    const off = i * 4;
    const ri = Math.round(pixels[off] * scale);
    const gi = Math.round(pixels[off + 1] * scale);
    const bi = Math.round(pixels[off + 2] * scale);
    indexMap[i] = lut[ri * LUT_SIZE * LUT_SIZE + gi * LUT_SIZE + bi];
  }

  onProgress?.(100);

  // Use the original RGB values as the palette (not re-derived from LAB)
  const palette: [number, number, number][] = fixedPalette.map((c) => [...c] as [number, number, number]);

  return { indexMap, palette, labPalette };
}
