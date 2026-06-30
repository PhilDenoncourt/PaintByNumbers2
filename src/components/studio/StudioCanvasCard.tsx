import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import type { ViewMode } from '../../state/types';
import { SideBySideView } from '../preview/SideBySideView';
import { PaintMode } from '../paint/PaintMode';
import { RevealOverlay } from './RevealOverlay';
import { useStudioTokens, AMAZON_YELLOW } from './studioTokens';

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10;

/**
 * The big rounded canvas card (Open Studio): a view toggle + Replay pill over a
 * soft inner "well" holding the template, with the signature paint-in reveal.
 */
export function StudioCanvasCard() {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const result = useAppStore((s) => s.result);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const setZoomPan = useAppStore((s) => s.setZoomPan);
  const [paintModeOpen, setPaintModeOpen] = useState(false);

  // (Re)play the reveal on Replay and whenever a fresh result arrives. Bumping
  // `runId` remounts the overlay (key change) so its CSS animation restarts. A
  // new result is detected by comparing against the previous one during render —
  // the React-endorsed "adjust state when a prop changes" pattern (no effect).
  const [runId, setRunId] = useState(0);
  const [prevResult, setPrevResult] = useState(result);
  if (result !== prevResult) {
    setPrevResult(result);
    setRunId((n) => n + 1);
  }

  const views: { id: ViewMode; label: string }[] = [
    { id: 'colored', label: t('preview.colored') },
    { id: 'print', label: t('preview.print') },
    { id: 'sidebyside', label: t('preview.sideBySide') },
    { id: 'overlay', label: t('preview.overlay') },
  ];

  const setZoom = (factor: number) => {
    const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor));
    setZoomPan(next, panX, panY);
  };

  const showReveal = !!result && viewMode === 'colored';

  return (
    <div
      className="rounded-[24px] p-4 sm:p-6 flex flex-col min-h-0"
      style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, boxShadow: tk.dropShadow }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-full" style={{ background: tk.track }}>
          {views.map((v) => {
            const active = viewMode === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className="px-[13px] py-[6px] rounded-full font-display text-[12px] font-semibold transition-colors"
                style={active ? { background: AMAZON_YELLOW, color: tk.activeFg } : { color: tk.muted }}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaintModeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-full font-display text-[12px] font-semibold transition-opacity hover:opacity-85"
            style={{ background: tk.dotIdleBg, color: tk.text }}
          >
            🖌️ {t('paintMode.title')}
          </button>
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setZoom(1 / 1.1)}
              className="w-[30px] h-[30px] rounded-full text-[15px] leading-none transition-opacity hover:opacity-80"
              style={{ background: tk.dotIdleBg, color: tk.text }}
              aria-label={t('panels.canvas.zoomOut')}
            >
              −
            </button>
            <span className="text-[11px] font-semibold min-w-[38px] text-center tabular-nums" style={{ color: tk.muted }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(1.1)}
              className="w-[30px] h-[30px] rounded-full text-[15px] leading-none transition-opacity hover:opacity-80"
              style={{ background: tk.dotIdleBg, color: tk.text }}
              aria-label={t('panels.canvas.zoomIn')}
            >
              +
            </button>
          </div>
          <button
            onClick={() => setRunId((n) => n + 1)}
            className="flex items-center gap-1.5 px-[15px] py-[8px] rounded-full font-display text-[12px] font-bold transition-opacity hover:opacity-85"
            style={{ background: tk.replayBg, color: tk.replayFg }}
          >
            ↻ {t('studio.replay', { defaultValue: 'Replay reveal' })}
          </button>
        </div>
      </div>

      {/* Inner well */}
      <div
        className="flex-1 min-h-0 rounded-[18px] overflow-hidden relative flex"
        style={{ background: tk.canvasWell, border: `1px solid ${tk.border}` }}
      >
        <div className="flex-1 min-h-0 relative">
          <SideBySideView showToolbar={false} showLegend={false} />
          {showReveal && result && (
            <RevealOverlay result={result} tokens={tk} runId={runId} />
          )}
        </div>
      </div>

      {paintModeOpen && <PaintMode onClose={() => setPaintModeOpen(false)} />}
    </div>
  );
}
