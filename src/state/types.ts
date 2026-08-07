export type PipelineStage = 'quantize' | 'segment' | 'merge' | 'contour' | 'label';

export type ViewMode = 'colored' | 'print' | 'sidebyside' | 'overlay';

export type MergeMode = 'browse' | 'merge' | 'split';

export type ActivePanel = 'palette' | 'adjust' | 'refine' | 'export';

export type Algorithm = 'kmeans' | 'mediancut';

export type RotationAngle = 0 | 90 | 180 | 270;

/**
 * Font family for the region numbers. Deliberately a small set: PDF export runs through
 * jsPDF, which only ships the three standard PostScript families, so anything else would
 * render on screen but silently fall back in the printable output.
 */
export type NumberFont = 'sans' | 'serif' | 'mono';

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

/**
 * A user-authored position for a region's number, keyed by regionId.
 *
 * `anchorX/anchorY` record the *automatic* placement at the time of the edit, not the
 * dragged position. The auto placement is the pole of inaccessibility — deep inside the
 * region — so looking it up in a freshly generated `labelMap` is far more likely to land
 * on the same region than the user's chosen spot, which is often near an edge.
 * `colorIndex` guards the re-anchor: if the region under the anchor changed color, the
 * override is dropped rather than applied to something the user never moved.
 */
export interface LabelOverride {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  colorIndex: number;
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
  sharpness: number;  // -100 (blur) to 100 (sharpen)
  // Crop & rotate
  cropRect: { x: number; y: number; w: number; h: number } | null; // normalized 0–1, in post-rotation space
  rotation: RotationAngle; // degrees clockwise, applied before crop
  // Color bleeding prevention
  borderWidth: number; // 0 to 5 pixels
  // Contour smoothing options
  smoothingPasses: number; // 0-3, additional smoothing iterations
  preserveCorners: boolean; // preserve sharp corners during simplification
  // Number labels
  numberFont: NumberFont;
  numberScale: number; // 0.5 to 2.0, multiplies the automatic font size
  numberMinSize: number; // 0 to 12 px, numbers smaller than this are not drawn
  keepNumbersInside: boolean; // treat holes as barriers when placing numbers
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
  activePanel: ActivePanel; // which contextual nav tab is open
  hoveredRegion: number | null;
  selectedColor: number | null;
  zoom: number;
  panX: number;
  panY: number;
  darkMode: boolean;
  // Number label being dragged — the canvas omits it so the DOM ghost can stand in
  draggingLabelId: number | null;
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
      estimatedPixelCount: number;
    }>;
  } | null;
}
