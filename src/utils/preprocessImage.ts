/**
 * Image preprocessing utilities for brightness, contrast, saturation, and sharpness adjustments
 */

export interface PreprocessingSettings {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number;  // -100 (blur) to 100 (sharpen)
}

/**
 * Apply preprocessing adjustments to image data
 * Modifies the ImageData in-place
 */
export function applyPreprocessing(
  imageData: ImageData,
  settings: PreprocessingSettings
): void {
  // Apply sharpness/blur first (spatial operation requiring neighbor access)
  if (settings.sharpness !== 0) {
    applySharpness(imageData, settings.sharpness);
  }

  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Apply brightness
    let [nr, ng, nb] = applyBrightness(r, g, b, settings.brightness);

    // Apply contrast
    [nr, ng, nb] = applyContrast(nr, ng, nb, settings.contrast);

    // Apply saturation
    [nr, ng, nb] = applySaturation(nr, ng, nb, settings.saturation);

    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
    // Alpha channel (i + 3) remains unchanged
  }
}

/**
 * Apply sharpness adjustment (blur or sharpen) via convolution
 * @param imageData - ImageData to modify in-place
 * @param sharpness - -100 (max blur) to 100 (max sharpen)
 */
function applySharpness(imageData: ImageData, sharpness: number): void {
  if (sharpness < 0) {
    // Blur: separable box blur with strength-based radius, blended with original
    const strength = Math.abs(sharpness) / 100;
    const radius = Math.max(1, Math.ceil(strength * 3));
    const original = new Uint8ClampedArray(imageData.data);
    applyBoxBlur(imageData, radius);
    // Blend: lerp between original and blurred by strength for smooth gradation
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = Math.round(original[i]     + (data[i]     - original[i])     * strength);
      data[i + 1] = Math.round(original[i + 1] + (data[i + 1] - original[i + 1]) * strength);
      data[i + 2] = Math.round(original[i + 2] + (data[i + 2] - original[i + 2]) * strength);
    }
  } else {
    // Sharpen: Laplacian cross kernel with strength-scaled center weight
    const k = (sharpness / 100) * 1.5; // 0 to 1.5
    applySharpenKernel(imageData, k);
  }
}

/**
 * Separable box blur (horizontal + vertical pass) for performance
 */
function applyBoxBlur(imageData: ImageData, radius: number): void {
  const { data, width, height } = imageData;
  const tmp = new Uint8ClampedArray(data.length);
  const diameter = 2 * radius + 1;

  // Horizontal pass: data -> tmp
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = Math.min(Math.max(x + dx, 0), width - 1);
        const idx = (y * width + nx) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
      }
      const i = (y * width + x) * 4;
      tmp[i]     = r / diameter;
      tmp[i + 1] = g / diameter;
      tmp[i + 2] = b / diameter;
      tmp[i + 3] = data[i + 3];
    }
  }

  // Vertical pass: tmp -> data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = Math.min(Math.max(y + dy, 0), height - 1);
        const idx = (ny * width + x) * 4;
        r += tmp[idx];
        g += tmp[idx + 1];
        b += tmp[idx + 2];
      }
      const i = (y * width + x) * 4;
      data[i]     = r / diameter;
      data[i + 1] = g / diameter;
      data[i + 2] = b / diameter;
    }
  }
}

/**
 * Laplacian cross-shaped sharpen kernel:
 *   [ 0, -k,  0]
 *   [-k, 1+4k,-k]
 *   [ 0, -k,  0]
 */
function applySharpenKernel(imageData: ImageData, k: number): void {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const center = 1 + 4 * k;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = (Math.max(y - 1, 0) * width + x) * 4;
      const s = (Math.min(y + 1, height - 1) * width + x) * 4;
      const w = (y * width + Math.max(x - 1, 0)) * 4;
      const e = (y * width + Math.min(x + 1, width - 1)) * 4;

      for (let c = 0; c < 3; c++) {
        result[i + c] = clamp(
          center * data[i + c] - k * (data[n + c] + data[s + c] + data[w + c] + data[e + c]),
          0, 255
        );
      }
      result[i + 3] = data[i + 3];
    }
  }
  data.set(result);
}

/**
 * Apply brightness adjustment
 * @param r, g, b - RGB values (0-255)
 * @param brightness - -100 to 100
 */
function applyBrightness(r: number, g: number, b: number, brightness: number): [number, number, number] {
  if (brightness === 0) return [r, g, b];
  
  const factor = brightness / 100;
  
  return [
    clamp(r + 255 * factor, 0, 255),
    clamp(g + 255 * factor, 0, 255),
    clamp(b + 255 * factor, 0, 255),
  ];
}

/**
 * Apply contrast adjustment
 * @param r, g, b - RGB values (0-255)
 * @param contrast - -100 to 100
 */
function applyContrast(r: number, g: number, b: number, contrast: number): [number, number, number] {
  if (contrast === 0) return [r, g, b];
  
  const factor = (100 + contrast) / 100;
  const intercept = 128 * (1 - factor);
  
  return [
    clamp(r * factor + intercept, 0, 255),
    clamp(g * factor + intercept, 0, 255),
    clamp(b * factor + intercept, 0, 255),
  ];
}

/**
 * Apply saturation adjustment
 * @param r, g, b - RGB values (0-255)
 * @param saturation - -100 to 100
 */
function applySaturation(r: number, g: number, b: number, saturation: number): [number, number, number] {
  if (saturation === 0) return [r, g, b];
  
  // Convert RGB to HSL
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Adjust saturation
  const newSaturation = clamp(s + (saturation / 100) * (saturation > 0 ? 1 - s : s), 0, 1);
  
  // Convert back to RGB
  return hslToRgb(h, newSaturation, l);
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    // Achromatic
    return [0, 0, l];
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  
  return [h, s, l];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    // Achromatic
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
  ];
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
