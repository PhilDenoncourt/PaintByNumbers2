import { kmeansQuantize } from '../algorithms/kmeans';
import type { QuantizeInput, QuantizeOutput } from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return;
  const input = e.data.payload as QuantizeInput;

  try {
    const { indexMap, palette, labPalette } = kmeansQuantize(
      input.pixels,
      input.width,
      input.height,
      input.paletteSize,
      (percent) => {
        self.postMessage({ type: 'progress', percent, message: 'Quantizing colors...' });
      }
    );

    const output: QuantizeOutput & { labPalette: [number, number, number][] } = {
      indexMap,
      palette,
      labPalette,
    };

    self.postMessage(
      { type: 'result', payload: output },
      { transfer: [indexMap.buffer] }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quantization failed';
    self.postMessage({ type: 'error', message });
  }
};
