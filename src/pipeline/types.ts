import type { RegionInfo, ContourData, LabelPlacement } from '../state/types';

export interface QuantizeInput {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  paletteSize: number;
  algorithm: 'kmeans' | 'mediancut';
  fixedPalette?: [number, number, number][]; // preset RGB palette – skip k-means
}

export interface QuantizeOutput {
  indexMap: Uint8Array;
  palette: [number, number, number][];
}

export interface SegmentInput {
  indexMap: Uint8Array;
  width: number;
  height: number;
}

export interface SegmentOutput {
  labelMap: Int32Array;
  regions: RegionInfo[];
}

export interface MergeInput {
  labelMap: Int32Array;
  indexMap: Uint8Array;
  regions: RegionInfo[];
  width: number;
  height: number;
  minRegionSize: number;
}

export interface MergeOutput {
  labelMap: Int32Array;
  regions: RegionInfo[];
}

export interface ContourInput {
  labelMap: Int32Array;
  regions: RegionInfo[];
  width: number;
  height: number;
  simplificationEpsilon: number;
  smoothingPasses: number;
  preserveCorners: boolean;
}

export interface ContourOutput {
  contours: ContourData[];
}

export interface LabelInput {
  contours: ContourData[];
}

export interface LabelOutput {
  labels: LabelPlacement[];
}

export interface MergeSuggestion {
  targetRegionId: number;
  colorDistance: number;
  isAdjacent: boolean;
  edgeCoherence: number;
  contextScore: number;
}

export interface SuggestMergeInput {
  sourceRegionId: number;
  regions: RegionInfo[];
  labelMap: Int32Array;
  palette: [number, number, number][];
  labPalette: [number, number, number][];
  width: number;
  height: number;
  topN?: number;
}

export interface SuggestMergeOutput {
  suggestions: MergeSuggestion[];
}

export interface PerformMergeInput {
  regionAId: number;
  regionBId: number;
  labelMap: Int32Array;
  regions: RegionInfo[];
}

export interface PerformMergeOutput {
  labelMap: Int32Array;
  regions: RegionInfo[];
  mergedRegionId: number;
}

export interface SplitCandidatesInput {
  regionId: number;
  labelMap: Int32Array;
  palette: [number, number, number][];
  width: number;
  height: number;
}

export interface SplitAnalysis {
  regionId: number;
  hasSubregions: boolean;
  estimatedVariance: number;
  splitCandidates: {
    x: number;
    y: number;
    strength: number;
  }[];
}

export interface SplitCandidatesOutput {
  analysis: SplitAnalysis;
}

export interface PerformSplitInput {
  regionId: number;
  splitX: number;
  splitY: number;
  labelMap: Int32Array;
  regions: RegionInfo[];
  imageData: ImageData;
  colorThreshold?: number;
  width: number;
  height: number;
}

export interface PerformSplitOutput {
  labelMap: Int32Array;
  regions: RegionInfo[];
  newRegionId: number;
}

export type WorkerMessage<T> =
  | { type: 'run'; payload: T }
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; payload: unknown }
  | { type: 'error'; message: string };
