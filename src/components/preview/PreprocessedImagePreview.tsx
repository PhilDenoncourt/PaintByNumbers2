import { useRef, useEffect } from 'react';
import { useAppStore } from '../../state/appStore';
import { applyPreprocessing } from '../../utils/preprocessImage';

export function PreprocessedImagePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const settings = useAppStore((s) => s.settings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImageData || pipelineStatus === 'running') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if any preprocessing is active
    const hasPreprocessing =
      settings.brightness !== 0 ||
      settings.contrast !== 0 ||
      settings.saturation !== 0;

    if (!hasPreprocessing) return;

    // Create a copy of the image data to avoid modifying the original
    const processedData = new ImageData(
      new Uint8ClampedArray(sourceImageData.data),
      sourceImageData.width,
      sourceImageData.height
    );

    // Apply preprocessing
    applyPreprocessing(processedData, {
      brightness: settings.brightness,
      contrast: settings.contrast,
      saturation: settings.saturation,
    });

    // Set canvas size and draw
    canvas.width = sourceImageData.width;
    canvas.height = sourceImageData.height;
    ctx.putImageData(processedData, 0, 0);
  }, [sourceImageData, settings, pipelineStatus]);

  if (!sourceImageData) return null;

  // Check if any preprocessing is active
  const hasPreprocessing =
    settings.brightness !== 0 ||
    settings.contrast !== 0 ||
    settings.saturation !== 0;

  if (!hasPreprocessing) return null;

  return (
    <canvas
      ref={canvasRef}
      className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md mx-auto"
      style={{ display: 'block' }}
    />
  );
}
