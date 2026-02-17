import type { Point, RegionInfo, ContourData } from '../state/types';
import { douglasPeucker } from './douglasPeucker';
import { polygonArea } from '../utils/geometry';

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

function chainSegments(segments: [Point, Point][]): Point[][] {
  if (segments.length === 0) return [];

  // Build adjacency: endpoint -> list of segment indices
  const adj = new Map<string, number[]>();
  for (let i = 0; i < segments.length; i++) {
    const [a, b] = segments[i];
    const ka = pointKey(a.x, a.y);
    const kb = pointKey(b.x, b.y);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push(i);
    adj.get(kb)!.push(i);
  }

  const used = new Uint8Array(segments.length);
  const polygons: Point[][] = [];

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;

    const chain: Point[] = [segments[i][0], segments[i][1]];
    used[i] = 1;

    // Extend forward
    let extended = true;
    while (extended) {
      extended = false;
      const last = chain[chain.length - 1];
      const key = pointKey(last.x, last.y);
      const neighbors = adj.get(key);
      if (!neighbors) break;

      for (const ni of neighbors) {
        if (used[ni]) continue;
        used[ni] = 1;
        const [sa, sb] = segments[ni];
        if (sa.x === last.x && sa.y === last.y) {
          chain.push(sb);
        } else {
          chain.push(sa);
        }
        extended = true;

        // Check if closed
        const first = chain[0];
        const newest = chain[chain.length - 1];
        if (first.x === newest.x && first.y === newest.y) {
          chain.pop();
          extended = false;
        }
        break;
      }
    }

    if (chain.length >= 3) {
      polygons.push(chain);
    }
  }

  return polygons;
}

export function extractContour(
  labelMap: Int32Array,
  region: RegionInfo,
  width: number,
  height: number,
  epsilon: number
): ContourData {
  const { id, colorIndex, boundingBox: bbox } = region;

  // Create padded binary grid
  const gw = bbox.w + 2;
  const gh = bbox.h + 2;
  const grid = new Uint8Array(gw * gh);

  for (let dy = 0; dy < bbox.h; dy++) {
    for (let dx = 0; dx < bbox.w; dx++) {
      const px = bbox.x + dx;
      const py = bbox.y + dy;
      if (px < width && py < height && labelMap[py * width + px] === id) {
        grid[(dy + 1) * gw + (dx + 1)] = 1;
      }
    }
  }

  // Marching squares
  const segments: [Point, Point][] = [];

  for (let cy = 0; cy < gh - 1; cy++) {
    for (let cx = 0; cx < gw - 1; cx++) {
      const tl = grid[cy * gw + cx];
      const tr = grid[cy * gw + cx + 1];
      const br = grid[(cy + 1) * gw + cx + 1];
      const bl = grid[(cy + 1) * gw + cx];

      const caseIdx = (tl << 3) | (tr << 2) | (br << 1) | bl;

      // Edge midpoints
      const top: Point = { x: cx + 0.5, y: cy };
      const right: Point = { x: cx + 1, y: cy + 0.5 };
      const bottom: Point = { x: cx + 0.5, y: cy + 1 };
      const left: Point = { x: cx, y: cy + 0.5 };

      switch (caseIdx) {
        case 0: case 15: break;
        case 1: segments.push([left, bottom]); break;
        case 2: segments.push([bottom, right]); break;
        case 3: segments.push([left, right]); break;
        case 4: segments.push([right, top]); break;
        case 5: // saddle
          segments.push([left, top]);
          segments.push([bottom, right]);
          break;
        case 6: segments.push([bottom, top]); break;
        case 7: segments.push([left, top]); break;
        case 8: segments.push([top, left]); break;
        case 9: segments.push([top, bottom]); break;
        case 10: // saddle
          segments.push([top, right]);
          segments.push([left, bottom]);
          break;
        case 11: segments.push([top, right]); break;
        case 12: segments.push([right, left]); break;
        case 13: segments.push([bottom, right]); break;
        case 14: segments.push([bottom, left]); break;
      }
    }
  }

  // Chain into closed polygons
  const rawPolygons = chainSegments(segments);

  // Offset to image coords
  const polygons = rawPolygons.map(poly =>
    poly.map(p => ({
      x: p.x + bbox.x - 1,
      y: p.y + bbox.y - 1,
    }))
  );

  // Simplify with RDP
  const simplified = polygons.map(poly => douglasPeucker(poly, epsilon));

  // Find outer ring (largest area) and holes
  if (simplified.length === 0) {
    return { regionId: id, colorIndex, outerRing: [], holes: [] };
  }

  let maxArea = -1;
  let outerIdx = 0;
  for (let i = 0; i < simplified.length; i++) {
    const area = polygonArea(simplified[i]);
    if (area > maxArea) {
      maxArea = area;
      outerIdx = i;
    }
  }

  const outerRing = simplified[outerIdx];
  const holes = simplified.filter((_, i) => i !== outerIdx).filter(h => h.length >= 3);

  return { regionId: id, colorIndex, outerRing, holes };
}

export function extractAllContours(
  labelMap: Int32Array,
  regions: RegionInfo[],
  width: number,
  height: number,
  epsilon: number,
  onProgress?: (percent: number) => void
): ContourData[] {
  const contours: ContourData[] = [];
  for (let i = 0; i < regions.length; i++) {
    const contour = extractContour(labelMap, regions[i], width, height, epsilon);
    if (contour.outerRing.length >= 3) {
      contours.push(contour);
    }
    if (i % 10 === 0) {
      onProgress?.(Math.round((i / regions.length) * 100));
    }
  }
  onProgress?.(100);
  return contours;
}
