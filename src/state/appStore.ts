import { create } from 'zustand';
import type {
  PipelineSettings,
  PipelineState,
  PipelineResult,
  PipelineStage,
  UIState,
  ViewMode,
} from './types';
import { loadImageFromFile, imageToImageData } from '../utils/imageLoader';
import { runPipeline } from '../pipeline/PipelineController';

interface AppState {
  sourceImage: HTMLImageElement | null;
  sourceImageUrl: string | null;
  sourceImageData: ImageData | null;
  processedWidth: number;
  processedHeight: number;

  settings: PipelineSettings;
  pipeline: PipelineState;
  result: PipelineResult | null;
  ui: UIState;

  loadImage: (file: File) => Promise<void>;
  updateSettings: (partial: Partial<PipelineSettings>) => void;
  startPipeline: () => Promise<void>;
  setHoveredRegion: (id: number | null) => void;
  setSelectedColor: (idx: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoomPan: (zoom: number, panX: number, panY: number) => void;
  reset: () => void;
}

const defaultSettings: PipelineSettings = {
  paletteSize: 12,
  algorithm: 'kmeans',
  minRegionSize: 50,
  detailLevel: 30,
  simplificationEpsilon: 1.5,
};

const defaultPipeline: PipelineState = {
  status: 'idle',
  currentStage: null,
  stageProgress: 0,
  error: null,
};

const defaultUI: UIState = {
  viewMode: 'colored',
  hoveredRegion: null,
  selectedColor: null,
  zoom: 1,
  panX: 0,
  panY: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  sourceImage: null,
  sourceImageUrl: null,
  sourceImageData: null,
  processedWidth: 0,
  processedHeight: 0,

  settings: { ...defaultSettings },
  pipeline: { ...defaultPipeline },
  result: null,
  ui: { ...defaultUI },

  loadImage: async (file: File) => {
    const oldUrl = get().sourceImageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    const img = await loadImageFromFile(file);
    const url = img.src;
    const { imageData } = imageToImageData(img);

    set({
      sourceImage: img,
      sourceImageUrl: url,
      sourceImageData: imageData,
      processedWidth: imageData.width,
      processedHeight: imageData.height,
      result: null,
      pipeline: { ...defaultPipeline },
      ui: { ...defaultUI },
    });
  },

  updateSettings: (partial) => {
    set((s) => ({ settings: { ...s.settings, ...partial } }));
  },

  startPipeline: async () => {
    const { sourceImageData, settings } = get();
    if (!sourceImageData) return;

    set({
      pipeline: { status: 'running', currentStage: 'quantize', stageProgress: 0, error: null },
      result: null,
    });

    const onProgress = (stage: PipelineStage, percent: number) => {
      set({ pipeline: { status: 'running', currentStage: stage, stageProgress: percent, error: null } });
    };

    try {
      const result = await runPipeline(sourceImageData, settings, onProgress);
      set({
        pipeline: { status: 'complete', currentStage: null, stageProgress: 100, error: null },
        result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Pipeline failed';
      set({
        pipeline: { status: 'error', currentStage: null, stageProgress: 0, error: message },
      });
    }
  },

  setHoveredRegion: (id) => set((s) => ({ ui: { ...s.ui, hoveredRegion: id } })),
  setSelectedColor: (idx) => set((s) => ({ ui: { ...s.ui, selectedColor: idx } })),
  setViewMode: (mode) => set((s) => ({ ui: { ...s.ui, viewMode: mode } })),
  setZoomPan: (zoom, panX, panY) => set((s) => ({ ui: { ...s.ui, zoom, panX, panY } })),

  reset: () => {
    const oldUrl = get().sourceImageUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    set({
      sourceImage: null,
      sourceImageUrl: null,
      sourceImageData: null,
      processedWidth: 0,
      processedHeight: 0,
      settings: { ...defaultSettings },
      pipeline: { ...defaultPipeline },
      result: null,
      ui: { ...defaultUI },
    });
  },
}));
