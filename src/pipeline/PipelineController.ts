import type { PipelineSettings, PipelineStage, PipelineResult } from '../state/types';
import type { QuantizeOutput, SegmentOutput, MergeOutput, ContourOutput, LabelOutput } from './types';
import { runWorker } from '../utils/workerHelper';
import QuantizeWorker from '../workers/quantize.worker?worker';
import SegmentWorker from '../workers/segment.worker?worker';
import MergeWorker from '../workers/merge.worker?worker';
import ContourWorker from '../workers/contour.worker?worker';
import LabelWorker from '../workers/label.worker?worker';

type QuantizeOutputExt = QuantizeOutput & { labPalette: [number, number, number][] };

export async function runPipeline(
  imageData: ImageData,
  settings: PipelineSettings,
  onProgress: (stage: PipelineStage, percent: number) => void
): Promise<PipelineResult> {
  const { width, height } = imageData;

  // Make a copy of pixel data since we transfer ownership
  const pixelsCopy = new Uint8ClampedArray(imageData.data);

  // Stage 1: Quantize
  onProgress('quantize', 0);
  const quantized = await runWorker<unknown, QuantizeOutputExt>(
    QuantizeWorker,
    {
      pixels: pixelsCopy,
      width,
      height,
      paletteSize: settings.paletteSize,
      algorithm: settings.algorithm,
    },
    [pixelsCopy.buffer],
    (pct) => onProgress('quantize', pct)
  );

  // Stage 2: Segment
  onProgress('segment', 0);
  // Copy indexMap before transferring since we need it for merge
  const indexMapCopy = new Uint8Array(quantized.indexMap);
  const segmented = await runWorker<unknown, SegmentOutput>(
    SegmentWorker,
    { indexMap: quantized.indexMap, width, height },
    [quantized.indexMap.buffer],
    (pct) => onProgress('segment', pct)
  );

  // Stage 3: Merge
  onProgress('merge', 0);
  const merged = await runWorker<unknown, MergeOutput>(
    MergeWorker,
    {
      labelMap: segmented.labelMap,
      indexMap: indexMapCopy,
      regions: segmented.regions,
      width,
      height,
      minRegionSize: settings.minRegionSize,
      palette: quantized.palette,
      labPalette: quantized.labPalette,
    },
    [segmented.labelMap.buffer, indexMapCopy.buffer],
    (pct) => onProgress('merge', pct)
  );

  // Stage 4: Contour
  onProgress('contour', 0);
  // Copy labelMap before transferring since we need it in the result
  const labelMapForResult = new Int32Array(merged.labelMap);
  const contoured = await runWorker<unknown, ContourOutput>(
    ContourWorker,
    {
      labelMap: merged.labelMap,
      regions: merged.regions,
      width,
      height,
      simplificationEpsilon: settings.simplificationEpsilon,
    },
    [merged.labelMap.buffer],
    (pct) => onProgress('contour', pct)
  );

  // Stage 5: Label placement
  onProgress('label', 0);
  const labeled = await runWorker<unknown, LabelOutput>(
    LabelWorker,
    { contours: contoured.contours },
    [],
    (pct) => onProgress('label', pct)
  );

  return {
    palette: quantized.palette,
    labelMap: labelMapForResult,
    regions: merged.regions,
    contours: contoured.contours,
    labels: labeled.labels,
    width,
    height,
  };
}
