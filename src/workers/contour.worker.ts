import { extractAllContours } from '../algorithms/marchingSquares';
import type { ContourInput, ContourOutput } from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return;
  const input = e.data.payload as ContourInput;

  try {
    const contours = extractAllContours(
      input.labelMap,
      input.regions,
      input.width,
      input.height,
      input.simplificationEpsilon,
      input.smoothingPasses,
      (percent: number) => {
        self.postMessage({ type: 'progress', percent, message: 'Tracing outlines...' });
      }
    );

    const output: ContourOutput = { contours };

    self.postMessage({ type: 'result', payload: output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Contour extraction failed';
    self.postMessage({ type: 'error', message });
  }
};
