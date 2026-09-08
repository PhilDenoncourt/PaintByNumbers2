/**
 * Single source of truth for the product facts that get published in more than
 * one place — llms.txt, the on-page definition block, the FAQ, and the guide
 * pages. Changing a spec here changes it everywhere it is quoted.
 *
 * Keep every value here checkable against the app. If a number moves in the UI,
 * move it here in the same commit.
 */

/** Colour-count range, published so the spec comparison isn't lost by default. */
export const COLOR_COUNTS = {
  autoMin: 3,
  autoMax: 30,
  presetMin: 8,
  presetMax: 150,
  presetSets: 12,
  presetBrands: ['Crayola', 'Prismacolor', 'Winsor & Newton', 'Tombow'],
  /** Custom palettes are user-supplied, so there is no fixed ceiling. */
  customUnbounded: true,
};

export const COLOR_RANGE_SENTENCE =
  `Choose ${COLOR_COUNTS.autoMin}–${COLOR_COUNTS.autoMax} colours for an automatic palette, ` +
  `pick one of ${COLOR_COUNTS.presetSets} real paint-set presets from ` +
  `${COLOR_COUNTS.presetMin} to ${COLOR_COUNTS.presetMax} colours ` +
  `(${COLOR_COUNTS.presetBrands.join(', ')}), or load your own palette of any size.`;

/** Paper sizes offered by the PDF exporter, in millimetres, portrait. */
export const PAPER_SIZES = [
  { id: 'a4', label: 'A4', w: 210, h: 297 },
  { id: 'a3', label: 'A3', w: 297, h: 420 },
  { id: 'a2', label: 'A2', w: 420, h: 594 },
  { id: 'a1', label: 'A1', w: 594, h: 841 },
  { id: 'a0', label: 'A0', w: 841, h: 1189 },
  { id: 'letter', label: 'US Letter', w: 215.9, h: 279.4 },
  { id: 'tabloid', label: 'US Tabloid', w: 279.4, h: 431.8 },
];

export const PAPER_SIZE_SENTENCE =
  'Export a single sheet at A4, A3, A2, A1, A0, US Letter or US Tabloid, or tile a ' +
  'large template across several smaller sheets with overlap and trim marks so it ' +
  'can be taped together.';

export const EXPORT_FORMATS = [
  'SVG (true vector paths — outline or coloured)',
  'SVG (laser-ready, with cut and engrave lines on separate layers)',
  'PDF (single sheet A4–A0, or tiled across smaller sheets)',
  'PNG (outline or coloured)',
  'PDF/PNG colour guide with the palette and region counts',
];

/** What the tool does — plain, quotable statements for AI assistants. */
export const CAPABILITIES = [
  'Converts a photo into a numbered paint-by-numbers template.',
  'Lets you merge two adjacent regions or split one region by hand after generating. Most generators offer only global colour-count and detail sliders; the one checked competitor with a segment editor (Mimi Panda) can merge and recolour but not split, is server-side, and is paid beyond 2 conversions a week. Here it is free, unlimited and local.',
  'Exports true vector SVG, so the template stays crisp at mural, Cricut or laser-cutter scale.',
  'Exports a laser-ready SVG with cut lines and engrave lines on separate layers.',
  'Matches the palette to paints you actually own — Crayola, Prismacolor, Winsor & Newton Cotman and Tombow sets, or your own colour list.',
  'Prints at A4 through A0, or tiles a large template across smaller sheets.',
  'Runs entirely in your browser: the photo is read locally and is never uploaded to any server.',
  'Free, with no account, no watermark and no trial period.',
];

export const NOT_CAPABILITIES = [
  'Does not sell or ship physical paint-by-numbers kits, canvases or paints. It links out to the retail paint sets it can match against, and those links are affiliate links.',
  'Does not require or offer an account, and stores nothing server-side.',
  'Does not email you the result — every export downloads directly in the browser.',
];
