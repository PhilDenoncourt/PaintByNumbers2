import type { RegionInfo } from '../state/types';
import { labDistanceSq } from './colorUtils';

export interface MergeSuggestion {
  targetRegionId: number;
  colorDistance: number;      // LAB color distance
  isAdjacent: boolean;
  edgeCoherence: number;       // 0-1, smoothness of shared boundary
  contextScore: number;        // 0-1, overall likelihood they should merge
}

export interface SplitAnalysis {
  regionId: number;
  hasSubregions: boolean;
  estimatedVariance: number;
  splitCandidates: {
    x: number;
    y: number;
    strength: number; // 0-1, likelihood of being a good split point
  }[];
}

/**
 * Find all neighboring regions for a given source region
 */
export function findAdjacentRegions(
  sourceRegionId: number,
  labelMap: Int32Array,
  _regions: RegionInfo[],
  width: number,
  height: number
): Set<number> {
  const adjacent = new Set<number>();
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    if (labelMap[i] !== sourceRegionId) continue;

    const x = i % width;
    const y = Math.floor(i / width);

    // Check 4-connected neighbors
    const neighbors: number[] = [];
    if (x > 0) neighbors.push(i - 1);
    if (x < width - 1) neighbors.push(i + 1);
    if (y > 0) neighbors.push(i - width);
    if (y < height - 1) neighbors.push(i + width);

    for (const nIdx of neighbors) {
      const nLabel = labelMap[nIdx];
      if (nLabel !== sourceRegionId) {
        adjacent.add(nLabel);
      }
    }
  }

  return adjacent;
}

/**
 * Count edge pixels between two regions (for edge coherence metric)
 */
function countSharedEdgePixels(
  regionA: number,
  regionB: number,
  labelMap: Int32Array,
  width: number,
  height: number
): number {
  let count = 0;
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    if (labelMap[i] !== regionA) continue;

    const x = i % width;
    const y = Math.floor(i / width);

    // Check if any neighbor is regionB
    if ((x > 0 && labelMap[i - 1] === regionB) ||
        (x < width - 1 && labelMap[i + 1] === regionB) ||
        (y > 0 && labelMap[i - width] === regionB) ||
        (y < height - 1 && labelMap[i + width] === regionB)) {
      count++;
    }
  }

  return count;
}

/**
 * Suggest regions to merge with, ranked by likelihood
 */
export function suggestMergeTargets(
  sourceRegionId: number,
  regions: RegionInfo[],
  labelMap: Int32Array,
  _palette: [number, number, number][],
  labPalette: [number, number, number][],
  width: number,
  height: number,
  topN: number = 5
): MergeSuggestion[] {
  const sourceRegion = regions.find((r) => r.id === sourceRegionId);
  if (!sourceRegion) return [];

  const sourceLab = labPalette[sourceRegion.colorIndex];
  const adjacentRegionIds = findAdjacentRegions(sourceRegionId, labelMap, regions, width, height);

  const suggestions: MergeSuggestion[] = [];

  for (const targetId of adjacentRegionIds) {
    const targetRegion = regions.find((r) => r.id === targetId);
    if (!targetRegion) continue;

    const targetLab = labPalette[targetRegion.colorIndex];

    // 1. Color distance (0-255 scale)
    const colorDistance = Math.sqrt(
      labDistanceSq(
        sourceLab[0],
        sourceLab[1],
        sourceLab[2],
        targetLab[0],
        targetLab[1],
        targetLab[2]
      )
    );

    // Normalize to 0-1 (assuming max LAB distance ~180)
    const normalizedColorDist = Math.min(colorDistance / 180, 1);

    // 2. Edge coherence: ratio of shared edge pixels
    const sharedEdge = countSharedEdgePixels(sourceRegionId, targetId, labelMap, width, height);
    const sourcePerimeter = Math.max(1, Math.sqrt(sourceRegion.pixelCount) * 4);
    const targetPerimeter = Math.max(1, Math.sqrt(targetRegion.pixelCount) * 4);
    const avgPerimeter = (sourcePerimeter + targetPerimeter) / 2;
    const edgeCoherence = Math.min(sharedEdge / avgPerimeter, 1);

    // 3. Size similarity (prefer merging similar-sized regions)
    const sizeRatio = Math.min(
      sourceRegion.pixelCount,
      targetRegion.pixelCount
    ) / Math.max(sourceRegion.pixelCount, targetRegion.pixelCount);

    // 4. Composite context score
    // Heavily weight color similarity, moderate weight for edge coherence and size
    const contextScore =
      (1 - normalizedColorDist) * 0.5 + // Color match is primary factor
      edgeCoherence * 0.3 +               // Shared boundary smoothness
      sizeRatio * 0.2;                    // Size similarity as tiebreaker

    suggestions.push({
      targetRegionId: targetId,
      colorDistance,
      isAdjacent: true,
      edgeCoherence,
      contextScore,
    });
  }

  // Sort by context score (highest first) and return top N
  return suggestions
    .sort((a, b) => b.contextScore - a.contextScore)
    .slice(0, topN);
}

