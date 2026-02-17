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

interface HistoryEntry {
  settings: PipelineSettings;
  result: PipelineResult | null;
  timestamp: number;
}

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

  history: HistoryEntry[];
  historyIndex: number;
  paletteColorOrder: number[] | null; // null = original order, else: [newIndex0, newIndex1, ...]

  loadImage: (file: File) => Promise<void>;
  updateSettings: (partial: Partial<PipelineSettings>) => void;
  startPipeline: () => Promise<void>;
  setHoveredRegion: (id: number | null) => void;
  setSelectedColor: (idx: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoomPan: (zoom: number, panX: number, panY: number) => void;
  undo: () => void;
  redo: () => void;
  reorderPalette: (oldIndex: number, newIndex: number) => void;
  changeRegionColor: (regionId: number, newColorIndex: number) => void;
  reset: () => void;
}

const defaultSettings: PipelineSettings = {
  paletteSize: 12,
  algorithm: 'kmeans',
  minRegionSize: 50,
  detailLevel: 30,
  simplificationEpsilon: 1.5,
  presetPaletteId: null,
  customPalette: null,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  borderWidth: 0,
  smoothingPasses: 0,
  preserveCorners: false,
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

  history: [],
  historyIndex: -1,
  paletteColorOrder: null,

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
      set((s) => {
        // Add to history after successful pipeline
        const newHistory = s.history.slice(0, s.historyIndex + 1);
        newHistory.push({ settings: { ...settings }, result, timestamp: Date.now() });
        return {
          pipeline: { status: 'complete', currentStage: null, stageProgress: 100, error: null },
          result,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
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

  undo: () => {
    set((s) => {
      if (s.historyIndex <= 0) return {};
      const newIndex = s.historyIndex - 1;
      const entry = s.history[newIndex];
      return {
        historyIndex: newIndex,
        settings: { ...entry.settings },
        result: entry.result,
      };
    });
  },

  redo: () => {
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return {};
      const newIndex = s.historyIndex + 1;
      const entry = s.history[newIndex];
      return {
        historyIndex: newIndex,
        settings: { ...entry.settings },
        result: entry.result,
      };
    });
  },

  reorderPalette: (oldIndex: number, newIndex: number) => {
    set((s) => {
      if (!s.result) return {};
      
      // Create new color order or use existing
      let order = s.paletteColorOrder ? [...s.paletteColorOrder] : Array.from({ length: s.result.palette.length }, (_, i) => i);
      
      // Remove from oldIndex and insert at newIndex
      const [moved] = order.splice(oldIndex, 1);
      order.splice(newIndex, 0, moved);
      
      return { paletteColorOrder: order };
    });
  },

  changeRegionColor: (regionId: number, newColorIndex: number) => {
    set((s) => {
      if (!s.result) return {};

      const newResult = { ...s.result };

      // Update contours
      newResult.contours = newResult.contours.map((contour) =>
        contour.regionId === regionId
          ? { ...contour, colorIndex: newColorIndex }
          : contour
      );

      // Update labels
      newResult.labels = newResult.labels.map((label) =>
        label.regionId === regionId
          ? { ...label, colorIndex: newColorIndex }
          : label
      );

      // Update regions
      newResult.regions = newResult.regions.map((region) =>
        region.id === regionId
          ? { ...region, colorIndex: newColorIndex }
          : region
      );

      return { result: newResult };
    });
  },

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
      history: [],
      historyIndex: -1,
      paletteColorOrder: null,
    });
  },
}));
