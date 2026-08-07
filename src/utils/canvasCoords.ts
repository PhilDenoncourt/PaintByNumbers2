/**
 * Screen <-> image coordinate mapping for the preview canvas.
 *
 * Derive the scale from the canvas's own bounding rect rather than from `ui.zoom`. The
 * rect of a transformed element already includes the CSS `transform`, and the canvas also
 * carries `max-w-full max-h-full`, so its layout size can be smaller than its backing
 * store. `rect.width / canvas.width` folds all of that into one number; reading `zoom`
 * directly gets both effects wrong.
 */

export interface ImagePoint {
  x: number;
  y: number;
}

function scaleOf(canvas: HTMLCanvasElement, rect: DOMRect): number {
  if (canvas.width === 0 || rect.width === 0) return 1;
  return rect.width / canvas.width;
}

/** Client (viewport) coords -> image pixel coords. Not rounded or clamped. */
export function screenToImage(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement
): ImagePoint {
  const rect = canvas.getBoundingClientRect();
  const scale = scaleOf(canvas, rect);
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

/** Image pixel coords -> client (viewport) coords. */
export function imageToScreen(
  imgX: number,
  imgY: number,
  canvas: HTMLCanvasElement
): ImagePoint {
  const rect = canvas.getBoundingClientRect();
  const scale = scaleOf(canvas, rect);
  return {
    x: rect.left + imgX * scale,
    y: rect.top + imgY * scale,
  };
}

/** On-screen pixels per image pixel — for sizing hit-test slop and the drag ghost. */
export function imageScale(canvas: HTMLCanvasElement): number {
  return scaleOf(canvas, canvas.getBoundingClientRect());
}
