import { create } from 'zustand';
import type {
  PipelineSettings,
  PipelineState,
  PipelineResult,
  PipelineStage,
  UIState,
  ViewMode,
  MergeMode,
} from './types';
import { loadImageFromFile, imageToImageData } from '../utils/imageLoader';
import { runPipeline } from '../pipeline/PipelineController';
import { runRegionOpsWorker, runWorker } from '../utils/workerHelper';
import type {
  SuggestMergeInput,
  SuggestMergeOutput,
  PerformMergeInput,
  PerformMergeOutput,
  SplitCandidatesInput,
  SplitCandidatesOutput,
  PerformSplitInput,
  PerformSplitOutput,
  ContourInput,
  ContourOutput,
} from '../pipeline/types';
import RegionOpsWorker from '../workers/regionOps.worker?worker';
import ContourWorker from '../workers/contour.worker?worker';

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
  setMergeMode: (mode: MergeMode) => void;
  toggleRegionSelection: (regionId: number) => void;
  clearRegionSelection: () => void;
  suggestMergeTargets: (sourceRegionId: number) => Promise<void>;
  performMerge: (regionAId: number, regionBId: number) => Promise<void>;
  analyzeSplitCandidates: (regionId: number) => Promise<void>;
  performSplit: (regionId: number, splitX: number, splitY: number) => Promise<void>;
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
  mergeMode: 'browse',
  selectedRegions: [],
  mergeSuggestions: [],
  splitAnalysis: null,
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

  setMergeMode: (mode) => set((s) => ({ ui: { ...s.ui, mergeMode: mode, selectedRegions: [] } })),

  toggleRegionSelection: (regionId) => {
    set((s) => {
      const selected = [...s.ui.selectedRegions];
      const idx = selected.indexOf(regionId);
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else {
        selected.push(regionId);
      }
      return { ui: { ...s.ui, selectedRegions: selected } };
    });
  },

  clearRegionSelection: () => {
    set((s) => ({ ui: { ...s.ui, selectedRegions: [] } }));
  },

  suggestMergeTargets: async (sourceRegionId) => {
    const { result } = get();
    if (!result) return;

    try {
      const input: SuggestMergeInput = {
        sourceRegionId,
        regions: result.regions,
        labelMap: result.labelMap,
        palette: result.palette,
        labPalette: result.palette, // Would need separate LAB palette in real implementation
        width: result.width,
        height: result.height,
        topN: 5,
      };

      const output = await runRegionOpsWorker<SuggestMergeInput, SuggestMergeOutput>(
        RegionOpsWorker,
        'suggest-merge',
        input,
        []
      );

      set((s) => ({
        ui: {
          ...s.ui,
          mergeSuggestions: output.suggestions,
        },
      }));
    } catch (err) {
      console.error('Failed to suggest merge targets:', err);
    }
  },

  performMerge: async (regionAId, regionBId) => {
    const { result, settings } = get();
    if (!result) return;

    try {
      const input: PerformMergeInput = {
        regionAId,
        regionBId,
        labelMap: result.labelMap,
        regions: result.regions,
      };

      const output = await runRegionOpsWorker<PerformMergeInput, PerformMergeOutput>(
        RegionOpsWorker,
        'perform-merge',
        input,
        [result.labelMap.buffer]
      );

      // Recompute contours after merge to reflect new merged geometry
      const contourInput: ContourInput = {
        labelMap: output.labelMap,
        regions: output.regions,
        width: result.width,
        height: result.height,
        simplificationEpsilon: settings.simplificationEpsilon,
        smoothingPasses: settings.smoothingPasses,
        preserveCorners: settings.preserveCorners,
      };

      const contourOutput = await runWorker<ContourInput, ContourOutput>(
        ContourWorker,
        contourInput,
        [output.labelMap.buffer],
        () => {}
      );

      set((s) => {
        if (!s.result) return {};

        // Update result with new labelMap, regions, and recomputed contours
        const newResult = {
          ...s.result,
          labelMap: output.labelMap,
          regions: output.regions,
          contours: contourOutput.contours,
        };

        // Update labels to remove labels from merged region
        newResult.labels = newResult.labels.filter((l) => l.regionId !== regionAId);

        // Add to history
        const newHistory = s.history.slice(0, s.historyIndex + 1);
        newHistory.push({
          settings: { ...s.settings },
          result: newResult,
          timestamp: Date.now(),
        });

        return {
          result: newResult,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          ui: {
            ...s.ui,
            selectedRegions: [],
            mergeSuggestions: [],
          },
        };
      });
    } catch (err) {
      console.error('Failed to perform merge:', err);
    }
  },

  analyzeSplitCandidates: async (regionId) => {
    const { result } = get();
    if (!result) return;

    try {
      const input: SplitCandidatesInput = {
        regionId,
        labelMap: result.labelMap,
        palette: result.palette,
        width: result.width,
        height: result.height,
      };

      const output = await runRegionOpsWorker<SplitCandidatesInput, SplitCandidatesOutput>(
        RegionOpsWorker,
        'split-candidates',
        input,
        []
      );

      set((s) => ({
        ui: {
          ...s.ui,
          splitAnalysis: output.analysis,
        },
      }));
    } catch (err) {
      console.error('Failed to analyze split candidates:', err);
    }
  },

  performSplit: async (regionId, splitX, splitY) => {
    const { result, sourceImageData, settings } = get();
    if (!result || !sourceImageData) return;

    try {
      const input: PerformSplitInput = {
        regionId,
        splitX,
        splitY,
        labelMap: result.labelMap,
        regions: result.regions,
        imageData: sourceImageData,
        colorThreshold: 30,
        width: result.width,
        height: result.height,
      };

      const output = await runRegionOpsWorker<PerformSplitInput, PerformSplitOutput>(
        RegionOpsWorker,
        'perform-split',
        input,
        [result.labelMap.buffer]
      );

      // Recompute contours after split to get correct geometry for both new regions
      const contourInput: ContourInput = {
        labelMap: output.labelMap,
        regions: output.regions,
        width: result.width,
        height: result.height,
        simplificationEpsilon: settings.simplificationEpsilon,
        smoothingPasses: settings.smoothingPasses,
        preserveCorners: settings.preserveCorners,
      };

      const contourOutput = await runWorker<ContourInput, ContourOutput>(
        ContourWorker,
        contourInput,
        [output.labelMap.buffer],
        () => {}
      );

      set((s) => {
        if (!s.result) return {};

        const newResult = {
          ...s.result,
          labelMap: output.labelMap,
          regions: output.regions,
          contours: contourOutput.contours,
        };

        // Add to history
        const newHistory = s.history.slice(0, s.historyIndex + 1);
        newHistory.push({
          settings: { ...s.settings },
          result: newResult,
          timestamp: Date.now(),
        });

        return {
          result: newResult,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          ui: {
            ...s.ui,
            splitAnalysis: null,
            selectedRegions: [],
          },
        };
      });
    } catch (err) {
      console.error('Failed to perform split:', err);
    }
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
