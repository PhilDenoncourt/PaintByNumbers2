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

// CIEDE2000 (Sharma, Wu & Dalal 2005). Unlike labDistanceSq/labDistance (ΔE76),
// this weights chroma and hue differences by local chroma, which matters for
// low-chroma colors (e.g. skin) where ΔE76 mis-ranks hue. Roughly 10× the cost
// of labDistanceSq — use for palette assignment and ranking, not inner k-means loops.
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const POW25_7 = 6103515625; // 25^7

export function deltaE2000(
  l1: number, a1: number, b1: number,
  l2: number, a2: number, b2: number
): number {
  const c1 = Math.sqrt(a1 * a1 + b1 * b1);
  const c2 = Math.sqrt(a2 * a2 + b2 * b2);
  const cBar = (c1 + c2) / 2;
  const cBar7 = Math.pow(cBar, 7);
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + POW25_7)));

  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.sqrt(a1p * a1p + b1 * b1);
  const c2p = Math.sqrt(a2p * a2p + b2 * b2);

  let h1p = a1p === 0 && b1 === 0 ? 0 : Math.atan2(b1, a1p) * RAD2DEG;
  if (h1p < 0) h1p += 360;
  let h2p = a2p === 0 && b2 === 0 ? 0 : Math.atan2(b2, a2p) * RAD2DEG;
  if (h2p < 0) h2p += 360;

  const dLp = l2 - l1;
  const dCp = c2p - c1p;

  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp / 2) * DEG2RAD);

  const lBarP = (l1 + l2) / 2;
  const cBarP = (c1p + c2p) / 2;

  let hBarP: number;
  if (c1p * c2p === 0) {
    hBarP = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hBarP = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hBarP = (h1p + h2p + 360) / 2;
  } else {
    hBarP = (h1p + h2p - 360) / 2;
  }

  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * DEG2RAD) +
    0.24 * Math.cos(2 * hBarP * DEG2RAD) +
    0.32 * Math.cos((3 * hBarP + 6) * DEG2RAD) -
    0.20 * Math.cos((4 * hBarP - 63) * DEG2RAD);

  const dTheta = 30 * Math.exp(-Math.pow((hBarP - 275) / 25, 2));
  const cBarP7 = Math.pow(cBarP, 7);
  const rc = 2 * Math.sqrt(cBarP7 / (cBarP7 + POW25_7));
  const lm50sq = (lBarP - 50) * (lBarP - 50);
  const sl = 1 + (0.015 * lm50sq) / Math.sqrt(20 + lm50sq);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin(2 * dTheta * DEG2RAD) * rc;

  const dl = dLp / sl;
  const dc = dCp / sc;
  const dh = dHp / sh;

  return Math.sqrt(dl * dl + dc * dc + dh * dh + rt * dc * dh);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
