/**
 * Paper sizes offered by the PDF exporter.
 *
 * Dimensions are millimetres in portrait orientation; the exporter rotates them
 * to match the template's aspect ratio.
 */

export type PaperSizeId = 'a4' | 'a3' | 'a2' | 'a1' | 'a0' | 'letter' | 'tabloid';

export interface PaperSize {
  id: PaperSizeId;
  label: string;
  /** Portrait width, mm. */
  w: number;
  /** Portrait height, mm. */
  h: number;
}

export const PAPER_SIZES: PaperSize[] = [
  { id: 'a4', label: 'A4', w: 210, h: 297 },
  { id: 'a3', label: 'A3', w: 297, h: 420 },
  { id: 'a2', label: 'A2', w: 420, h: 594 },
  { id: 'a1', label: 'A1', w: 594, h: 841 },
  { id: 'a0', label: 'A0', w: 841, h: 1189 },
  { id: 'letter', label: 'US Letter', w: 215.9, h: 279.4 },
  { id: 'tabloid', label: 'US Tabloid', w: 279.4, h: 431.8 },
];

export const DEFAULT_PAPER_SIZE: PaperSizeId = 'a4';

export function findPaperSize(id: PaperSizeId): PaperSize {
  const size = PAPER_SIZES.find((s) => s.id === id);
  if (!size) throw new Error(`Unknown paper size: ${id}`);
  return size;
}

/** Sizes small enough to be worth tiling a larger template onto. */
export const TILE_TARGET_SIZES: PaperSizeId[] = ['a4', 'a3', 'letter', 'tabloid'];
