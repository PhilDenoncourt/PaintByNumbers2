import { connectedComponents } from '../algorithms/connectedComponents';
import type { SegmentInput, SegmentOutput } from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return;
  const input = e.data.payload as SegmentInput;

  try {
    const { labelMap, regions } = connectedComponents(
      input.indexMap,
      input.width,
      input.height,
      (percent) => {
        self.postMessage({ type: 'progress', percent, message: 'Finding regions...' });
      }
    );

    const output: SegmentOutput = { labelMap, regions };

    self.postMessage(
      { type: 'result', payload: output },
      { transfer: [labelMap.buffer] }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Segmentation failed';
    self.postMessage({ type: 'error', message });
  }
};
