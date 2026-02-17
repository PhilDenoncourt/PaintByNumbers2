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
  // Build region adjacency graph (RAG)
  // For each region, track its neighboring regions
  const adjacency = new Map<number, Set<number>>();
  const regionById = new Map<number, RegionInfo>();

  for (const r of regions) {
    adjacency.set(r.id, new Set());
    regionById.set(r.id, r);
  }

  // Scan pixels for adjacency (4-connectivity)
  const totalPixels = width * height;
  for (let i = 0; i < totalPixels; i++) {
    const label = labelMap[i];
    const x = i % width;
    const y = Math.floor(i / width);

    // Check right neighbor
    if (x < width - 1) {
      const rightLabel = labelMap[i + 1];
      if (rightLabel !== label) {
        adjacency.get(label)?.add(rightLabel);
        adjacency.get(rightLabel)?.add(label);
      }
    }
    // Check bottom neighbor
    if (y < height - 1) {
      const bottomLabel = labelMap[i + width];
      if (bottomLabel !== label) {
        adjacency.get(label)?.add(bottomLabel);
        adjacency.get(bottomLabel)?.add(label);
      }
    }
  }

  onProgress?.(30);

  // Sort regions by size ascending
  const sortedRegions = [...regions].sort((a, b) => a.pixelCount - b.pixelCount);

  // Merge map: maps old region id to new region id
  const mergeTarget = new Map<number, number>();

  function resolveTarget(id: number): number {
    let current = id;
    while (mergeTarget.has(current)) {
      current = mergeTarget.get(current)!;
    }
    return current;
  }

  let mergedCount = 0;
  const totalToMerge = sortedRegions.filter(r => r.pixelCount < minRegionSize).length;

  for (const region of sortedRegions) {
    if (region.pixelCount >= minRegionSize) continue;

    const neighbors = adjacency.get(region.id);
    if (!neighbors || neighbors.size === 0) continue;

    // Find neighbor with closest LAB color
    let bestNeighbor = -1;
    let bestDist = Infinity;
    const myLab = labPalette[region.colorIndex];

    for (const nId of neighbors) {
      const resolvedId = resolveTarget(nId);
      if (resolvedId === region.id) continue;
      const neighbor = regionById.get(resolvedId);
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
    mergeTarget.set(region.id, bestNeighbor);
    const target = regionById.get(bestNeighbor)!;
    target.pixelCount += region.pixelCount;

    // Transfer adjacency
    const myNeighbors = adjacency.get(region.id)!;
    const targetNeighbors = adjacency.get(bestNeighbor)!;
    for (const n of myNeighbors) {
      if (resolveTarget(n) !== bestNeighbor && resolveTarget(n) !== region.id) {
        targetNeighbors.add(n);
        adjacency.get(n)?.delete(region.id);
        adjacency.get(n)?.add(bestNeighbor);
      }
    }
    targetNeighbors.delete(region.id);

    mergedCount++;
    if (totalToMerge > 0) {
      onProgress?.(30 + Math.round((mergedCount / totalToMerge) * 40));
    }
  }

  onProgress?.(70);

  // Relabel pixels
  for (let i = 0; i < totalPixels; i++) {
    const resolved = resolveTarget(labelMap[i]);
    labelMap[i] = resolved;
  }

  onProgress?.(90);

  // Rebuild region list (only surviving regions)
  const survivingRegions = new Map<number, RegionInfo>();
  for (let i = 0; i < totalPixels; i++) {
    const label = labelMap[i];
    if (!survivingRegions.has(label)) {
      const x = i % width;
      const y = Math.floor(i / width);
      survivingRegions.set(label, {
        id: label,
        colorIndex: indexMap[i],
        pixelCount: 0,
        boundingBox: { x, y, w: 1, h: 1 },
      });
    }
    const r = survivingRegions.get(label)!;
    r.pixelCount++;
    const x = i % width;
    const y = Math.floor(i / width);
    const bb = r.boundingBox;
    const minX = Math.min(bb.x, x);
    const minY = Math.min(bb.y, y);
    const maxX = Math.max(bb.x + bb.w - 1, x);
    const maxY = Math.max(bb.y + bb.h - 1, y);
    bb.x = minX; bb.y = minY; bb.w = maxX - minX + 1; bb.h = maxY - minY + 1;
  }

  // Re-read colorIndex from the indexMap for surviving regions
  // (use the most common color index in each region)
  // For simplicity, we just use the first pixel's color since merging
  // doesn't change indexMap, only labelMap

  onProgress?.(100);

  return { labelMap, regions: Array.from(survivingRegions.values()) };
}
