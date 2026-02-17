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
