import { useRef, useEffect } from 'react';
import { useAppStore } from '../../state/appStore';
import { applyPreprocessing } from '../../utils/preprocessImage';
import { applyCropRotate } from '../../utils/imageLoader';

export function PreprocessedImagePreview() {
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const sourceImage     = useAppStore((s) => s.sourceImage);
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const settings        = useAppStore((s) => s.settings);
  const pipelineStatus  = useAppStore((s) => s.pipeline.status);

  const hasCropRotate  = settings.cropRect !== null || settings.rotation !== 0;
  const hasColorAdjust = settings.brightness !== 0 || settings.contrast !== 0 || settings.saturation !== 0 || settings.sharpness !== 0;
  const hasAnyEffect   = hasCropRotate || hasColorAdjust;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pipelineStatus === 'running') return;
    if (!hasAnyEffect) return;

    let baseData: ImageData | null = null;

    if (hasCropRotate && sourceImage) {
      // Use a low-res render (0.5 MP) for the live preview — fast on main thread
      const { imageData } = applyCropRotate(
        sourceImage, settings.cropRect, settings.rotation, 500_000
      );
      baseData = imageData;
    } else if (sourceImageData) {
      baseData = new ImageData(
        new Uint8ClampedArray(sourceImageData.data),
        sourceImageData.width,
        sourceImageData.height
      );
    }

    if (!baseData) return;

    if (hasColorAdjust) {
      // Apply color adjustments on top of the (possibly cropped) base
      const copy = hasCropRotate
        ? baseData // applyCropRotate already gave us a fresh buffer
        : new ImageData(new Uint8ClampedArray(baseData.data), baseData.width, baseData.height);
      applyPreprocessing(copy, {
        brightness: settings.brightness,
        contrast:   settings.contrast,
        saturation: settings.saturation,
        sharpness:  settings.sharpness,
      });
      baseData = copy;
    }

    canvas.width  = baseData.width;
    canvas.height = baseData.height;
    canvas.getContext('2d')!.putImageData(baseData, 0, 0);
  }, [sourceImage, sourceImageData, settings, pipelineStatus, hasCropRotate, hasColorAdjust, hasAnyEffect]);

  if (!hasAnyEffect || pipelineStatus === 'running') return null;
  if (!sourceImageData && !sourceImage) return null;

  return (
    <canvas
      ref={canvasRef}
      className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md mx-auto"
      style={{ display: 'block' }}
    />
  );
}
