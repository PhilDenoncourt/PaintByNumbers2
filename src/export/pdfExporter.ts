import jsPDF from 'jspdf';
import type { PipelineResult, ContourData } from '../state/types';
import { rgbToHex } from '../algorithms/colorUtils';
import { findPresetPalette } from '../data/paletteRegistry';
import { computeRenderLabels, type RenderLabel } from '../utils/labels';
import { DEFAULT_PAPER_SIZE, findPaperSize, type PaperSizeId } from './paperSizes';

// --- Layout constants ---
const MARGIN_MM = 10;
const SWATCH_SIZE = 5; // mm
const LEGEND_ENTRY_WIDTH = 45; // mm per legend column
const LEGEND_ENTRY_HEIGHT = 7; // mm per legend row
const LEGEND_TITLE_HEIGHT = 12; // mm for "Color Legend" title + padding
const LEGEND_GAP = 5; // mm gap between image and legend

// --- Tiling constants ---
/** Unprintable border most desktop printers impose, kept clear on every tile. */
const TILE_MARGIN_MM = 10;
/** Duplicated strip shared by neighbouring tiles, for trimming and gluing. */
const TILE_OVERLAP_MM = 10;

// --- Types ---

interface Layout {
  orientation: 'portrait' | 'landscape';
  pageW: number;
  pageH: number;
  scale: number; // px -> mm
  offsetX: number; // mm, image left edge
  offsetY: number; // mm, image top edge
  imageBottomY: number; // mm
  /**
   * Translation applied to the whole template when it is being windowed onto a
   * smaller sheet. Zero for single-sheet output.
   */
  shiftX: number;
  shiftY: number;
}

export interface TileGrid {
  cols: number;
  rows: number;
  /** Printable area of one sheet, mm. */
  usableW: number;
  usableH: number;
  /** Distance between the origins of adjacent tiles, mm. */
  stepX: number;
  stepY: number;
  /** Sheet size, already oriented to match the template. */
  sheetW: number;
  sheetH: number;
}

export interface PdfExportOptions {
  /** Finished size of the template. Defaults to A4. */
  pageSize?: PaperSizeId;
  /**
   * Print the finished template across several smaller sheets of this size,
   * with an overlap strip and trim marks so they can be taped together.
   * Ignored when the sheet is not smaller than the template.
   */
  tileOnto?: PaperSizeId | null;
}

// --- Layout calculation ---

function estimateLegendHeight(paletteSize: number, availableWidth: number): number {
  const cols = Math.max(1, Math.floor(availableWidth / LEGEND_ENTRY_WIDTH));
  const rows = Math.ceil(paletteSize / cols);
  return LEGEND_TITLE_HEIGHT + rows * LEGEND_ENTRY_HEIGHT;
}

function calculateLayout(
  imgW: number,
  imgH: number,
  paletteSize: number,
  pageSize: PaperSizeId = DEFAULT_PAPER_SIZE,
): Layout {
  const orientation: 'portrait' | 'landscape' = imgW > imgH ? 'landscape' : 'portrait';
  const dims = findPaperSize(pageSize);
  const pageW = orientation === 'landscape' ? dims.h : dims.w;
  const pageH = orientation === 'landscape' ? dims.w : dims.h;

  const drawableW = pageW - 2 * MARGIN_MM;
  const drawableH = pageH - 2 * MARGIN_MM;

  const legendH = estimateLegendHeight(paletteSize, drawableW);
  const imageAreaH = drawableH - legendH - LEGEND_GAP;

  const scaleX = drawableW / imgW;
  const scaleY = imageAreaH / imgH;
  const scale = Math.min(scaleX, scaleY);

  const actualW = imgW * scale;
  const actualH = imgH * scale;

  const offsetX = MARGIN_MM + (drawableW - actualW) / 2;
  const offsetY = MARGIN_MM + (imageAreaH - actualH) / 2;
  const imageBottomY = offsetY + actualH;

  return { orientation, pageW, pageH, scale, offsetX, offsetY, imageBottomY, shiftX: 0, shiftY: 0 };
}

/**
 * How many sheets of `sheet` a template laid out as `layout` needs, and how far
 * apart the tiles sit. Exported for tests.
 */
export function computeTileGrid(
  layout: Pick<Layout, 'pageW' | 'pageH' | 'orientation'>,
  sheet: { w: number; h: number },
): TileGrid {
  // Orient the sheet the same way as the template so the grid stays compact.
  const sheetW = layout.orientation === 'landscape' ? sheet.h : sheet.w;
  const sheetH = layout.orientation === 'landscape' ? sheet.w : sheet.h;

  const usableW = sheetW - 2 * TILE_MARGIN_MM;
  const usableH = sheetH - 2 * TILE_MARGIN_MM;
  // Neighbouring tiles share an overlap strip, so each one advances by less
  // than its full printable width.
  const stepX = usableW - TILE_OVERLAP_MM;
  const stepY = usableH - TILE_OVERLAP_MM;

  const cols = Math.max(1, Math.ceil((layout.pageW - TILE_OVERLAP_MM) / stepX));
  const rows = Math.max(1, Math.ceil((layout.pageH - TILE_OVERLAP_MM) / stepY));

  return { cols, rows, usableW, usableH, stepX, stepY, sheetW, sheetH };
}

