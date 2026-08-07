import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useAppStore } from '../../state/appStore';
import { useRenderLabels } from '../../state/useRenderLabels';
import { labelAtPoint, type RenderLabel } from '../../utils/labels';
import { screenToImage, imageScale } from '../../utils/canvasCoords';

/** Pointer travel (screen px) below which a press counts as a click, not a drag. */
const TAP_THRESHOLD_PX = 6;

interface DragState {
  regionId: number;
  colorIndex: number;
  fontSize: number;
  fontFamily: string;
  /** Grab offset in image coords, so the number doesn't jump to the cursor. */
  grabDx: number;
  grabDy: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
}

/**
 * The number currently being dragged, drawn in the DOM. `left/top/fontSizePx` are already
 * in overlay-relative screen units — computed in the pointer handlers rather than at
 * render time, since measuring the canvas during render is not allowed.
 */
interface Ghost {
  imgX: number;
  imgY: number;
  left: number;
  top: number;
  fontSizePx: number;
  fontFamily: string;
  text: string;
}

export function RegionHoverOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const result = useAppStore((s) => s.result);
  const setHoveredRegion = useAppStore((s) => s.setHoveredRegion);
  const changeRegionColor = useAppStore((s) => s.changeRegionColor);
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const toggleRegionSelection = useAppStore((s) => s.toggleRegionSelection);
  const suggestMergeTargets = useAppStore((s) => s.suggestMergeTargets);
  const analyzeSplitCandidates = useAppStore((s) => s.analyzeSplitCandidates);
  const selectedRegions = useAppStore((s) => s.ui.selectedRegions);
  const setLabelOverride = useAppStore((s) => s.setLabelOverride);
  const clearLabelOverride = useAppStore((s) => s.clearLabelOverride);
  const setDraggingLabel = useAppStore((s) => s.setDraggingLabel);

  const renderLabels = useRenderLabels();

  const dragRef = useRef<DragState | null>(null);
  // The live drag position. Kept local so the canvas — which repaints every contour — is
  // not asked to redraw on every pointer move.
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [overLabel, setOverLabel] = useState(false);

  // Find canvas element - it's a sibling within the parent container
  useLayoutEffect(() => {
    if (!overlayRef.current) return;
    const container = overlayRef.current.parentElement;
    const canvas = container?.querySelector('canvas');
    if (canvas instanceof HTMLCanvasElement) {
      canvasRef.current = canvas;
    }
  }, []);

  /** Image coords under the pointer, or null when outside the image. */
  const pointAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!result || !canvasRef.current) return null;
      const p = screenToImage(clientX, clientY, canvasRef.current);
      if (p.x < 0 || p.y < 0 || p.x >= result.width || p.y >= result.height) return null;
      return p;
    },
    [result]
  );

  const labelUnder = useCallback(
    (clientX: number, clientY: number): RenderLabel | null => {
      const p = pointAt(clientX, clientY);
      if (!p || !canvasRef.current) return null;
      // Keep the grab target at least ~10 screen px across so small numbers stay usable.
      const slop = 10 / Math.max(imageScale(canvasRef.current), 0.0001);
      return labelAtPoint(renderLabels, p.x, p.y, slop);
    },
    [pointAt, renderLabels]
  );

  /** Position the DOM ghost from image coords, measuring the canvas now (not at render). */
  const makeGhost = useCallback(
    (imgX: number, imgY: number, fontSize: number, fontFamily: string, text: string): Ghost | null => {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return null;
      const canvasRect = canvas.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const scale = imageScale(canvas);
      return {
        imgX,
        imgY,
        left: canvasRect.left - overlayRect.left + imgX * scale,
        top: canvasRect.top - overlayRect.top + imgY * scale,
        fontSizePx: fontSize * scale,
        fontFamily,
        text,
      };
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || mergeMode !== 'browse') return;
      const label = labelUnder(e.clientX, e.clientY);
      if (!label) return;
      const p = pointAt(e.clientX, e.clientY);
      if (!p) return;

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        regionId: label.regionId,
        colorIndex: label.colorIndex,
        fontSize: label.fontSize,
        fontFamily: label.font.css,
        grabDx: label.x - p.x,
        grabDy: label.y - p.y,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
      };
      setDraggingLabel(label.regionId);
      setGhost(makeGhost(label.x, label.y, label.fontSize, label.font.css, String(label.colorIndex + 1)));
    },
    [mergeMode, labelUnder, pointAt, makeGhost, setDraggingLabel]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;

      if (drag) {
        if (Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY) > TAP_THRESHOLD_PX) {
          drag.moved = true;
        }
        if (!canvasRef.current || !result) return;
        const p = screenToImage(e.clientX, e.clientY, canvasRef.current);
        // Clamp to the image so a number can't be dragged off the artwork.
        const x = Math.max(0, Math.min(result.width - 1, p.x + drag.grabDx));
        const y = Math.max(0, Math.min(result.height - 1, p.y + drag.grabDy));
        setGhost(makeGhost(x, y, drag.fontSize, drag.fontFamily, String(drag.colorIndex + 1)));
        return;
      }

      // Hover highlight
      const p = pointAt(e.clientX, e.clientY);
      if (!p || !result) {
        setHoveredRegion(null);
        setOverLabel(false);
        return;
      }
      setOverLabel(mergeMode === 'browse' && labelUnder(e.clientX, e.clientY) !== null);
      setHoveredRegion(result.labelMap[Math.floor(p.y) * result.width + Math.floor(p.x)]);
    },
    [result, mergeMode, pointAt, labelUnder, makeGhost, setHoveredRegion]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      if (drag.moved && ghost) {
        setLabelOverride(drag.regionId, ghost.imgX, ghost.imgY);
      }
      setGhost(null);
      setDraggingLabel(null);
    },
    [ghost, setLabelOverride, setDraggingLabel]
  );

  const onClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!result) return;
      if (mergeMode === 'browse') return; // No action in browse mode

      const p = pointAt(e.clientX, e.clientY);
      if (!p) return;

      const regionId = result.labelMap[Math.floor(p.y) * result.width + Math.floor(p.x)];

      if (mergeMode === 'merge') {
        // Toggle selection
        toggleRegionSelection(regionId);

        // If this is the first selection, suggest merge targets
        if (selectedRegions.length === 0) {
          await suggestMergeTargets(regionId);
        }
      } else if (mergeMode === 'split') {
        // Analyze region for split candidates
        await analyzeSplitCandidates(regionId);
      }
    },
    [result, mergeMode, pointAt, selectedRegions, toggleRegionSelection, suggestMergeTargets, analyzeSplitCandidates]
  );

  /** Double-click a moved number to send it back to its automatic position. */
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (mergeMode !== 'browse') return;
      const label = labelUnder(e.clientX, e.clientY);
      if (label?.moved) clearLabelOverride(label.regionId);
    },
    [mergeMode, labelUnder, clearLabelOverride]
  );

  const onPointerLeave = useCallback(() => {
    if (dragRef.current) return;
    setHoveredRegion(null);
    setOverLabel(false);
  }, [setHoveredRegion]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-color-index')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const colorIndexStr = e.dataTransfer.getData('application/x-color-index');
      if (!colorIndexStr || !result) return;

      e.preventDefault();
      const newColorIndex = parseInt(colorIndexStr, 10);

      const p = pointAt(e.clientX, e.clientY);
      if (!p) return;

      const regionId = result.labelMap[Math.floor(p.y) * result.width + Math.floor(p.x)];
      if (regionId !== undefined && regionId >= 0) {
        changeRegionColor(regionId, newColorIndex);
      }
    },
    [result, pointAt, changeRegionColor]
  );

  if (!result) return null;

  const cursorStyle: React.CSSProperties = {
    cursor:
      mergeMode === 'merge'
        ? 'crosshair'
        : mergeMode === 'split'
          ? 'cell'
          : ghost
            ? 'grabbing'
            : overLabel
              ? 'grab'
              : 'auto',
    // Stop the browser from scrolling the page out from under a touch drag.
    touchAction: ghost ? 'none' : undefined,
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={cursorStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {ghost && (
        <span
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none leading-none text-[#1d4ed8]"
          style={{
            left: ghost.left,
            top: ghost.top,
            fontSize: `${ghost.fontSizePx}px`,
            fontFamily: ghost.fontFamily,
          }}
        >
          {ghost.text}
        </span>
      )}
    </div>
  );
}
