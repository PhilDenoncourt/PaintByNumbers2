// RGB -> CIELAB conversion via XYZ (D65 illuminant)

function srgbToLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, v * 255)));
}

// D65 reference white
const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

function xyzToLabF(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
}

function labFInv(t: number): number {
  return t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787;
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // RGB -> linear -> XYZ
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / Xn;
  const y = (0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl) / Yn;
  const z = (0.0193339 * rl + 0.0961934 * gl + 0.9503041 * bl) / Zn;

  const fx = xyzToLabF(x);
  const fy = xyzToLabF(y);
  const fz = xyzToLabF(z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const x = Xn * labFInv(fx);
  const y = Yn * labFInv(fy);
  const z = Zn * labFInv(fz);

  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gl = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return [linearToSrgb(rl), linearToSrgb(gl), linearToSrgb(bl)];
}

export function labDistanceSq(
  l1: number, a1: number, b1: number,
  l2: number, a2: number, b2: number
): number {
  const dl = l1 - l2;
  const da = a1 - a2;
  const db = b1 - b2;
  return dl * dl + da * da + db * db;
}

export function labDistance(
  l1: number, a1: number, b1: number,
  l2: number, a2: number, b2: number
): number {
  return Math.sqrt(labDistanceSq(l1, a1, b1, l2, a2, b2));
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