// --- Drawing helpers ---

function drawRegions(
  doc: jsPDF,
  contours: ContourData[],
  palette: [number, number, number][],
  includeColor: boolean,
  layout: Layout,
): void {
  const { scale } = layout;
  const offsetX = layout.offsetX + layout.shiftX;
  const offsetY = layout.offsetY + layout.shiftY;
  const strokeW = Math.max(0.1, 0.5 * scale);

  doc.setLineWidth(strokeW);
  doc.setDrawColor(0, 0, 0);
  doc.setLineJoin('round');

  for (const c of contours) {
    if (includeColor) {
      const [r, g, b] = palette[c.colorIndex];
      doc.setFillColor(r, g, b);
    } else {
      doc.setFillColor(255, 255, 255);
    }

    // Build path: outer ring + holes
    const ring = c.outerRing;
    if (ring.length === 0) continue;

    doc.moveTo(offsetX + ring[0].x * scale, offsetY + ring[0].y * scale);
    for (let i = 1; i < ring.length; i++) {
      doc.lineTo(offsetX + ring[i].x * scale, offsetY + ring[i].y * scale);
    }
    doc.close();

    for (const hole of c.holes) {
      if (hole.length === 0) continue;
      doc.moveTo(offsetX + hole[0].x * scale, offsetY + hole[0].y * scale);
      for (let i = 1; i < hole.length; i++) {
        doc.lineTo(offsetX + hole[i].x * scale, offsetY + hole[i].y * scale);
      }
      doc.close();
    }

    doc.fillStrokeEvenOdd();
  }
}

function drawLabels(
  doc: jsPDF,
  labels: RenderLabel[],
  palette: [number, number, number][],
  includeColor: boolean,
  layout: Layout,
): void {
  const { scale } = layout;
  const offsetX = layout.offsetX + layout.shiftX;
  const offsetY = layout.offsetY + layout.shiftY;
  const MM_PER_PT = 0.3528;

  for (const label of labels) {
    const fontSizeMm = label.fontSize * scale;
    const fontSizePt = Math.max(3, fontSizeMm / MM_PER_PT);

    // Pick text color for readability in colored mode
    if (includeColor) {
      const [r, g, b] = palette[label.colorIndex];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      doc.setTextColor(lum > 128 ? 0 : 255);
    } else {
      doc.setTextColor(0, 0, 0);
    }

    doc.setFont(label.font.pdf, 'normal');
    doc.setFontSize(fontSizePt);

    const xMm = offsetX + label.x * scale;
    const yMm = offsetY + label.y * scale;
    const num = String(label.colorIndex + 1);

    doc.text(num, xMm, yMm, { align: 'center', baseline: 'middle' });
  }
}

