export type PipelineStage = 'quantize' | 'segment' | 'merge' | 'contour' | 'label';

export type ViewMode = 'colored' | 'print' | 'sidebyside' | 'overlay';

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
}
