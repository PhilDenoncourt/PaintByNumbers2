import { kmeansQuantize, fixedPaletteQuantize } from '../algorithms/kmeans';
import type { QuantizeInput, QuantizeOutput } from '../pipeline/types';

self.onmessage = (e: MessageEvent) => {
  if (e.data.type !== 'run') return;
  const input = e.data.payload as QuantizeInput;

  try {
    const onProgress = (percent: number) => {
      self.postMessage({ type: 'progress', percent, message: 'Quantizing colors...' });
    };

    let result: QuantizeOutput & { labPalette: [number, number, number][] };

    if (input.fixedPalette && input.fixedPalette.length > 0) {
      // Use the pre-defined palette — just map pixels to nearest colors
      result = fixedPaletteQuantize(
        input.pixels,
        input.width,
        input.height,
        input.fixedPalette,
        onProgress
      );
    } else {
      // Auto-generate palette with k-means
      result = kmeansQuantize(
        input.pixels,
        input.width,
        input.height,
        input.paletteSize,
        onProgress
      );
    }

    const output: QuantizeOutput & { labPalette: [number, number, number][] } = result;

    self.postMessage(
      { type: 'result', payload: output },
      { transfer: [output.indexMap.buffer] }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quantization failed';
    self.postMessage({ type: 'error', message });
  }
};