function drawLegend(
  doc: jsPDF,
  palette: [number, number, number][],
  layout: Layout,
  presetPaletteId: string | null = null,
  /** Tiled output paginates by tile, so the legend must stay on the template. */
  allowPageBreak: boolean = true,
): void {
  const { pageW, pageH, imageBottomY } = layout;
  const availableW = pageW - 2 * MARGIN_MM;
  const legendH = estimateLegendHeight(palette.length, availableW);
  const spaceBelow = pageH - MARGIN_MM - imageBottomY - LEGEND_GAP;

  let startY: number;
  if (legendH > spaceBelow && allowPageBreak) {
    // Legend doesn't fit on same page — add new page
    doc.addPage([layout.pageW, layout.pageH], layout.orientation);
    startY = MARGIN_MM;
  } else {
    startY = imageBottomY + LEGEND_GAP;
  }

  const originX = MARGIN_MM + layout.shiftX;
  startY += layout.shiftY;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Color Legend', originX, startY + 4);

  // Grid
  const cols = Math.max(1, Math.floor(availableW / LEGEND_ENTRY_WIDTH));

  // Resolve preset palette for colour names
  let presetColors: { name: string; rgb: [number, number, number] }[] | null = null;
  if (presetPaletteId) {
    const preset = findPresetPalette(presetPaletteId);
    if (preset) {
      presetColors = preset.colors;
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setLineWidth(0.2);

  for (let i = 0; i < palette.length; i++) {
    const [r, g, b] = palette[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = originX + col * LEGEND_ENTRY_WIDTH;
    const y = startY + LEGEND_TITLE_HEIGHT + row * LEGEND_ENTRY_HEIGHT;

    // Swatch
    doc.setFillColor(r, g, b);
    doc.setDrawColor(0, 0, 0);
    doc.rect(x, y, SWATCH_SIZE, SWATCH_SIZE, 'FD');

    // Label text
    doc.setTextColor(0, 0, 0);
    let labelText: string;
    if (presetColors) {
      const match = presetColors.find(
        (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
      );
      labelText = match ? `${i + 1} - ${match.name}` : `${i + 1} - ${rgbToHex(r, g, b)}`;
    } else {
      labelText = `${i + 1} - ${rgbToHex(r, g, b)}`;
    }
    doc.text(
      labelText,
      x + SWATCH_SIZE + 2,
      y + SWATCH_SIZE / 2,
      { baseline: 'middle' },
    );
  }
}

/**
 * Trim guides and an assembly caption for one tile. The dashed line marks the
 * edge to cut along; the strip beyond it is duplicated on the next sheet.
 */
function drawTileMarks(
  doc: jsPDF,
  grid: TileGrid,
  row: number,
  col: number,
  drawW: number,
  drawH: number,
): void {
  const sheetNumber = row * grid.cols + col + 1;
  const total = grid.cols * grid.rows;

  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);

  // Outline of the printed area, so tiles can be squared up against each other.
  doc.rect(TILE_MARGIN_MM, TILE_MARGIN_MM, drawW, drawH, 'S');

  doc.setLineDashPattern([2, 2], 0);
  if (col < grid.cols - 1) {
    const x = TILE_MARGIN_MM + drawW - TILE_OVERLAP_MM;
    doc.line(x, TILE_MARGIN_MM, x, TILE_MARGIN_MM + drawH);
  }
  if (row < grid.rows - 1) {
    const y = TILE_MARGIN_MM + drawH - TILE_OVERLAP_MM;
    doc.line(TILE_MARGIN_MM, y, TILE_MARGIN_MM + drawW, y);
  }
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Sheet ${sheetNumber} of ${total}  ·  row ${row + 1}, column ${col + 1}  ·  ` +
      'trim on the dashed line and lay this sheet over the next one',
    TILE_MARGIN_MM,
    TILE_MARGIN_MM + drawH + 5,
  );
  doc.setTextColor(0, 0, 0);
}

function drawTemplate(
  doc: jsPDF,
  result: PipelineResult,
  includeColor: boolean,
  layout: Layout,
  labels: RenderLabel[],
  presetPaletteId: string | null,
  allowLegendPageBreak: boolean,
): void {
  drawRegions(doc, result.contours, result.palette, includeColor, layout);
  drawLabels(doc, labels, result.palette, includeColor, layout);
  drawLegend(doc, result.palette, layout, presetPaletteId, allowLegendPageBreak);
}

function generateTiledPdf(
  result: PipelineResult,
  includeColor: boolean,
  layout: Layout,
  labels: RenderLabel[],
  presetPaletteId: string | null,
  grid: TileGrid,
): jsPDF {
  const doc = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: [grid.sheetW, grid.sheetH],
  });

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (row > 0 || col > 0) {
        doc.addPage([grid.sheetW, grid.sheetH], layout.orientation);
      }

      const originX = col * grid.stepX;
      const originY = row * grid.stepY;
      const drawW = Math.min(grid.usableW, layout.pageW - originX);
      const drawH = Math.min(grid.usableH, layout.pageH - originY);

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, grid.sheetW, grid.sheetH, 'F');

      // Window the template: shift it so this tile's slice lands in the
      // printable area, and clip so the neighbouring slices don't bleed in.
      doc.saveGraphicsState();
      doc.rect(TILE_MARGIN_MM, TILE_MARGIN_MM, drawW, drawH, null);
      doc.clip();
      doc.discardPath();

      drawTemplate(
        doc,
        result,
        includeColor,
        { ...layout, shiftX: TILE_MARGIN_MM - originX, shiftY: TILE_MARGIN_MM - originY },
        labels,
        presetPaletteId,
        false,
      );

      doc.restoreGraphicsState();

      drawTileMarks(doc, grid, row, col, drawW, drawH);
    }
  }

  return doc;
}

// --- Public API ---

export function generatePdf(
  result: PipelineResult,
  includeColor: boolean,
  presetPaletteId: string | null = null,
  renderLabels?: RenderLabel[],
  options: PdfExportOptions = {},
): jsPDF {
  const pageSize = options.pageSize ?? DEFAULT_PAPER_SIZE;
  const layout = calculateLayout(result.width, result.height, result.palette.length, pageSize);
  const labels =
    renderLabels ?? computeRenderLabels(result.labels, { numberScale: 1, numberMinSize: 0 });

  // A sheet that is not actually smaller than the template needs no tiling —
  // without this, tiling A4 onto A4 would split it four ways just to make room
  // for the printer margin.
  const sheet = options.tileOnto ? findPaperSize(options.tileOnto) : null;
  const sheetFitsWholeTemplate =
    sheet !== null &&
    Math.min(sheet.w, sheet.h) >= Math.min(layout.pageW, layout.pageH) &&
    Math.max(sheet.w, sheet.h) >= Math.max(layout.pageW, layout.pageH);
  const grid = sheet && !sheetFitsWholeTemplate ? computeTileGrid(layout, sheet) : null;

  if (grid && (grid.cols > 1 || grid.rows > 1)) {
    return generateTiledPdf(result, includeColor, layout, labels, presetPaletteId, grid);
  }

  const doc = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: [layout.pageW, layout.pageH],
  });

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, layout.pageW, layout.pageH, 'F');

  drawTemplate(doc, result, includeColor, layout, labels, presetPaletteId, true);

  return doc;
}

export function downloadPdf(
  result: PipelineResult,
  includeColor: boolean,
  filename: string = 'paint-by-numbers.pdf',
  presetPaletteId: string | null = null,
  renderLabels?: RenderLabel[],
  options: PdfExportOptions = {},
): void {
  const doc = generatePdf(result, includeColor, presetPaletteId, renderLabels, options);
  doc.save(filename);
}
export function generateColorLegendPdf(
  result: PipelineResult,
  presetPaletteId: string | null = null,
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  let startY = MARGIN_MM;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Paint by Numbers - Color Legend', MARGIN_MM, startY);

  startY += 12;

  // Resolve preset palette for colour names
  let presetColors: { name: string; rgb: [number, number, number] }[] | null = null;
  if (presetPaletteId) {
    const preset = findPresetPalette(presetPaletteId);
    if (preset) {
      presetColors = preset.colors;
    }
  }

  const palette = result.palette;
  const availableW = pageW - 2 * MARGIN_MM;
  const cols = Math.max(1, Math.floor(availableW / LEGEND_ENTRY_WIDTH));

  // Count regions per color
  const regionsPerColor = new Map<number, number>();
  for (const label of result.labels) {
    regionsPerColor.set(label.colorIndex, (regionsPerColor.get(label.colorIndex) || 0) + 1);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setLineWidth(0.3);

  for (let i = 0; i < palette.length; i++) {
    const [r, g, b] = palette[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN_MM + col * LEGEND_ENTRY_WIDTH;
    const y = startY + row * LEGEND_ENTRY_HEIGHT;

    // Check if we need a new page
    if (y + LEGEND_ENTRY_HEIGHT > pageH - MARGIN_MM) {
      doc.addPage('a4', 'portrait');
      startY = MARGIN_MM;
      // Swatch
      doc.setFillColor(r, g, b);
      doc.setDrawColor(0, 0, 0);
      doc.rect(x, startY, SWATCH_SIZE, SWATCH_SIZE, 'FD');

      // Label and region count
      doc.setTextColor(0, 0, 0);
      let labelText: string;
      if (presetColors) {
        const match = presetColors.find(
          (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
        );
        labelText = match ? `${i + 1} - ${match.name}` : `${i + 1} - ${rgbToHex(r, g, b)}`;
      } else {
        labelText = `${i + 1} - ${rgbToHex(r, g, b)}`;
      }
      const regionCount = regionsPerColor.get(i) || 0;
      doc.text(
        `${labelText} (${regionCount} regions)`,
        x + SWATCH_SIZE + 2,
        startY + SWATCH_SIZE / 2,
        { baseline: 'middle' },
      );
      continue;
    }

    // Swatch
    doc.setFillColor(r, g, b);
    doc.setDrawColor(0, 0, 0);
    doc.rect(x, y, SWATCH_SIZE, SWATCH_SIZE, 'FD');

    // Label and region count
    doc.setTextColor(0, 0, 0);
    let labelText: string;
    if (presetColors) {
      const match = presetColors.find(
        (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
      );
      labelText = match ? `${i + 1} - ${match.name}` : `${i + 1} - ${rgbToHex(r, g, b)}`;
    } else {
      labelText = `${i + 1} - ${rgbToHex(r, g, b)}`;
    }
    const regionCount = regionsPerColor.get(i) || 0;
    doc.text(
      `${labelText} (${regionCount} regions)`,
      x + SWATCH_SIZE + 2,
      y + SWATCH_SIZE / 2,
      { baseline: 'middle' },
    );
  }

  return doc;
}

export function downloadColorLegendPdf(
  result: PipelineResult,
  presetPaletteId: string | null = null,
  filename: string = 'paint-by-numbers-color-guide.pdf',
): void {
  const doc = generateColorLegendPdf(result, presetPaletteId);
  doc.save(filename);
}