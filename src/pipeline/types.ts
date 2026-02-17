import type { RegionInfo, ContourData, LabelPlacement } from '../state/types';

export interface QuantizeInput {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  paletteSize: number;
  algorithm: 'kmeans' | 'mediancut';
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

export type WorkerMessage<T> =
  | { type: 'run'; payload: T }
  | { type: 'progress'; percent: number; message: string }
  | { type: 'result'; payload: unknown }
  | { type: 'error'; message: string };