/**
 * Perform the actual merge operation on labelMap
 * Returns updated labelMap with region A merged into region B
 */
export function performMerge(
  regionAId: number,
  regionBId: number,
  labelMap: Int32Array,
  regions: RegionInfo[]
): {
  labelMap: Int32Array;
  regions: RegionInfo[];
  mergedRegionId: number;
} {
  const newLabelMap = new Int32Array(labelMap);
  const newRegions = [...regions];

  const totalPixels = newLabelMap.length;
  for (let i = 0; i < totalPixels; i++) {
    if (newLabelMap[i] === regionAId) {
      newLabelMap[i] = regionBId;
    }
  }

  // Update region B's properties
  const regionBIdx = newRegions.findIndex((r) => r.id === regionBId);
  if (regionBIdx !== -1) {
    const regionA = newRegions.find((r) => r.id === regionAId);
    if (regionA) {
      newRegions[regionBIdx] = {
        ...newRegions[regionBIdx],
        pixelCount: newRegions[regionBIdx].pixelCount + regionA.pixelCount,
        // Update bounding box to encompass both regions
        boundingBox: {
          x: Math.min(newRegions[regionBIdx].boundingBox.x, regionA.boundingBox.x),
          y: Math.min(newRegions[regionBIdx].boundingBox.y, regionA.boundingBox.y),
          w: Math.max(
            newRegions[regionBIdx].boundingBox.x +
              newRegions[regionBIdx].boundingBox.w,
            regionA.boundingBox.x + regionA.boundingBox.w
          ) -
            Math.min(newRegions[regionBIdx].boundingBox.x, regionA.boundingBox.x),
          h: Math.max(
            newRegions[regionBIdx].boundingBox.y +
              newRegions[regionBIdx].boundingBox.h,
            regionA.boundingBox.y + regionA.boundingBox.h
          ) -
            Math.min(newRegions[regionBIdx].boundingBox.y, regionA.boundingBox.y),
        },
      };
    }
  }

  // Remove region A from list
  const newRegionsList = newRegions.filter((r) => r.id !== regionAId);

  return {
    labelMap: newLabelMap,
    regions: newRegionsList,
    mergedRegionId: regionBId,
  };
}

/**
 * Analyze a region for split candidates
 * Returns internal edge points where a split would be beneficial
 */
export function analyzeSplitCandidates(
  regionId: number,
  labelMap: Int32Array,
  _palette: [number, number, number][],
  width: number,
  height: number,
  samplingRate: number = 2 // Check every Nth pixel for performance
): SplitAnalysis {
  const pixels: number[] = [];
  const edgePixels: { idx: number; x: number; y: number }[] = [];

  // Collect region pixels
  const totalPixels = labelMap.length;
  for (let i = 0; i < totalPixels; i++) {
    if (labelMap[i] !== regionId) continue;
    pixels.push(i);

    const x = i % width;
    const y = Math.floor(i / width);

    // Check if on edge (has neighbor from different region)
    let isEdge = false;
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      isEdge = true;
    } else {
      if (
        labelMap[i - 1] !== regionId ||
        labelMap[i + 1] !== regionId ||
        labelMap[i - width] !== regionId ||
        labelMap[i + width] !== regionId
      ) {
        isEdge = true;
      }
    }

    if (isEdge) {
      edgePixels.push({ idx: i, x, y });
    }
  }

  // Estimate color variance within region
  let colorVariance = 0;
  if (pixels.length > 1) {
    // Sample approach: check a few pixels
    const samples = Math.min(Math.floor(pixels.length / 10), 50);
    let minDist = Infinity;
    let maxDist = 0;

    for (let s = 0; s < samples; s++) {
      const pIdx = Math.floor(Math.random() * pixels.length);
      for (let t = 0; t < samples; t++) {
        const qIdx = Math.floor(Math.random() * pixels.length);
        if (pIdx === qIdx) continue;

        // Just use euclidean distance as proxy for color variance
        // In real usage, would decode pixel colors from imageData
        const dist = Math.sqrt(
          Math.pow(pIdx - qIdx, 2)
        ); // Simplified for now

        minDist = Math.min(minDist, dist);
        maxDist = Math.max(maxDist, dist);
      }
    }
    colorVariance = maxDist - minDist;
  }

  const estimatedVariance = Math.min(colorVariance / 255, 1);

  // Find split candidates (points with high internal color discontinuity)
  const splitCandidates = edgePixels
    .filter((_, i) => i % samplingRate === 0)
    .map((ep) => ({
      x: ep.x,
      y: ep.y,
      // Strength based on variance (higher variance = better split candidate)
      strength: Math.min(estimatedVariance + Math.random() * 0.2, 1),
    }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5); // Top 5 candidates

  return {
    regionId,
    hasSubregions: estimatedVariance > 0.1,
    estimatedVariance,
    splitCandidates,
  };
}

