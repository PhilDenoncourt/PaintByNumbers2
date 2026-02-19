export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function imageToImageData(
  img: HTMLImageElement,
  maxPixels: number = 4_000_000
): { imageData: ImageData; scaleFactor: number } {
  let { naturalWidth: w, naturalHeight: h } = img;
  let scaleFactor = 1;

  const totalPixels = w * h;
  if (totalPixels > maxPixels) {
    scaleFactor = Math.sqrt(maxPixels / totalPixels);
    w = Math.round(w * scaleFactor);
    h = Math.round(h * scaleFactor);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  return { imageData, scaleFactor };
}

/**
 * Build a fresh ImageData from a source HTMLImageElement, applying rotation
 * (clockwise) first, then an optional normalized crop rect.
 * Downscales if the result would exceed maxPixels.
 */
export function applyCropRotate(
  img: HTMLImageElement,
  cropRect: { x: number; y: number; w: number; h: number } | null,
  rotation: 0 | 90 | 180 | 270,
  maxPixels: number = 4_000_000
): { imageData: ImageData; scaleFactor: number } {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;

  // Rotation swaps dimensions at 90° / 270°
  const rotW = rotation === 90 || rotation === 270 ? sh : sw;
  const rotH = rotation === 90 || rotation === 270 ? sw : sh;

  // Draw the full image rotated into a temporary canvas
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = rotW;
  tmpCanvas.height = rotH;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.save();
  tmpCtx.translate(rotW / 2, rotH / 2);
  tmpCtx.rotate((rotation * Math.PI) / 180);
  tmpCtx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
  tmpCtx.restore();

  // Determine crop in rotated-image pixel coordinates
  const crop = cropRect ?? { x: 0, y: 0, w: 1, h: 1 };
  const cropPxX = Math.round(crop.x * rotW);
  const cropPxY = Math.round(crop.y * rotH);
  const cropPxW = Math.max(1, Math.round(crop.w * rotW));
  const cropPxH = Math.max(1, Math.round(crop.h * rotH));

  // Downscale to stay within maxPixels
  let outW = cropPxW;
  let outH = cropPxH;
  let scaleFactor = 1;
  if (outW * outH > maxPixels) {
    scaleFactor = Math.sqrt(maxPixels / (outW * outH));
    outW = Math.max(1, Math.round(outW * scaleFactor));
    outH = Math.max(1, Math.round(outH * scaleFactor));
  }

  // Copy the cropped, scaled region to the output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.drawImage(tmpCanvas, cropPxX, cropPxY, cropPxW, cropPxH, 0, 0, outW, outH);

  return { imageData: outCtx.getImageData(0, 0, outW, outH), scaleFactor };
}
