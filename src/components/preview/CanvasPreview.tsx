import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../state/appStore';

export function CanvasPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const result = useAppStore((s) => s.result);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const selectedColor = useAppStore((s) => s.ui.selectedColor);
  const hoveredRegion = useAppStore((s) => s.ui.hoveredRegion);
  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const borderWidth = useAppStore((s) => s.settings.borderWidth);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d')!;
    const { width, height, palette, contours, labels } = result;

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    const showColor = viewMode === 'colored' || viewMode === 'overlay';

    // Draw filled regions
    for (const contour of contours) {
      const { outerRing, holes, colorIndex } = contour;
      if (outerRing.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(outerRing[0].x, outerRing[0].y);
      for (let i = 1; i < outerRing.length; i++) {
        ctx.lineTo(outerRing[i].x, outerRing[i].y);
      }
      ctx.closePath();

      // Holes
      for (const hole of holes) {
        if (hole.length < 3) continue;
        ctx.moveTo(hole[0].x, hole[0].y);
        for (let i = 1; i < hole.length; i++) {
          ctx.lineTo(hole[i].x, hole[i].y);
        }
        ctx.closePath();
      }

      if (showColor) {
        const [r, g, b] = palette[colorIndex];
        const isDimmed =
          (selectedColor !== null && colorIndex !== selectedColor);
        ctx.fillStyle = isDimmed
          ? `rgba(${r},${g},${b},0.3)`
          : `rgb(${r},${g},${b})`;
      } else {
        ctx.fillStyle = 'white';
      }
      ctx.fill('evenodd');

      // Highlight hovered region
      if (hoveredRegion === contour.regionId) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fill('evenodd');
      }

      // Outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Draw color bleeding prevention borders (white borders around regions)
    if (borderWidth > 0) {
      for (const contour of contours) {
        const { outerRing, holes } = contour;
        if (outerRing.length < 3) continue;

        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer ring border
        ctx.beginPath();
        ctx.moveTo(outerRing[0].x, outerRing[0].y);
        for (let i = 1; i < outerRing.length; i++) {
          ctx.lineTo(outerRing[i].x, outerRing[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Hole borders
        for (const hole of holes) {
          if (hole.length < 3) continue;
          ctx.beginPath();
          ctx.moveTo(hole[0].x, hole[0].y);
          for (let i = 1; i < hole.length; i++) {
            ctx.lineTo(hole[i].x, hole[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // Draw labels
    for (const label of labels) {
      const fontSize = Math.max(5, Math.min(label.maxInscribedRadius * 0.8, 14));
      ctx.font = `${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(label.colorIndex + 1), label.x, label.y);
    }

    ctx.restore();
  }, [result, viewMode, selectedColor, hoveredRegion, borderWidth]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!result) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
        transformOrigin: 'top left',
        imageRendering: zoom > 2 ? 'pixelated' : 'auto',
      }}
      className="block max-w-full max-h-full"
    />
  );
}
