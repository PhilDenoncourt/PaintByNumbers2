import jsPDF from 'jspdf';
import type { PipelineResult, ContourData, LabelPlacement } from '../state/types';
import { rgbToHex } from '../algorithms/colorUtils';
import { crayolaPalettes } from '../data/crayolaPalettes';

// --- Layout constants ---
const MARGIN_MM = 10;
const SWATCH_SIZE = 5; // mm
const LEGEND_ENTRY_WIDTH = 45; // mm per legend column
const LEGEND_ENTRY_HEIGHT = 7; // mm per legend row
const LEGEND_TITLE_HEIGHT = 12; // mm for "Color Legend" title + padding
const LEGEND_GAP = 5; // mm gap between image and legend

const PAGE_DIMS = {
  a4: { w: 210, h: 297 },
};

// --- Types ---

interface Layout {
  orientation: 'portrait' | 'landscape';
  pageW: number;
  pageH: number;
  scale: number; // px -> mm
  offsetX: number; // mm, image left edge
  offsetY: number; // mm, image top edge
  imageBottomY: number; // mm
}

// --- Layout calculation ---

function estimateLegendHeight(paletteSize: number, availableWidth: number): number {
  const cols = Math.max(1, Math.floor(availableWidth / LEGEND_ENTRY_WIDTH));
  const rows = Math.ceil(paletteSize / cols);
  return LEGEND_TITLE_HEIGHT + rows * LEGEND_ENTRY_HEIGHT;
}

function calculateLayout(imgW: number, imgH: number, paletteSize: number): Layout {
  const orientation: 'portrait' | 'landscape' = imgW > imgH ? 'landscape' : 'portrait';
  const dims = PAGE_DIMS.a4;
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

  return { orientation, pageW, pageH, scale, offsetX, offsetY, imageBottomY };
}

// --- Drawing helpers ---

function drawRegions(
  doc: jsPDF,
  contours: ContourData[],
  palette: [number, number, number][],
  includeColor: boolean,
  layout: Layout,
): void {
  const { scale, offsetX, offsetY } = layout;
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
  labels: LabelPlacement[],
  palette: [number, number, number][],
  includeColor: boolean,
  layout: Layout,
): void {
  const { scale, offsetX, offsetY } = layout;
  const MM_PER_PT = 0.3528;

  for (const label of labels) {
    // Same sizing formula as SVG exporter
    const fontSizePx = Math.max(5, Math.min(label.maxInscribedRadius * 0.8, 14));
    const fontSizeMm = fontSizePx * scale;
    const fontSizePt = Math.max(3, fontSizeMm / MM_PER_PT);

    // Pick text color for readability in colored mode
    if (includeColor) {
      const [r, g, b] = palette[label.colorIndex];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      doc.setTextColor(lum > 128 ? 0 : 255);
    } else {
      doc.setTextColor(0, 0, 0);
    }

    doc.setFont('helvetica', 'normal');
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
): void {
  const { pageW, pageH, imageBottomY } = layout;
  const availableW = pageW - 2 * MARGIN_MM;
  const legendH = estimateLegendHeight(palette.length, availableW);
  const spaceBelow = pageH - MARGIN_MM - imageBottomY - LEGEND_GAP;

  let startY: number;
  if (legendH > spaceBelow) {
    // Legend doesn't fit on same page — add new page
    doc.addPage('a4', layout.orientation);
    startY = MARGIN_MM;
  } else {
    startY = imageBottomY + LEGEND_GAP;
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Color Legend', MARGIN_MM, startY + 4);

  // Grid
  const cols = Math.max(1, Math.floor(availableW / LEGEND_ENTRY_WIDTH));

  // Resolve preset palette for crayon names
  let presetColors: { name: string; rgb: [number, number, number] }[] | null = null;
  if (presetPaletteId) {
    const preset = crayolaPalettes.find(
      (p) => `crayola-${p.size}` === presetPaletteId
    );
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
    const x = MARGIN_MM + col * LEGEND_ENTRY_WIDTH;
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

// --- Public API ---

export function generatePdf(result: PipelineResult, includeColor: boolean, presetPaletteId: string | null = null): jsPDF {
  const layout = calculateLayout(result.width, result.height, result.palette.length);

  const doc = new jsPDF({
    orientation: layout.orientation,
    unit: 'mm',
    format: 'a4',
  });

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, layout.pageW, layout.pageH, 'F');

  drawRegions(doc, result.contours, result.palette, includeColor, layout);
  drawLabels(doc, result.labels, result.palette, includeColor, layout);
  drawLegend(doc, result.palette, layout, presetPaletteId);

  return doc;
}

export function downloadPdf(
  result: PipelineResult,
  includeColor: boolean,
  filename: string = 'paint-by-numbers.pdf',
  presetPaletteId: string | null = null,
): void {
  const doc = generatePdf(result, includeColor, presetPaletteId);
  doc.save(filename);
}
