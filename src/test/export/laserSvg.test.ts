import { describe, it, expect } from 'vitest';
import { generateLaserSvg } from '../../export/svgExporter';
import type { PipelineResult } from '../../state/types';

const result: PipelineResult = {
  width: 200,
  height: 100,
  palette: [
    [255, 0, 0],
    [0, 128, 0],
  ],
  labelMap: new Int32Array(200 * 100),
  regions: [{ id: 1, colorIndex: 0, pixelCount: 4, boundingBox: { x: 0, y: 0, w: 10, h: 10 } }],
  contours: [
    {
      regionId: 1,
      colorIndex: 0,
      outerRing: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
      ],
      holes: [],
    },
  ],
  labels: [{ regionId: 1, colorIndex: 1, x: 25, y: 25, maxInscribedRadius: 10 }],
};

describe('generateLaserSvg', () => {
  const svg = generateLaserSvg(result);

  it('puts the workpiece outline on a red cut layer', () => {
    expect(svg).toContain('<g id="cut"');
    expect(svg).toMatch(/<g id="cut"[^>]*stroke="#FF0000"/);
    expect(svg).toContain('<rect x="0" y="0" width="200" height="100"/>');
  });

  it('puts the region boundaries on a blue engrave layer', () => {
    expect(svg).toMatch(/<g id="engrave"[^>]*stroke="#0000FF"/);
    expect(svg).toContain('M0.0 0.0 L50.0 0.0 L50.0 50.0 L0.0 50.0 Z');
  });

  it('fills nothing — a filled path would raster-engrave the whole region', () => {
    expect(svg).not.toMatch(/fill="(?!none)/);
  });

  it('keeps the numbers in their own group so they can be switched off', () => {
    expect(svg).toContain('<g id="engrave-numbers"');
    expect(svg).toContain('>2</text>');
  });

  it('omits the numbers when asked', () => {
    const bare = generateLaserSvg(result, undefined, false);
    expect(bare).not.toContain('engrave-numbers');
  });

  it('leaves the colour legend out of the fabrication file', () => {
    expect(svg).not.toContain('Color Legend');
    expect(svg).not.toContain('id="legend"');
  });
});
