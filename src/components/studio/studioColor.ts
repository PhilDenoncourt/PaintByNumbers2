/** Color helpers for the Open Studio palette presentation (paint drops, spectrum). */

export type RGB = [number, number, number];

export function rgbCss([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Mix a color toward white by `amt` (0–1) — the radial-gradient sheen highlight. */
export function lighten([r, g, b]: RGB, amt: number): string {
  const m = (v: number) => Math.round(v + (255 - v) * amt);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** Auto-contrast text color for a number sitting on a swatch. */
export function textOn([r, g, b]: RGB): string {
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? 'rgba(0,0,0,.62)' : 'rgba(255,255,255,.92)';
}
