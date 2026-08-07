import { describe, it, expect } from 'vitest';
import {
  computeRenderLabels,
  autoFontSize,
  labelAtPoint,
  NUMBER_FONTS,
  LABEL_FONT_MIN,
  LABEL_FONT_MAX,
} from '../../utils/labels';
import { generateSvg } from '../../export/svgExporter';
import { pointToPolygonDistWithHoles } from '../../utils/geometry';
import { polylabel } from '../../algorithms/polylabel';
import type { LabelPlacement, LabelOverride, PipelineResult, Point } from '../../state/types';

function placement(over: Partial<LabelPlacement> = {}): LabelPlacement {
  return { regionId: 1, colorIndex: 0, x: 10, y: 20, maxInscribedRadius: 10, ...over };
}

describe('autoFontSize', () => {
  it('clamps to the min and max', () => {
    expect(autoFontSize(0)).toBe(LABEL_FONT_MIN);
    expect(autoFontSize(1000)).toBe(LABEL_FONT_MAX);
  });

  it('scales with the inscribed radius between the clamps', () => {
    expect(autoFontSize(10)).toBeCloseTo(8); // 10 * 0.8
  });
});

describe('computeRenderLabels', () => {
  it('multiplies the automatic size by numberScale', () => {
    const [label] = computeRenderLabels([placement()], { numberScale: 2, numberMinSize: 0 });
    expect(label.fontSize).toBeCloseTo(16);
    expect(label.moved).toBe(false);
  });

  it('drops labels whose final size is below numberMinSize', () => {
    const labels = [
      placement({ regionId: 1, maxInscribedRadius: 2 }), // clamps to the 5px floor
      placement({ regionId: 2, maxInscribedRadius: 20 }), // clamps to the 14px ceiling
    ];
    const out = computeRenderLabels(labels, { numberScale: 1, numberMinSize: 7 });
    expect(out.map((l) => l.regionId)).toEqual([2]);
  });

  it('numberScale can lift a small label back above the threshold', () => {
    const labels = [placement({ maxInscribedRadius: 2 })];
    expect(computeRenderLabels(labels, { numberScale: 1, numberMinSize: 7 })).toHaveLength(0);
    expect(computeRenderLabels(labels, { numberScale: 2, numberMinSize: 7 })).toHaveLength(1);
  });

  it('defaults to the sans family and honours an explicit choice', () => {
    const [dflt] = computeRenderLabels([placement()], { numberScale: 1, numberMinSize: 0 });
    expect(dflt.font).toBe(NUMBER_FONTS.sans);

    const [mono] = computeRenderLabels([placement()], {
      numberScale: 1,
      numberMinSize: 0,
      numberFont: 'mono',
    });
    expect(mono.font).toBe(NUMBER_FONTS.mono);
    expect(mono.font.pdf).toBe('courier');
  });

  it('every font maps to a jsPDF standard family', () => {
    // jsPDF ships only these three; anything else would silently fall back in the PDF.
    for (const spec of Object.values(NUMBER_FONTS)) {
      expect(['helvetica', 'times', 'courier']).toContain(spec.pdf);
    }
  });

  it('applies an override position while keeping the automatic one', () => {
    const overrides: Record<number, LabelOverride> = {
      1: { x: 99, y: 88, anchorX: 10, anchorY: 20, colorIndex: 0 },
    };
    const [label] = computeRenderLabels([placement()], { numberScale: 1, numberMinSize: 0 }, overrides);
    expect([label.x, label.y]).toEqual([99, 88]);
    expect([label.autoX, label.autoY]).toEqual([10, 20]);
    expect(label.moved).toBe(true);
  });
});

describe('labelAtPoint', () => {
  const labels = computeRenderLabels(
    [placement({ regionId: 1, x: 0, y: 0 }), placement({ regionId: 2, x: 100, y: 0 })],
    { numberScale: 1, numberMinSize: 0 }
  );

  it('returns the nearest label within range', () => {
    expect(labelAtPoint(labels, 2, 2, 4)?.regionId).toBe(1);
    expect(labelAtPoint(labels, 98, 0, 4)?.regionId).toBe(2);
  });

  it('returns null when nothing is close enough', () => {
    expect(labelAtPoint(labels, 50, 50, 4)).toBeNull();
  });
});

describe('pointToPolygonDistWithHoles', () => {
  // A 100x100 square with a 40x40 hole in the middle.
  const outer: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const hole: Point[] = [
    { x: 30, y: 30 },
    { x: 70, y: 30 },
    { x: 70, y: 70 },
    { x: 30, y: 70 },
  ];

  it('reports a point inside the hole as outside the region', () => {
    expect(pointToPolygonDistWithHoles(50, 50, outer, [hole])).toBeLessThan(0);
  });

  it('caps the inscribed radius at the hole edge', () => {
    // (15, 50) is 15 from the left edge and 15 from the hole — both walls count.
    expect(pointToPolygonDistWithHoles(15, 50, outer, [hole])).toBeCloseTo(15);
  });

  it('matches the plain distance when there are no holes', () => {
    expect(pointToPolygonDistWithHoles(50, 50, outer, [])).toBeCloseTo(50);
  });
});

describe('polylabel with holes', () => {
  const outer: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const hole: Point[] = [
    { x: 25, y: 25 },
    { x: 75, y: 25 },
    { x: 75, y: 75 },
    { x: 25, y: 75 },
  ];

  it('places the point in the hole when holes are ignored', () => {
    const p = polylabel(outer, [], 0.5);
    expect(Math.hypot(p.x - 50, p.y - 50)).toBeLessThan(2);
  });

  it('keeps the point out of the hole when holes are passed', () => {
    const p = polylabel(outer, [hole], 0.5);
    const insideHole = p.x > 25 && p.x < 75 && p.y > 25 && p.y < 75;
    expect(insideHole).toBe(false);
    expect(p.distance).toBeGreaterThan(0);
  });
});

describe('generateSvg label output', () => {
  const result: PipelineResult = {
    width: 100,
    height: 100,
    palette: [[255, 0, 0]],
    labelMap: new Int32Array(100 * 100),
    regions: [{ id: 1, colorIndex: 0, pixelCount: 4, boundingBox: { x: 0, y: 0, w: 10, h: 10 } }],
    contours: [],
    labels: [placement()],
  };

  it('emits the size and position it is given, not a recomputed one', () => {
    const renderLabels = computeRenderLabels(
      result.labels,
      { numberScale: 2, numberMinSize: 0 },
      { 1: { x: 55, y: 66, anchorX: 10, anchorY: 20, colorIndex: 0 } }
    );
    const svg = generateSvg(result, false, null, renderLabels);
    expect(svg).toContain('<text x="55.0" y="66.0" font-size="16.0">1</text>');
  });

  it('sets the chosen family on the label group, with quotes escaped', () => {
    const renderLabels = computeRenderLabels(result.labels, {
      numberScale: 1,
      numberMinSize: 0,
      numberFont: 'mono',
    });
    const svg = generateSvg(result, false, null, renderLabels);
    expect(svg).toContain('font-family="&quot;Courier New&quot;, Courier, monospace"');
    // A raw double quote inside the attribute would break the document.
    expect(svg).not.toContain('font-family=""Courier New"');
  });

  it('omits labels filtered out by the min size', () => {
    const renderLabels = computeRenderLabels(result.labels, { numberScale: 1, numberMinSize: 12 });
    const svg = generateSvg(result, false, null, renderLabels);
    const labelGroup = svg.slice(svg.indexOf('<g id="labels"'), svg.indexOf('<g id="legend"'));
    expect(labelGroup).not.toContain('<text');
  });
});
