import type { LabelPlacement, LabelOverride, NumberFont } from '../state/types';

/**
 * Number-label sizing and positioning — the single source of truth.
 *
 * The font-size formula used to be copy-pasted into six files (three renderers, three
 * exporters). Everything now goes through `computeRenderLabels` so the canvas, the reveal
 * overlay, paint mode, and the SVG/PNG/PDF exporters can never disagree.
 */

export const LABEL_FONT_MIN = 5;
export const LABEL_FONT_MAX = 14;

export interface NumberFontSpec {
  /** CSS font-family stack — used by canvas, SVG, and the DOM drag ghost. */
  css: string;
  /** jsPDF standard family. jsPDF ships only these three, hence the limited choice. */
  pdf: 'helvetica' | 'times' | 'courier';
}

/** Generic fallbacks are deliberate: exported SVGs open on machines without these fonts. */
export const NUMBER_FONTS: Record<NumberFont, NumberFontSpec> = {
  sans: { css: 'Arial, Helvetica, sans-serif', pdf: 'helvetica' },
  serif: { css: 'Georgia, "Times New Roman", Times, serif', pdf: 'times' },
  mono: { css: '"Courier New", Courier, monospace', pdf: 'courier' },
};

export const DEFAULT_NUMBER_FONT: NumberFont = 'sans';

export interface RenderLabel {
  regionId: number;
  colorIndex: number;
  /** Image coords — the user's override position when one exists. */
  x: number;
  y: number;
  /** Image-space font size, with `numberScale` already applied. */
  fontSize: number;
  /**
   * The chosen family. Document-level rather than per-label, but carried here (as a
   * shared reference, not a copy) so consumers still only need the one labels argument
   * and the family can never desync from the sizes.
   */
  font: NumberFontSpec;
  /** The automatic position, kept so a moved number can show where it came from. */
  autoX: number;
  autoY: number;
  moved: boolean;
}

export interface LabelSizeOptions {
  numberScale: number;
  numberMinSize: number;
  numberFont?: NumberFont;
}

/** The original size heuristic: proportional to the region's inscribed radius, clamped. */
export function autoFontSize(maxInscribedRadius: number): number {
  return Math.max(LABEL_FONT_MIN, Math.min(maxInscribedRadius * 0.8, LABEL_FONT_MAX));
}

/**
 * Resolve raw placements into what should actually be drawn: overrides applied, scale
 * applied, and anything below `numberMinSize` dropped entirely (illegible slivers read as
 * clutter rather than information).
 */
export function computeRenderLabels(
  labels: LabelPlacement[],
  opts: LabelSizeOptions,
  overrides: Record<number, LabelOverride> = {}
): RenderLabel[] {
  const scale = opts.numberScale ?? 1;
  const minSize = opts.numberMinSize ?? 0;
  const font = NUMBER_FONTS[opts.numberFont ?? DEFAULT_NUMBER_FONT] ?? NUMBER_FONTS[DEFAULT_NUMBER_FONT];
  const out: RenderLabel[] = [];

  for (const label of labels) {
    const fontSize = autoFontSize(label.maxInscribedRadius) * scale;
    if (fontSize < minSize) continue;

    const override = overrides[label.regionId];
    out.push({
      regionId: label.regionId,
      colorIndex: label.colorIndex,
      x: override ? override.x : label.x,
      y: override ? override.y : label.y,
      fontSize,
      font,
      autoX: label.x,
      autoY: label.y,
      moved: override !== undefined,
    });
  }

  return out;
}

/**
 * Nearest label to an image-space point, within a generous radius so small numbers are
 * still grabbable. Returns null when nothing is close enough.
 */
export function labelAtPoint(
  labels: RenderLabel[],
  x: number,
  y: number,
  slop: number
): RenderLabel | null {
  let best: RenderLabel | null = null;
  let bestDistSq = Infinity;

  for (const label of labels) {
    const radius = Math.max(label.fontSize * 0.75, slop);
    const dx = x - label.x;
    const dy = y - label.y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= radius * radius && distSq < bestDistSq) {
      bestDistSq = distSq;
      best = label;
    }
  }

  return best;
}
