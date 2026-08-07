import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { useRenderLabels } from '../../state/useRenderLabels';

/**
 * PROTOTYPE — Interactive "Paint Mode" companion.
 *
 * A full-screen guided painting view: pick a color, tap regions to mark them
 * painted, and track progress. Reuses the existing pipeline result
 * (contours / labels / palette / labelMap) — no new algorithms.
 *
 * Self-contained on purpose: all paint-mode state lives here (not the store),
 * so it can be iterated on or removed without touching app state. Strings are
 * hardcoded English; move to i18n before shipping. Painted progress is lost on
 * close — wire into the store / sessionStorage when promoting past prototype.
 */

interface PaintModeProps {
  onClose: () => void;
}

interface View {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 40;
const TAP_THRESHOLD_PX = 6;

function textColorFor(r: number, g: number, b: number): string {
  // Perceived luminance — pick black or white text for contrast.
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#000' : '#fff';
}

export function PaintMode({ onClose }: PaintModeProps) {
  const { t } = useTranslation();
  const result = useAppStore((s) => s.result);
  const renderLabels = useRenderLabels();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ scale: 1, offsetX: 0, offsetY: 0 });
  const drawRef = useRef<() => void>(() => {});
  const drag = useRef({ down: false, moved: 0, lastX: 0, lastY: 0 });

  const [painted, setPainted] = useState<Set<number>>(() => new Set());
  const [activeColor, setActiveColor] = useState<number | null>(null);

  // regionId -> colorIndex, for O(1) lookups on tap.
  const regionColor = useMemo(() => {
    const m = new Map<number, number>();
    if (result) for (const reg of result.regions) m.set(reg.id, reg.colorIndex);
    return m;
  }, [result]);

  // Total regions per color (the denominators in the legend).
  const colorTotals = useMemo(() => {
    const m = new Map<number, number>();
    if (result) for (const reg of result.regions) m.set(reg.colorIndex, (m.get(reg.colorIndex) ?? 0) + 1);
    return m;
  }, [result]);

  // Painted regions per color (recomputed each render — cheap relative to draw).
  const paintedPerColor = useMemo(() => {
    const m = new Map<number, number>();
    for (const id of painted) {
      const ci = regionColor.get(id);
      if (ci !== undefined) m.set(ci, (m.get(ci) ?? 0) + 1);
    }
    return m;
  }, [painted, regionColor]);

  const totalRegions = result?.regions.length ?? 0;
  const isComplete = totalRegions > 0 && painted.size === totalRegions;

  // ---- Rendering -----------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { scale, offsetX, offsetY } = viewRef.current;
    const { palette, contours, width, height } = result;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e2e8f0'; // slate backdrop around the "paper"
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    for (const contour of contours) {
      const { outerRing, holes, colorIndex, regionId } = contour;
      if (outerRing.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(outerRing[0].x, outerRing[0].y);
      for (let i = 1; i < outerRing.length; i++) ctx.lineTo(outerRing[i].x, outerRing[i].y);
      ctx.closePath();
      for (const hole of holes) {
        if (hole.length < 3) continue;
        ctx.moveTo(hole[0].x, hole[0].y);
        for (let i = 1; i < hole.length; i++) ctx.lineTo(hole[i].x, hole[i].y);
        ctx.closePath();
      }

      const [r, g, b] = palette[colorIndex];
      const isPainted = painted.has(regionId);
      const isActive = activeColor !== null && colorIndex === activeColor;

      if (isPainted) {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else if (isActive) {
        // Tint the region with its real paint color so the user sees what to grab.
        ctx.fillStyle = `rgba(${r},${g},${b},0.30)`;
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fill('evenodd');

      // Outline — constant on-screen width regardless of zoom.
      if (isActive && !isPainted) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5 / scale;
      } else {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.6 / scale;
      }
      ctx.stroke();
    }

    // Numbers — only on unpainted regions (painted ones show clean color).
    for (const label of renderLabels) {
      if (painted.has(label.regionId)) continue;
      const isActive = activeColor !== null && label.colorIndex === activeColor;
      ctx.font = `${isActive ? 'bold ' : ''}${label.fontSize}px ${label.font.css}`;
      ctx.fillStyle = isActive ? '#1d4ed8' : '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(label.colorIndex + 1), label.x, label.y);
    }
  }, [result, painted, activeColor, renderLabels]);

  // Fit the image to the canvas and size the backing store to the container.
  const fitToContainer = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !result) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const scale = Math.min(canvas.width / result.width, canvas.height / result.height) * 0.95;
    viewRef.current = {
      scale,
      offsetX: (canvas.width - result.width * scale) / 2,
      offsetY: (canvas.height - result.height * scale) / 2,
    };
    draw();
  }, [result, draw]);

  // Keep the latest draw fn reachable from event handlers, and redraw whenever
  // paint state / active color changes.
  useEffect(() => {
    drawRef.current = draw;
    draw();
  }, [draw]);

  // Initial fit + keep fitting backing store on resize (preserves current view scale).
  useEffect(() => {
    fitToContainer();
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawRef.current();
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fitToContainer]);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Non-passive wheel zoom (centered on cursor).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v.scale * factor));
      const k = newScale / v.scale;
      // Keep the image point under the cursor stationary.
      viewRef.current = {
        scale: newScale,
        offsetX: cx - (cx - v.offsetX) * k,
        offsetY: cy - (cy - v.offsetY) * k,
      };
      drawRef.current();
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // ---- Hit testing / interaction ------------------------------------------

  const regionAt = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas || !result) return null;
      const rect = canvas.getBoundingClientRect();
      const { scale, offsetX, offsetY } = viewRef.current;
      const ix = Math.floor((clientX - rect.left - offsetX) / scale);
      const iy = Math.floor((clientY - rect.top - offsetY) / scale);
      if (ix < 0 || iy < 0 || ix >= result.width || iy >= result.height) return null;
      const id = result.labelMap[iy * result.width + ix];
      return id >= 0 ? id : null;
    },
    [result],
  );

  const paintRegion = useCallback(
    (regionId: number) => {
      const ci = regionColor.get(regionId);
      if (ci === undefined) return;
      setPainted((prev) => {
        const next = new Set(prev);
        if (next.has(regionId)) next.delete(regionId);
        else next.add(regionId);
        return next;
      });
      setActiveColor(ci); // following the user's lead keeps the highlight on the color they're working
    },
    [regionColor],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { down: true, moved: 0, lastX: e.clientX, lastY: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.moved += Math.hypot(dx, dy);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    viewRef.current.offsetX += dx;
    viewRef.current.offsetY += dy;
    drawRef.current();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    d.down = false;
    if (d.moved < TAP_THRESHOLD_PX) {
      const id = regionAt(e.clientX, e.clientY);
      if (id !== null) paintRegion(id);
    }
  };

  // Demo convenience: fill (or clear) every region of the active color at once.
  const fillActiveColor = () => {
    if (activeColor === null || !result) return;
    setPainted((prev) => {
      const next = new Set(prev);
      const ids = result.regions.filter((r) => r.colorIndex === activeColor).map((r) => r.id);
      const allDone = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allDone) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  if (!result) return null;

  const progressPct = totalRegions ? Math.round((painted.size / totalRegions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-slate-100">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-slate-700 bg-slate-800">
        <span className="text-sm font-bold tracking-tight">🖌️ {t('paintMode.title')}</span>
        <div className="flex-1 flex items-center gap-3 max-w-md">
          <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-300 w-28 shrink-0">
            {t('paintMode.progress', { painted: painted.size, total: totalRegions, pct: progressPct })}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          {t('paintMode.exit')}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 min-h-0 min-w-0 relative">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="absolute inset-0 touch-none cursor-crosshair"
            style={{ width: '100%', height: '100%' }}
          />
          {isComplete && (
            <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-bold shadow-lg">
                {t('paintMode.finished')}
              </div>
            </div>
          )}
        </div>

        {/* Color legend / palette */}
        <div className="shrink-0 md:w-72 border-t md:border-t-0 md:border-l border-slate-700 bg-slate-800 flex flex-col">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center justify-between">
            <span>{t('paintMode.colors')}</span>
            {activeColor !== null && (
              <button
                onClick={fillActiveColor}
                className="text-[11px] font-semibold text-blue-300 hover:text-blue-200"
              >
                {t('paintMode.toggleAll', { number: activeColor + 1 })}
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex md:flex-col gap-1 px-2 pb-2">
            {result.palette.map(([r, g, b], idx) => {
              const total = colorTotals.get(idx) ?? 0;
              if (total === 0) return null;
              const done = paintedPerColor.get(idx) ?? 0;
              const complete = done === total;
              const isActive = activeColor === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveColor(isActive ? null : idx)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg shrink-0 transition-all text-left ${
                    isActive ? 'bg-blue-500/25 ring-2 ring-blue-400' : 'bg-slate-700/50 hover:bg-slate-700'
                  } ${complete ? 'opacity-50' : ''}`}
                >
                  <span
                    className="w-7 h-7 rounded-md border border-slate-500 shrink-0 grid place-items-center text-[11px] font-bold"
                    style={{ backgroundColor: `rgb(${r},${g},${b})`, color: textColorFor(r, g, b) }}
                  >
                    {idx + 1}
                  </span>
                  <span className="hidden md:flex flex-1 flex-col">
                    <span className="text-xs font-semibold tabular-nums text-slate-200">
                      {t('paintMode.colorProgress', { done, total })}
                    </span>
                    <span className="h-1 mt-1 rounded-full bg-slate-600 overflow-hidden">
                      <span
                        className="block h-full bg-green-500"
                        style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
                      />
                    </span>
                  </span>
                  {complete && <span className="hidden md:inline text-green-400 text-sm">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 border-t border-slate-700 text-[11px] leading-relaxed text-slate-400">
            {t('paintMode.instructions')}
          </div>
        </div>
      </div>
    </div>
  );
}
