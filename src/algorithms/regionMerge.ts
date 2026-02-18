import type { RegionInfo } from '../state/types';
import { labDistanceSq } from './colorUtils';

export function mergeSmallRegions(
  labelMap: Int32Array,
  indexMap: Uint8Array,
  regions: RegionInfo[],
  width: number,
  height: number,
  minRegionSize: number,
  _palette: [number, number, number][],
  labPalette: [number, number, number][],
  onProgress?: (percent: number) => void
): { labelMap: Int32Array; regions: RegionInfo[] } {
  const totalPixels = width * height;

  // Find max region ID so we can use flat arrays instead of Maps
  let maxId = 0;
  for (const r of regions) {
    if (r.id > maxId) maxId = r.id;
  }

  // Flat array adjacency: faster integer-key lookup than Map
  const adjacency = new Array<Set<number>>(maxId + 1);
  const regionById = new Array<RegionInfo | undefined>(maxId + 1);

  for (const r of regions) {
    adjacency[r.id] = new Set();
    regionById[r.id] = r;
  }

  // Scan pixels for adjacency (4-connectivity).
  // Use nested x/y loop to avoid expensive i%width and Math.floor(i/width).
  let idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++, idx++) {
      const label = labelMap[idx];
      // Check right neighbor
      if (x < width - 1) {
        const rightLabel = labelMap[idx + 1];
        if (rightLabel !== label) {
          adjacency[label].add(rightLabel);
          adjacency[rightLabel].add(label);
        }
      }
      // Check bottom neighbor
      if (y < height - 1) {
        const bottomLabel = labelMap[idx + width];
        if (bottomLabel !== label) {
          adjacency[label].add(bottomLabel);
          adjacency[bottomLabel].add(label);
        }
      }
    }
  }

  onProgress?.(30);

  // Merge map: flat Int32Array, -1 means "no redirect"
  const mergeTarget = new Int32Array(maxId + 1).fill(-1);

  // resolveTarget with path compression (union-find style)
  function resolveTarget(id: number): number {
    let root = id;
    while (mergeTarget[root] !== -1) {
      root = mergeTarget[root];
    }
    // Path compression: point every node on the path directly to root
    let cur = id;
    while (mergeTarget[cur] !== -1) {
      const next = mergeTarget[cur];
      mergeTarget[cur] = root;
      cur = next;
    }
    return root;
  }

  // Sort regions by size ascending
  const sortedRegions = [...regions].sort((a, b) => a.pixelCount - b.pixelCount);

  let mergedCount = 0;
  const totalToMerge = sortedRegions.filter(r => r.pixelCount < minRegionSize).length;
  let lastReportedPercent = 30;

  for (const region of sortedRegions) {
    if (region.pixelCount >= minRegionSize) continue;

    const neighbors = adjacency[region.id];
    if (!neighbors || neighbors.size === 0) continue;

    // Find neighbor with closest LAB color
    let bestNeighbor = -1;
    let bestDist = Infinity;
    const myLab = labPalette[region.colorIndex];

    for (const nId of neighbors) {
      const resolvedId = resolveTarget(nId);
      if (resolvedId === region.id) continue;
      const neighbor = regionById[resolvedId];
      if (!neighbor) continue;

      const nLab = labPalette[neighbor.colorIndex];
      const d = labDistanceSq(myLab[0], myLab[1], myLab[2], nLab[0], nLab[1], nLab[2]);
      if (d < bestDist) {
        bestDist = d;
        bestNeighbor = resolvedId;
      }
    }

    if (bestNeighbor === -1) continue;

    // Merge: redirect this region to bestNeighbor
    mergeTarget[region.id] = bestNeighbor;
    const target = regionById[bestNeighbor]!;
    target.pixelCount += region.pixelCount;

    // Transfer adjacency
    const myNeighbors = adjacency[region.id]!;
    const targetNeighbors = adjacency[bestNeighbor]!;
    for (const n of myNeighbors) {
      const rn = resolveTarget(n);
      if (rn !== bestNeighbor && rn !== region.id) {
        targetNeighbors.add(n);
        adjacency[n]?.delete(region.id);
        adjacency[n]?.add(bestNeighbor);
      }
    }
    targetNeighbors.delete(region.id);

    mergedCount++;
    // Throttle progress calls: only fire when the integer percent changes
    if (totalToMerge > 0 && onProgress) {
      const pct = 30 + Math.round((mergedCount / totalToMerge) * 40);
      if (pct !== lastReportedPercent) {
        onProgress(pct);
        lastReportedPercent = pct;
      }
    }
  }

  onProgress?.(70);

  // Flatten mergeTarget so every entry points directly to its root
  // (path compression during merging handles most of it, but do a final pass)
  for (let i = 0; i <= maxId; i++) {
    if (mergeTarget[i] !== -1) {
      mergeTarget[i] = resolveTarget(i);
    }
  }

  // Relabel pixels: now a single flat-array lookup — no chain traversal
  for (let i = 0; i < totalPixels; i++) {
    const label = labelMap[i];
    if (mergeTarget[label] !== -1) labelMap[i] = mergeTarget[label];
  }

  onProgress?.(90);

  // Rebuild region list using nested x/y loop (avoids i%width / Math.floor)
  const survivingRegions = new Map<number, RegionInfo>();
  idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++, idx++) {
      const label = labelMap[idx];
      if (!survivingRegions.has(label)) {
        survivingRegions.set(label, {
          id: label,
          colorIndex: indexMap[idx],
          pixelCount: 0,
          boundingBox: { x, y, w: 1, h: 1 },
        });
      }
      const r = survivingRegions.get(label)!;
      r.pixelCount++;
      const bb = r.boundingBox;
      // Inline min/max to avoid function-call overhead
      const maxX = bb.x + bb.w - 1;
      const maxY = bb.y + bb.h - 1;
      const newMinX = x < bb.x ? x : bb.x;
      const newMinY = y < bb.y ? y : bb.y;
      const newMaxX = x > maxX ? x : maxX;
      const newMaxY = y > maxY ? y : maxY;
      bb.x = newMinX; bb.y = newMinY;
      bb.w = newMaxX - newMinX + 1; bb.h = newMaxY - newMinY + 1;
    }
  }

  onProgress?.(100);

  return { labelMap, regions: Array.from(survivingRegions.values()) };
}
