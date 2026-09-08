import { describe, it, expect } from 'vitest';
import { computeTileGrid, generatePdf } from '../../export/pdfExporter';
import { findPaperSize } from '../../export/paperSizes';
import type { PipelineResult } from '../../state/types';

const a4 = findPaperSize('a4');
const a3 = findPaperSize('a3');
const a0 = findPaperSize('a0');

function result(width = 400, height = 600): PipelineResult {
  return {
    width,
    height,
    palette: [
      [255, 0, 0],
      [0, 0, 255],
    ],
    labelMap: new Int32Array(width * height),
    regions: [{ id: 1, colorIndex: 0, pixelCount: 4, boundingBox: { x: 0, y: 0, w: 10, h: 10 } }],
    contours: [
      {
        regionId: 1,
        colorIndex: 0,
        outerRing: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        holes: [],
      },
    ],
    labels: [{ regionId: 1, colorIndex: 0, x: 50, y: 50, maxInscribedRadius: 20 }],
  };
}

describe('computeTileGrid', () => {
  it('needs a single tile when the template fits inside one sheet', () => {
    const grid = computeTileGrid({ pageW: 150, pageH: 200, orientation: 'portrait' }, a4);
    expect(grid.cols).toBe(1);
    expect(grid.rows).toBe(1);
  });

  it('covers the whole template with the tiles it reports', () => {
    const grid = computeTileGrid({ pageW: a0.w, pageH: a0.h, orientation: 'portrait' }, a4);
    expect((grid.cols - 1) * grid.stepX + grid.usableW).toBeGreaterThanOrEqual(a0.w);
    expect((grid.rows - 1) * grid.stepY + grid.usableH).toBeGreaterThanOrEqual(a0.h);
  });

  it('does not use more tiles than it needs', () => {
    const grid = computeTileGrid({ pageW: a0.w, pageH: a0.h, orientation: 'portrait' }, a4);
    expect((grid.cols - 2) * grid.stepX + grid.usableW).toBeLessThan(a0.w);
    expect((grid.rows - 2) * grid.stepY + grid.usableH).toBeLessThan(a0.h);
  });

  it('leaves an overlap strip between neighbouring tiles', () => {
    const grid = computeTileGrid({ pageW: a0.w, pageH: a0.h, orientation: 'portrait' }, a4);
    expect(grid.usableW - grid.stepX).toBe(10);
    expect(grid.usableH - grid.stepY).toBe(10);
  });

  it('rotates the sheet to match a landscape template', () => {
    const grid = computeTileGrid({ pageW: a0.h, pageH: a0.w, orientation: 'landscape' }, a4);
    expect(grid.sheetW).toBe(a4.h);
    expect(grid.sheetH).toBe(a4.w);
  });

  it('needs fewer A3 tiles than A4 tiles for the same template', () => {
    const onA4 = computeTileGrid({ pageW: a0.w, pageH: a0.h, orientation: 'portrait' }, a4);
    const onA3 = computeTileGrid({ pageW: a0.w, pageH: a0.h, orientation: 'portrait' }, a3);
    expect(onA3.cols * onA3.rows).toBeLessThan(onA4.cols * onA4.rows);
  });
});

describe('generatePdf paper sizes', () => {
  it('defaults to a single A4 page', () => {
    const doc = generatePdf(result(), false);
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(a4.w, 1);
  });

  it('honours a larger requested page size', () => {
    const doc = generatePdf(result(), false, null, undefined, { pageSize: 'a0' });
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(a0.w, 1);
  });

  it('emits one page per tile, on the tile sheet size', () => {
    const grid = computeTileGrid({ pageW: a0.w, pageH: a0.h, orientation: 'portrait' }, a4);
    const doc = generatePdf(result(), false, null, undefined, { pageSize: 'a0', tileOnto: 'a4' });
    expect(doc.getNumberOfPages()).toBe(grid.cols * grid.rows);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(a4.w, 1);
  });

  it('stays on one page when the tile sheet is not smaller than the template', () => {
    const doc = generatePdf(result(), false, null, undefined, { pageSize: 'a4', tileOnto: 'a4' });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