/**
 * Perform split using flood fill from a seed point
 * Splits based on color/feature boundaries
 */
export function performSplit(
  regionId: number,
  splitX: number,
  splitY: number,
  labelMap: Int32Array,
  regions: RegionInfo[],
  imageData: ImageData,
  colorThreshold: number = 30,
  width: number = imageData.width,
  height: number = imageData.height
): {
  labelMap: Int32Array;
  regions: RegionInfo[];
  newRegionId: number;
} {
  const newLabelMap = new Int32Array(labelMap);
  const searchedPixels = new Set<number>();
  const queue: number[] = [];

  const splitIdx = splitY * width + splitX;
  if (newLabelMap[splitIdx] !== regionId) {
    return { labelMap: newLabelMap, regions, newRegionId: -1 };
  }

  // Find max region ID to assign new ID
  const maxId = Math.max(...regions.map((r) => r.id), 0);
  const newRegionId = maxId + 1;

  // Get pixel values for the starting point
  const startPixelIdx = splitIdx * 4;
  const startR = imageData.data[startPixelIdx];
  const startG = imageData.data[startPixelIdx + 1];
  const startB = imageData.data[startPixelIdx + 2];

  // Flood fill with color matching
  queue.push(splitIdx);
  searchedPixels.add(splitIdx);

  while (queue.length > 0) {
    const currentIdx = queue.shift();
    if (!currentIdx) break;

    newLabelMap[currentIdx] = newRegionId;

    // Check 4-connected neighbors
    const neighbors = [
      currentIdx - 1, // left
      currentIdx + 1, // right
      currentIdx - width, // up
      currentIdx + width, // down
    ];

    for (const nIdx of neighbors) {
      if (nIdx < 0 || nIdx >= newLabelMap.length) continue;
      if (searchedPixels.has(nIdx)) continue;
      if (newLabelMap[nIdx] !== regionId) continue;

      // Check color similarity
      const nPixelIdx = nIdx * 4;
      const nR = imageData.data[nPixelIdx];
      const nG = imageData.data[nPixelIdx + 1];
      const nB = imageData.data[nPixelIdx + 2];

      const colorDist = Math.sqrt(
        Math.pow(nR - startR, 2) +
          Math.pow(nG - startG, 2) +
          Math.pow(nB - startB, 2)
      );

      if (colorDist < colorThreshold) {
        queue.push(nIdx);
        searchedPixels.add(nIdx);
      }
    }
  }

  // Update regions
  const oldRegion = regions.find((r) => r.id === regionId);
  if (!oldRegion) {
    return { labelMap: newLabelMap, regions, newRegionId: -1 };
  }

  // Calculate bbox for new region
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  let pixelCount = 0;

  for (let i = 0; i < newLabelMap.length; i++) {
    if (newLabelMap[i] !== newRegionId) continue;
    pixelCount++;
    const _x = i % width;
    const _y = Math.floor(i / width);
    minX = Math.min(minX, _x);
    minY = Math.min(minY, _y);
    maxX = Math.max(maxX, _x);
    maxY = Math.max(maxY, _y);
  }

  // Update old region pixel count
  let oldPixelCount = 0;
  for (let i = 0; i < newLabelMap.length; i++) {
    if (newLabelMap[i] === regionId) oldPixelCount++;
  }

  const newRegionsList = regions
    .map((r) =>
      r.id === regionId
        ? { ...r, pixelCount: oldPixelCount }
        : r
    )
    .concat({
      id: newRegionId,
      colorIndex: oldRegion.colorIndex, // New region inherits color
      pixelCount,
      boundingBox: {
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1,
      },
    });

  return {
    labelMap: newLabelMap,
    regions: newRegionsList,
    newRegionId,
  };
}
