/**
 * Image preprocessing utilities for brightness, contrast, and saturation adjustments
 */

export interface PreprocessingSettings {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
}

/**
 * Apply preprocessing adjustments to image data
 * Modifies the ImageData in-place
 */
export function applyPreprocessing(
  imageData: ImageData,
  settings: PreprocessingSettings
): void {
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
