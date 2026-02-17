import { placeAllLabels } from '../algorithms/polylabel';
import type { LabelInput, LabelOutput } from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return;
  const input = e.data.payload as LabelInput;

  try {
    const labels = placeAllLabels(
      input.contours,
      (percent) => {
        self.postMessage({ type: 'progress', percent, message: 'Placing labels...' });
      }
    );

    const output: LabelOutput = { labels };

    self.postMessage({ type: 'result', payload: output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Label placement failed';
    self.postMessage({ type: 'error', message });
  }
};
