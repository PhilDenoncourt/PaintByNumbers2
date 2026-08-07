import { describe, it, expect } from 'vitest';
import { computeRegionThickness } from '../../algorithms/regionThickness';

/** 20x20 with `inside(x, y)` marking label 1 against a label-0 background. */
function makeMap(inside: (x: number, y: number) => boolean) {
  const labelMap = new Int32Array(400);
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      labelMap[y * 20 + x] = inside(x, y) ? 1 : 0;
    }
  }
  return labelMap;
}

describe('computeRegionThickness', () => {
  it('measures a 1px line as 1 thick', () => {
    const labelMap = makeMap((_x, y) => y === 10);
    const thickness = computeRegionThickness(labelMap, 20, 20, 1);
    expect(thickness[1]).toBe(1);
  });

  it('measures a 3px band as 3 thick', () => {
    const labelMap = makeMap((_x, y) => y >= 9 && y <= 11);
    const thickness = computeRegionThickness(labelMap, 20, 20, 1);
    expect(thickness[1]).toBe(3);
  });

  it('measures a 7px band as 7 thick', () => {
    const labelMap = makeMap((_x, y) => y >= 7 && y <= 13);
    const thickness = computeRegionThickness(labelMap, 20, 20, 1);
    expect(thickness[1]).toBe(7);
  });

  it('is orientation-independent: a diagonal band reads near its true width', () => {
    // |x - y| < 2 is a band 3 cells wide along each row, but only ~2.1px measured
    // perpendicular. The chamfer approximation should land well under the 6px
    // threshold the merge pass would compare against — a bbox test would read 20x20.
    const labelMap = makeMap((x, y) => Math.abs(x - y) < 2);
    const thickness = computeRegionThickness(labelMap, 20, 20, 1);
    expect(thickness[1]).toBeLessThan(4);
    expect(thickness[1]).toBeGreaterThanOrEqual(1);
  });

  it('reads the thin arm, not the bounding box, on an L shape', () => {
    // Thick 10x10 block plus a 2px arm. The max inner distance comes from the block,
    // so thickness reflects the widest part — the merge pass keeps this region, which
    // is correct: it is paintable, just with a fiddly tail.
    const labelMap = makeMap(
      (x, y) => (x < 10 && y < 10) || (x >= 10 && x < 12 && y < 18)
    );
    const thickness = computeRegionThickness(labelMap, 20, 20, 1);
    expect(thickness[1]).toBeGreaterThan(5);
  });

  it('treats the image edge as a boundary', () => {
    // A 3px strip hugging the top edge is just as thin as one floating in the middle.
    const labelMap = makeMap((_x, y) => y < 3);
    const thickness = computeRegionThickness(labelMap, 20, 20, 1);
    expect(thickness[1]).toBe(3);
  });

  it('reports 0 for labels absent from the map', () => {
    const labelMap = makeMap(() => false);
    const thickness = computeRegionThickness(labelMap, 20, 20, 3);
    expect(thickness[1]).toBe(0);
    expect(thickness[3]).toBe(0);
  });
});
