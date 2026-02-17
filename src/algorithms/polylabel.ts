import type { Point, LabelPlacement, ContourData } from '../state/types';
import { pointToPolygonDist, polygonCentroid } from '../utils/geometry';

interface Cell {
  x: number;
  y: number;
  h: number;  // half-size
  d: number;  // distance to polygon
  max: number; // upper bound
}

function createCell(x: number, y: number, h: number, polygon: Point[]): Cell {
  const d = pointToPolygonDist(x, y, polygon);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

export function polylabel(polygon: Point[], precision: number = 1.0): { x: number; y: number; distance: number } {
  if (polygon.length === 0) return { x: 0, y: 0, distance: 0 };

  // Bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const cellSize = Math.min(bboxW, bboxH);

  if (cellSize === 0) {
    return { x: minX, y: minY, distance: 0 };
  }

  let h = cellSize / 2;

  // Priority queue (simple array sorted on insertion — fine for this use case)
  const queue: Cell[] = [];

  function queuePush(cell: Cell) {
    // Insert maintaining descending order by max
    let lo = 0, hi = queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (queue[mid].max > cell.max) lo = mid + 1;
      else hi = mid;
    }
    queue.splice(lo, 0, cell);
  }

  // Cover bbox with initial cells
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      queuePush(createCell(x + h, y + h, h, polygon));
    }
  }

  // Best cell — start with centroid
  const cent = polygonCentroid(polygon);
  let bestCell = createCell(cent.x, cent.y, 0, polygon);

  while (queue.length > 0) {
    const cell = queue.shift()!; // highest max

    if (cell.d > bestCell.d) {
      bestCell = cell;
    }

    // Prune
    if (cell.max - bestCell.d <= precision) continue;

    // Subdivide
    h = cell.h / 2;
    queuePush(createCell(cell.x - h, cell.y - h, h, polygon));
    queuePush(createCell(cell.x + h, cell.y - h, h, polygon));
    queuePush(createCell(cell.x - h, cell.y + h, h, polygon));
    queuePush(createCell(cell.x + h, cell.y + h, h, polygon));
  }

  return { x: bestCell.x, y: bestCell.y, distance: bestCell.d };
}

export function placeAllLabels(
  contours: ContourData[],
  onProgress?: (percent: number) => void
): LabelPlacement[] {
  const labels: LabelPlacement[] = [];

  for (let i = 0; i < contours.length; i++) {
    const c = contours[i];
    if (c.outerRing.length < 3) continue;

    const { x, y, distance } = polylabel(c.outerRing, 1.0);
    labels.push({
      regionId: c.regionId,
      colorIndex: c.colorIndex,
      x,
      y,
      maxInscribedRadius: distance,
    });

    if (i % 10 === 0) {
      onProgress?.(Math.round((i / contours.length) * 100));
    }
  }

  onProgress?.(100);
  return labels;
}
