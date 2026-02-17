export type PipelineStage = 'quantize' | 'segment' | 'merge' | 'contour' | 'label';

export type ViewMode = 'colored' | 'print' | 'sidebyside' | 'overlay';

export type MergeMode = 'browse' | 'merge' | 'split';

export type Algorithm = 'kmeans' | 'mediancut';

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RegionInfo {
  id: number;
  colorIndex: number;
  pixelCount: number;
  boundingBox: BBox;
}

export interface Point {
  x: number;
  y: number;
}

export interface ContourData {
  regionId: number;
  colorIndex: number;
  outerRing: Point[];
  holes: Point[][];
}

export interface LabelPlacement {
  regionId: number;
  colorIndex: number;
  x: number;
  y: number;
  maxInscribedRadius: number;
}

export interface PipelineSettings {
  paletteSize: number;
  algorithm: Algorithm;
  minRegionSize: number;
  detailLevel: number;
  simplificationEpsilon: number;
  presetPaletteId: string | null; // e.g. 'crayola-8', null = auto
  customPalette: [number, number, number][] | null; // custom RGB palette
  // Image preprocessing
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  // Color bleeding prevention
  borderWidth: number; // 0 to 5 pixels
  // Contour smoothing options
  smoothingPasses: number; // 0-3, additional smoothing iterations
  preserveCorners: boolean; // preserve sharp corners during simplification
}

export interface PipelineState {
  status: 'idle' | 'running' | 'complete' | 'error';
  currentStage: PipelineStage | null;
  stageProgress: number;
  error: string | null;
}

export interface PipelineResult {
  palette: [number, number, number][];
  labelMap: Int32Array;
  regions: RegionInfo[];
  contours: ContourData[];
  labels: LabelPlacement[];
  width: number;
  height: number;
}

export interface UIState {
  viewMode: ViewMode;
  hoveredRegion: number | null;
  selectedColor: number | null;
  zoom: number;
  panX: number;
  panY: number;
  // Region merge/split state
  mergeMode: MergeMode;
  selectedRegions: number[]; // regions selected for merge
  mergeSuggestions: Array<{
    targetRegionId: number;
    colorDistance: number;
    isAdjacent: boolean;
    edgeCoherence: number;
    contextScore: number;
  }>;
  splitAnalysis: {
    regionId: number;
    hasSubregions: boolean;
    estimatedVariance: number;
    splitCandidates: Array<{
      x: number;
      y: number;
      strength: number;
    }>;
  } | null;
}
