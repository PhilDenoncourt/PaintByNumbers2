import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import type { RotationAngle } from '../../state/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CropRectNorm { x: number; y: number; w: number; h: number }

type DragHandle = 'body' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  handle: DragHandle;
  startX: number;   // canvas px
  startY: number;
  cropAtStart: CropRectNorm;
  disp: { x: number; y: number; w: number; h: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HANDLE_R = 5;   // half-size of handle square in canvas px
const HIT_R    = 10;  // hit-test radius in canvas px
const PADDING  = 20;  // letterbox padding in canvas px
const MIN_CROP = 0.04;

// ─── Pure helpers (no React deps) ─────────────────────────────────────────────

function buildRotatedCanvas(img: HTMLImageElement, rotation: RotationAngle): HTMLCanvasElement {
  const sw = img.naturalWidth, sh = img.naturalHeight;
  const rw = rotation === 90 || rotation === 270 ? sh : sw;
  const rh = rotation === 90 || rotation === 270 ? sw : sh;
  const c = document.createElement('canvas');
  c.width = rw; c.height = rh;
  const ctx = c.getContext('2d')!;
  ctx.save();
  ctx.translate(rw / 2, rh / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
  return c;
}

function getDisplayRect(cw: number, ch: number, iw: number, ih: number) {
  const aw = cw - 2 * PADDING, ah = ch - 2 * PADDING;
  const s = Math.min(aw / iw, ah / ih, 1);
  const dw = iw * s, dh = ih * s;
  return { x: PADDING + (aw - dw) / 2, y: PADDING + (ah - dh) / 2, w: dw, h: dh };
}

type HandleMap = Record<string, [number, number]>;

function getHandlePositions(cx: number, cy: number, cw: number, ch: number): HandleMap {
  return {
    nw: [cx,       cy      ], n:  [cx + cw / 2, cy      ], ne: [cx + cw, cy      ],
    e:  [cx + cw,  cy + ch / 2],
    se: [cx + cw,  cy + ch ], s:  [cx + cw / 2, cy + ch ], sw: [cx,      cy + ch ],
    w:  [cx,       cy + ch / 2],
  };
}

function hitHandle(mx: number, my: number, handles: HandleMap): DragHandle | null {
  for (const k of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as DragHandle[]) {
    const [hx, hy] = handles[k];
    if (Math.abs(mx - hx) <= HIT_R && Math.abs(my - hy) <= HIT_R) return k;
  }
  return null;
}

const CURSORS: Record<string, string> = {
  nw: 'nw-resize', n: 'n-resize',  ne: 'ne-resize',
  e:  'e-resize',  se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',  body: 'move',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CropRotateModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const sourceImage  = useAppStore((s) => s.sourceImage);
  const settings     = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  // Local state (not committed until Apply)
  const [localCrop, setLocalCrop] = useState<CropRectNorm>(
    settings.cropRect ?? { x: 0, y: 0, w: 1, h: 1 }
  );
  const [localRotation, setLocalRotation] = useState<RotationAngle>(settings.rotation);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotatedRef   = useRef<HTMLCanvasElement | null>(null);
  const dragRef      = useRef<DragState | null>(null);

  // Stable refs that the draw callback reads so it never becomes stale
  const cropRef     = useRef<CropRectNorm>(localCrop);
  const rotationRef = useRef<RotationAngle>(localRotation);

  // ── Draw ──────────────────────────────────────────────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const rot    = rotatedRef.current;
    if (!canvas || !rot || canvas.width === 0 || canvas.height === 0) return;

    const ctx = canvas.getContext('2d')!;
    const CW = canvas.width, CH = canvas.height;
    ctx.clearRect(0, 0, CW, CH);

    // Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, CW, CH);

    const disp = getDisplayRect(CW, CH, rot.width, rot.height);
    ctx.drawImage(rot, disp.x, disp.y, disp.w, disp.h);

    // Crop rect in canvas px
    const crop = cropRef.current;
    const cx = disp.x + crop.x * disp.w;
    const cy = disp.y + crop.y * disp.h;
    const cw = crop.w * disp.w;
    const ch = crop.h * disp.h;

    // Dim areas outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(disp.x, disp.y,      disp.w,       cy - disp.y);               // top
    ctx.fillRect(disp.x, cy + ch,     disp.w,       disp.y + disp.h - cy - ch); // bottom
    ctx.fillRect(disp.x, cy,          cx - disp.x,  ch);                         // left
    ctx.fillRect(cx + cw, cy,         disp.x + disp.w - cx - cw, ch);            // right

    // Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(cx + cw * i / 3, cy); ctx.lineTo(cx + cw * i / 3, cy + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + ch * i / 3); ctx.lineTo(cx + cw, cy + ch * i / 3); ctx.stroke();
    }

    // Crop border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Corner L-marks
    const L = Math.min(20, cw * 0.2, ch * 0.2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    for (const [bx, by, lx, ly] of [
      [cx,      cy,      L, L], [cx + cw, cy,      -L,  L],
      [cx,      cy + ch, L,-L], [cx + cw, cy + ch, -L, -L],
    ] as [number, number, number, number][]) {
      ctx.beginPath();
      ctx.moveTo(bx + lx, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + ly);
      ctx.stroke();
    }

    // Drag handles
    const handles = getHandlePositions(cx, cy, cw, ch);
    ctx.lineWidth = 1;
    for (const k of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as DragHandle[]) {
      const [hx, hy] = handles[k];
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#333333';
      ctx.fillRect(hx - HANDLE_R, hy - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
      ctx.strokeRect(hx - HANDLE_R, hy - HANDLE_R, HANDLE_R * 2, HANDLE_R * 2);
    }
  }, []); // stable — reads from refs only

  // ── Rebuild rotated canvas when rotation changes ───────────────────────────

  useEffect(() => {
    if (!sourceImage) return;
    rotatedRef.current = buildRotatedCanvas(sourceImage, localRotation);
    rotationRef.current = localRotation;
    redraw();
  }, [sourceImage, localRotation, redraw]);

  // ── ResizeObserver keeps canvas resolution in sync with container ──────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width  = container.clientWidth;
        canvas.height = container.clientHeight;
      }
      redraw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  // ── Pointer helpers ───────────────────────────────────────────────────────

  function canvasPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const sx     = canvas.width  / rect.width;
    const sy     = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rot    = rotatedRef.current;
    if (!canvas || !rot) return;
    const { x: mx, y: my } = canvasPos(e);
    const disp    = getDisplayRect(canvas.width, canvas.height, rot.width, rot.height);
    const crop    = cropRef.current;
    const cx = disp.x + crop.x * disp.w, cy = disp.y + crop.y * disp.h;
    const cw = crop.w * disp.w,           ch = crop.h * disp.h;
    const handles = getHandlePositions(cx, cy, cw, ch);
    const hit = hitHandle(mx, my, handles)
      ?? (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch ? 'body' : null);
    if (!hit) return;
    canvas.setPointerCapture(e.pointerId);
    dragRef.current = { handle: hit, startX: mx, startY: my, cropAtStart: { ...crop }, disp };
    canvas.style.cursor = CURSORS[hit];
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rot    = rotatedRef.current;
    if (!canvas || !rot) return;
    const { x: mx, y: my } = canvasPos(e);

    if (!dragRef.current) {
      // Just update cursor
      const disp = getDisplayRect(canvas.width, canvas.height, rot.width, rot.height);
      const crop = cropRef.current;
      const cx = disp.x + crop.x * disp.w, cy = disp.y + crop.y * disp.h;
      const cw = crop.w * disp.w,           ch = crop.h * disp.h;
      const handles = getHandlePositions(cx, cy, cw, ch);
      const hit = hitHandle(mx, my, handles)
        ?? (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch ? 'body' : null);
      canvas.style.cursor = hit ? CURSORS[hit] : 'crosshair';
      return;
    }

    const { handle, startX, startY, cropAtStart, disp } = dragRef.current;
    const dx = (mx - startX) / disp.w;
    const dy = (my - startY) / disp.h;
    let { x, y, w, h } = cropAtStart;

    switch (handle) {
      case 'nw': x += dx; w -= dx; y += dy; h -= dy; break;
      case 'n' : y += dy; h -= dy; break;
      case 'ne': w += dx; y += dy; h -= dy; break;
      case 'e' : w += dx; break;
      case 'se': w += dx; h += dy; break;
      case 's' : h += dy; break;
      case 'sw': x += dx; w -= dx; h += dy; break;
      case 'w' : x += dx; w -= dx; break;
      case 'body': x += dx; y += dy; break;
    }

    // Clamp to [0,1] bounds with minimum crop size
    w = Math.max(MIN_CROP, w);
    h = Math.max(MIN_CROP, h);
    x = Math.max(0, Math.min(1 - w, x));
    y = Math.max(0, Math.min(1 - h, y));
    if (x + w > 1) w = 1 - x;
    if (y + h > 1) h = 1 - y;

    const newCrop = { x, y, w, h };
    cropRef.current = newCrop;
    setLocalCrop(newCrop); // keeps info panel in sync
    redraw();
  };

  const onPointerUp = () => {
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
  };

  // ── Rotation buttons ──────────────────────────────────────────────────────

  const handleRotate = (delta: 90 | -90 | 180) => {
    const next = (((localRotation + delta) % 360 + 360) % 360) as RotationAngle;
    setLocalRotation(next);
    // Reset crop when rotation changes (coordinate space changes)
    const fullFrame = { x: 0, y: 0, w: 1, h: 1 };
    cropRef.current = fullFrame;
    setLocalCrop(fullFrame);
  };

  // ── Apply / Reset ─────────────────────────────────────────────────────────

  const handleApply = () => {
    const isFullFrame = localCrop.x === 0 && localCrop.y === 0 &&
                        localCrop.w === 1 && localCrop.h === 1;
    updateSettings({
      cropRect:  isFullFrame ? null : localCrop,
      rotation:  localRotation,
    });
    onClose();
  };

  const handleReset = () => {
    const fullFrame = { x: 0, y: 0, w: 1, h: 1 };
    cropRef.current = fullFrame;
    setLocalCrop(fullFrame);
    setLocalRotation(0);
    redraw();
  };

  if (!sourceImage) return null;

  // ── Status label ──────────────────────────────────────────────────────────

  const isFullFrame = localCrop.x === 0 && localCrop.y === 0 &&
                      localCrop.w === 1 && localCrop.h === 1;
  const statusParts: string[] = [];
  if (!isFullFrame) statusParts.push(t('cropRotate.cropActive'));
  if (localRotation !== 0) statusParts.push(t('cropRotate.rotationActive', { angle: localRotation }));
  const statusLabel = statusParts.length ? statusParts.join(' · ') : t('cropRotate.noCropApplied');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
            ✂ {t('cropRotate.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('cropRotate.cancel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Canvas */}
          <div ref={containerRef} className="flex-1 min-h-0 min-w-0 bg-gray-900" style={{ minHeight: 300 }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>

          {/* Controls panel */}
          <div className="w-40 shrink-0 border-l border-gray-200 dark:border-gray-700 flex flex-col p-3 gap-3 overflow-y-auto">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Rotate
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleRotate(-90)}
                title={t('cropRotate.rotateLeft')}
                className="py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >↺</button>
              <button
                onClick={() => handleRotate(90)}
                title={t('cropRotate.rotateRight')}
                className="py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >↻</button>
              <button
                onClick={() => handleRotate(180)}
                title={t('cropRotate.rotate180')}
                className="col-span-2 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >{t('cropRotate.rotate180')}</button>
            </div>

            {localRotation !== 0 && (
              <p className="text-xs text-center text-blue-600 dark:text-blue-400 font-medium">
                {localRotation}°
              </p>
            )}

            <hr className="border-gray-200 dark:border-gray-700" />

            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Crop
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 font-mono">
              <div className="flex justify-between"><span>X</span><span>{(localCrop.x * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span>Y</span><span>{(localCrop.y * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span>W</span><span>{(localCrop.w * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span>H</span><span>{(localCrop.h * 100).toFixed(0)}%</span></div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              {t('cropRotate.dragHandles')}
            </p>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="px-5 py-2 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{statusLabel}</p>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={handleReset}
            className="text-sm px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ↺ {t('cropRotate.reset')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('cropRotate.cancel')}
            </button>
            <button
              onClick={handleApply}
              className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
            >
              {t('cropRotate.apply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
