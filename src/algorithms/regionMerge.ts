import type { RegionInfo } from '../state/types';
import { deltaE2000 } from './colorUtils';
import { computeRegionThickness } from './regionThickness';

export interface MergeOptions {
  onProgress?: (percent: number) => void;
  /**
   * Minimum paintable width in pixels. Regions thinner than this are absorbed by a
   * neighbour. 1 (or less) disables the pass.
   */
  minThickness?: number;
}

/** 4-connectivity adjacency as a flat array of sets, indexed by region id. */
function buildAdjacency(
  labelMap: Int32Array,
  width: number,
  height: number,
  regions: RegionInfo[],
  maxId: number
): Set<number>[] {
  const adjacency = new Array<Set<number>>(maxId + 1);
  for (const r of regions) adjacency[r.id] = new Set();

  // Nested x/y loop to avoid expensive i%width and Math.floor(i/width).
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
  return adjacency;
}

/** Recompute pixel counts and bounding boxes for the labels left in `labelMap`. */
function rebuildRegions(
  labelMap: Int32Array,
  width: number,
  height: number,
  regionById: (RegionInfo | undefined)[]
): RegionInfo[] {
  const survivingRegions = new Map<number, RegionInfo>();
  let idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++, idx++) {
      const label = labelMap[idx];
      if (!survivingRegions.has(label)) {
        survivingRegions.set(label, {
          id: label,
          // Surviving labels are always pre-merge region IDs, which are
          // color-uniform by construction — absorbed pixels must adopt the
          // target's color, not whichever quantized index they carried.
          colorIndex: regionById[label]!.colorIndex,
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
  return Array.from(survivingRegions.values());
}

export function mergeSmallRegions(
  labelMap: Int32Array,
  regions: RegionInfo[],
  width: number,
  height: number,
  minRegionSize: number,
  _palette: [number, number, number][],
  labPalette: [number, number, number][],
  options: MergeOptions = {}
): { labelMap: Int32Array; regions: RegionInfo[] } {
  const { onProgress, minThickness = 1 } = options;
  const totalPixels = width * height;

  // The thin-region pass, when enabled, takes the last 40% of the progress bar.
  const runThinPass = minThickness > 1;
  const report = runThinPass
    ? (percent: number) => onProgress?.(Math.round(percent * 0.6))
    : onProgress;

  // Find max region ID so we can use flat arrays instead of Maps
  let maxId = 0;
  for (const r of regions) {
    if (r.id > maxId) maxId = r.id;
  }

  // Flat array adjacency: faster integer-key lookup than Map
  const regionById = new Array<RegionInfo | undefined>(maxId + 1);
  for (const r of regions) regionById[r.id] = r;
  const adjacency = buildAdjacency(labelMap, width, height, regions, maxId);

  report?.(30);

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
      const d = deltaE2000(myLab[0], myLab[1], myLab[2], nLab[0], nLab[1], nLab[2]);
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
    if (totalToMerge > 0 && report) {
      const pct = 30 + Math.round((mergedCount / totalToMerge) * 40);
      if (pct !== lastReportedPercent) {
        report(pct);
        lastReportedPercent = pct;
      }
    }
  }

  report?.(70);

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

  report?.(90);

  let survivingRegions = rebuildRegions(labelMap, width, height, regionById);

  report?.(100);

  if (runThinPass) {
    survivingRegions = mergeThinRegions(
      labelMap,
      survivingRegions,
      width,
      height,
      minThickness,
      labPalette,
      regionById,
      (percent) => onProgress?.(60 + Math.round(percent * 0.4))
    );
  }

  return { labelMap, regions: survivingRegions };
}

/**
 * How many absorb-and-remeasure rounds to run. Absorbing a sliver can leave the
 * result still too thin, so this repeats — but each round costs a full distance
 * transform, and in practice it converges in two or three.
 */
const MAX_THIN_ROUNDS = 4;

/**
 * Absorb regions narrower than `minThickness` into a neighbour, mutating `labelMap`
 * in place and returning the surviving region list.
 *
 * `regionById` must cover every id in `regions` — it supplies the colour index that
 * absorbed pixels inherit, exactly as in the size pass.
 */
function mergeThinRegions(
  labelMap: Int32Array,
  regions: RegionInfo[],
  width: number,
  height: number,
  minThickness: number,
  labPalette: [number, number, number][],
  regionById: (RegionInfo | undefined)[],
  onProgress?: (percent: number) => void
): RegionInfo[] {
  const totalPixels = width * height;
  let current = regions;

  for (let round = 0; round < MAX_THIN_ROUNDS; round++) {
    onProgress?.(Math.round((round / MAX_THIN_ROUNDS) * 100));

    let maxId = 0;
    for (const r of current) {
      if (r.id > maxId) maxId = r.id;
    }

    const thickness = computeRegionThickness(labelMap, width, height, maxId);
    const thin = current.filter((r) => thickness[r.id] < minThickness);
    if (thin.length === 0) break;

    // A single surviving region can't be thinned any further — bail rather than
    // spin through rounds that can't merge anything.
    if (thin.length === current.length && current.length === 1) break;

    const adjacency = buildAdjacency(labelMap, width, height, current, maxId);
    const mergeTarget = new Int32Array(maxId + 1).fill(-1);

    const resolveTarget = (id: number): number => {
      let root = id;
      while (mergeTarget[root] !== -1) root = mergeTarget[root];
      let cur = id;
      while (mergeTarget[cur] !== -1) {
        const next = mergeTarget[cur];
        mergeTarget[cur] = root;
        cur = next;
      }
      return root;
    };

    // Thinnest first: the worst slivers get first pick of a neighbour.
    thin.sort((a, b) => thickness[a.id] - thickness[b.id]);

    let mergedCount = 0;
    for (const region of thin) {
      // Already absorbed by an earlier sliver this round.
      if (resolveTarget(region.id) !== region.id) continue;

      const neighbors = adjacency[region.id];
      if (!neighbors || neighbors.size === 0) continue;

      // Prefer a neighbour that is already wide enough — merging two slivers into
      // each other usually just yields a bigger sliver. Within that preference,
      // pick the closest colour so the merge is least visible.
      let bestNeighbor = -1;
      let bestDist = Infinity;
      let bestIsWide = false;
      const myLab = labPalette[region.colorIndex];

      for (const nId of neighbors) {
        const resolvedId = resolveTarget(nId);
        if (resolvedId === region.id) continue;
        const neighbor = regionById[resolvedId];
        if (!neighbor) continue;

        const isWide = thickness[resolvedId] >= minThickness;
        if (bestIsWide && !isWide) continue;

        const nLab = labPalette[neighbor.colorIndex];
        const d = deltaE2000(myLab[0], myLab[1], myLab[2], nLab[0], nLab[1], nLab[2]);
        if ((isWide && !bestIsWide) || d < bestDist) {
          bestDist = d;
          bestNeighbor = resolvedId;
          bestIsWide = isWide;
        }
      }

      if (bestNeighbor === -1) continue;

      mergeTarget[region.id] = bestNeighbor;

      // Transfer adjacency
      const targetNeighbors = adjacency[bestNeighbor]!;
      for (const n of neighbors) {
        const rn = resolveTarget(n);
        if (rn !== bestNeighbor && rn !== region.id) {
          targetNeighbors.add(n);
          adjacency[n]?.delete(region.id);
          adjacency[n]?.add(bestNeighbor);
        }
      }
      targetNeighbors.delete(region.id);

      mergedCount++;
    }

    if (mergedCount === 0) break;

    for (let i = 0; i <= maxId; i++) {
      if (mergeTarget[i] !== -1) mergeTarget[i] = resolveTarget(i);
    }
    for (let i = 0; i < totalPixels; i++) {
      const label = labelMap[i];
      if (mergeTarget[label] !== -1) labelMap[i] = mergeTarget[label];
    }

    current = rebuildRegions(labelMap, width, height, regionById);
  }

  onProgress?.(100);
  return current;
}
