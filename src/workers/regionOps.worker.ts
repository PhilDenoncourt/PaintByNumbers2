import {
  suggestMergeTargets,
  performMerge,
  analyzeSplitCandidates,
  performSplit,
} from '../algorithms/smartRegionOps';
import type {
  SuggestMergeInput,
  SuggestMergeOutput,
  PerformMergeInput,
  PerformMergeOutput,
  SplitCandidatesInput,
  SplitCandidatesOutput,
  PerformSplitInput,
  PerformSplitOutput,
} from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    if (type === 'suggest-merge') {
      const input = payload as SuggestMergeInput;
      const suggestions = suggestMergeTargets(
        input.sourceRegionId,
        input.regions,
        input.labelMap,
        input.palette,
        input.labPalette,
        input.width,
        input.height,
        input.topN || 5
      );

      const output: SuggestMergeOutput = { suggestions };
      self.postMessage({ type: 'result', payload: output });
    } else if (type === 'perform-merge') {
      const input = payload as PerformMergeInput;
      const result = performMerge(
        input.regionAId,
        input.regionBId,
        input.labelMap,
        input.regions
      );

      const output: PerformMergeOutput = {
        labelMap: result.labelMap,
        regions: result.regions,
        mergedRegionId: result.mergedRegionId,
      };

      self.postMessage(
        { type: 'result', payload: output },
        { transfer: [result.labelMap.buffer] }
      );
    } else if (type === 'split-candidates') {
      const input = payload as SplitCandidatesInput;
      const analysis = analyzeSplitCandidates(
        input.regionId,
        input.labelMap,
        input.palette,
        input.width,
        input.height,
        input.imageData,
        2 // sampling rate
      );

      const output: SplitCandidatesOutput = { analysis };
      self.postMessage({ type: 'result', payload: output });
    } else if (type === 'perform-split') {
      const input = payload as PerformSplitInput;
      const result = performSplit(
        input.regionId,
        input.splitX,
        input.splitY,
        input.labelMap,
        input.regions,
        input.imageData,
        input.colorThreshold || 30,
        input.width,
        input.height
      );

      const output: PerformSplitOutput = {
        labelMap: result.labelMap,
        regions: result.regions,
        newRegionId: result.newRegionId,
      };

      self.postMessage(
        { type: 'result', payload: output },
        { transfer: [result.labelMap.buffer] }
      );
    } else {
      self.postMessage({ type: 'error', message: `Unknown operation: ${type}` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Region operation failed';
    self.postMessage({ type: 'error', message });
  }
};
