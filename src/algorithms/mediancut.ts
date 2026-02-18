import { rgbToLab, labDistanceSq } from './colorUtils';

interface MedianCutResult {
  indexMap: Uint8Array;
  palette: [number, number, number][];
  labPalette: [number, number, number][];
}

interface ColorBox {
  colors: { r: number; g: number; b: number; l: number; a: number; b_: number }[];
  count: number;
}

/**
 * Convert LAB back to RGB
 */
function labToRgb(l: number, a: number, b: number): [number, number, number] {
  const fy = (l + 16) / 116;
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

  return [toSrgb(rl), toSrgb(gl), toSrgb(bl)];
}

/**
 * Find the axis with the largest range in the color box
 */
function findLargestAxis(box: ColorBox): 'l' | 'a' | 'b' {
  if (box.colors.length === 0) return 'l';

  let minL = box.colors[0].l, maxL = minL;
  let minA = box.colors[0].a, maxA = minA;
  let minB = box.colors[0].b_, maxB = minB;

  for (const color of box.colors) {
    minL = Math.min(minL, color.l);
    maxL = Math.max(maxL, color.l);
    minA = Math.min(minA, color.a);
    maxA = Math.max(maxA, color.a);
    minB = Math.min(minB, color.b_);
    maxB = Math.max(maxB, color.b_);
  }

  const rangeL = maxL - minL;
  const rangeA = maxA - minA;
  const rangeB = maxB - minB;

  if (rangeL >= rangeA && rangeL >= rangeB) return 'l';
  if (rangeA >= rangeB) return 'a';
  return 'b';
}

/**
 * Quantize an image using the Median Cut algorithm
 */
export function medianCutQuantize(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  k: number,
  onProgress?: (percent: number) => void
): MedianCutResult {
  const totalPixels = width * height;

  // Step 1: Sample pixels and convert to LAB
  onProgress?.(10);
  const stride = Math.max(1, Math.floor(totalPixels / 50000));
  const sampledColors: { r: number; g: number; b: number; l: number; a: number; b_: number }[] = [];

  for (let i = 0; i < totalPixels; i += stride) {
    const off = i * 4;
    const r = pixels[off];
    const g = pixels[off + 1];
    const b = pixels[off + 2];
    const [l, a, b_] = rgbToLab(r, g, b);
    sampledColors.push({ r, g, b, l, a, b_ });
  }

  // Step 2: Create initial box with all colors
  const boxes: ColorBox[] = [{ colors: sampledColors, count: sampledColors.length }];

  onProgress?.(20);

  // Step 3: Recursively split boxes until we have k boxes
  while (boxes.length < k) {
    // Find the box with the most colors (or largest count)
    let maxBox = 0;
    let maxCount = boxes[0].count;
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i].count > maxCount) {
        maxCount = boxes[i].count;
        maxBox = i;
      }
    }

    const boxToSplit = boxes[maxBox];
    if (boxToSplit.colors.length <= 1) break; // Can't split further

    // Find largest axis
    const axis = findLargestAxis(boxToSplit);

    // Sort by the axis
    boxToSplit.colors.sort((a, b) => {
      const aVal = axis === 'l' ? a.l : axis === 'a' ? a.a : a.b_;
      const bVal = axis === 'l' ? b.l : axis === 'a' ? b.a : b.b_;
      return aVal - bVal;
    });

    // Split at median
    const medianIdx = Math.floor(boxToSplit.colors.length / 2);
    const color1 = boxToSplit.colors.slice(0, medianIdx);
    const color2 = boxToSplit.colors.slice(medianIdx);

    // Replace the original box with two new boxes
    boxes[maxBox] = { colors: color1, count: color1.length };
    boxes.push({ colors: color2, count: color2.length });

    onProgress?.(20 + Math.round((boxes.length / k) * 50));
  }

  onProgress?.(70);

  // Step 4: Compute average color for each box (palette)
  const palette: [number, number, number][] = [];
  const labPalette: [number, number, number][] = [];

  for (const box of boxes) {
    if (box.colors.length === 0) continue;

    let sumL = 0, sumA = 0, sumB = 0;
    for (const color of box.colors) {
      sumL += color.l;
      sumA += color.a;
      sumB += color.b_;
    }

    const avgL = sumL / box.colors.length;
    const avgA = sumA / box.colors.length;
    const avgB = sumB / box.colors.length;

    labPalette.push([avgL, avgA, avgB]);
    const [r, g, b] = labToRgb(avgL, avgA, avgB);
    palette.push([r, g, b]);
  }

  // Pad palette with black if we don't have enough colors
  while (palette.length < k) {
    palette.push([0, 0, 0]);
    labPalette.push([0, 0, 0]);
  }

  // Keep only k colors
  palette.length = k;
  labPalette.length = k;

  onProgress?.(80);

  // Step 5: Build 3D LAB lookup table for fast pixel assignment
  const LUT_SIZE = 32;
  const lut = new Uint8Array(LUT_SIZE * LUT_SIZE * LUT_SIZE);

  for (let ri = 0; ri < LUT_SIZE; ri++) {
    for (let gi = 0; gi < LUT_SIZE; gi++) {
      for (let bi = 0; bi < LUT_SIZE; bi++) {
        const r = Math.round((ri / (LUT_SIZE - 1)) * 255);
        const g = Math.round((gi / (LUT_SIZE - 1)) * 255);
        const b = Math.round((bi / (LUT_SIZE - 1)) * 255);
        const [l, a, b_] = rgbToLab(r, g, b);

        let bestDist = Infinity;
        let bestC = 0;
        for (let c = 0; c < labPalette.length; c++) {
          const d = labDistanceSq(l, a, b_, labPalette[c][0], labPalette[c][1], labPalette[c][2]);
          if (d < bestDist) {
            bestDist = d;
            bestC = c;
          }
        }
        lut[ri * LUT_SIZE * LUT_SIZE + gi * LUT_SIZE + bi] = bestC;
      }
    }
  }

  onProgress?.(90);

  // Step 6: Map all pixels using LUT
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

  return { indexMap, palette, labPalette };
}
