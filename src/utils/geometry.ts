import type { Point, BBox } from '../state/types';

export function expandBBox(bbox: BBox, x: number, y: number): BBox {
  const minX = Math.min(bbox.x, x);
  const minY = Math.min(bbox.y, y);
  const maxX = Math.max(bbox.x + bbox.w - 1, x);
  const maxY = Math.max(bbox.y + bbox.h - 1, y);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function polygonArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  return Math.abs(area) / 2;
}

export function polygonCentroid(points: Point[]): Point {
  let cx = 0, cy = 0, area = 0;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const cross = points[j].x * points[i].y - points[i].x * points[j].y;
    cx += (points[j].x + points[i].x) * cross;
    cy += (points[j].y + points[i].y) * cross;
    area += cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-10) {
    // Degenerate polygon, return average
    const avg = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: avg.x / n, y: avg.y / n };
  }
  cx /= (6 * area);
  cy /= (6 * area);
  return { x: cx, y: cy };
}

export function pointToSegmentDistSq(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ex = px - ax, ey = py - ay;
    return ex * ex + ey * ey;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const ex = px - projX, ey = py - projY;
  return ex * ex + ey * ey;
}

export function pointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointToPolygonDist(x: number, y: number, polygon: Point[]): number {
  let minDistSq = Infinity;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
    minDistSq = Math.min(minDistSq, pointToSegmentDistSq(x, y, a.x, a.y, b.x, b.y));
  }
  return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}
