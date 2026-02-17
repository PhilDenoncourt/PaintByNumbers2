import { mergeSmallRegions } from '../algorithms/regionMerge';
import type { MergeInput, MergeOutput } from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return;
  const input = e.data.payload as MergeInput & {
    palette: [number, number, number][];
    labPalette: [number, number, number][];
  };

  try {
    const { labelMap, regions } = mergeSmallRegions(
      input.labelMap,
      input.indexMap,
      input.regions,
      input.width,
      input.height,
      input.minRegionSize,
      input.palette,
      input.labPalette,
      (percent) => {
        self.postMessage({ type: 'progress', percent, message: 'Merging small regions...' });
      }
    );

    const output: MergeOutput = { labelMap, regions };

    self.postMessage(
      { type: 'result', payload: output },
      { transfer: [labelMap.buffer] }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Merge failed';
    self.postMessage({ type: 'error', message });
  }
};
