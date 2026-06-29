import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import type { ViewMode } from '../../state/types';
import { SideBySideView } from '../preview/SideBySideView';
import { LegendBar } from './LegendBar';
import { PaintMode } from '../paint/PaintMode';

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 10;

export function CanvasArea() {
  const { t } = useTranslation();
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const zoom = useAppStore((s) => s.ui.zoom);
  const panX = useAppStore((s) => s.ui.panX);
  const panY = useAppStore((s) => s.ui.panY);
  const setZoomPan = useAppStore((s) => s.setZoomPan);
  const [paintModeOpen, setPaintModeOpen] = useState(false);

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

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 sm:px-[18px] sm:py-4">
      {/* View toolbar */}
      <div className="flex items-center justify-between gap-2 mb-[14px] shrink-0">
        <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-[11px] border border-gray-200 dark:border-gray-700">
          {views.map((v) => {
            const active = viewMode === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3.5 py-[7px] rounded-[8px] text-[12.5px] font-semibold transition-all ${
                  active
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-transparent text-[#64748b] dark:text-gray-400 hover:text-[#334155] dark:hover:text-gray-200'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaintModeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-[7px] rounded-[9px] text-[12.5px] font-semibold bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors"
          >
            🖌️ {t('paintMode.title')}
          </button>
          <button
            onClick={() => setZoom(1 / 1.1)}
            className="w-[34px] h-[34px] rounded-[9px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#475569] dark:text-gray-300 text-[15px] hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label={t('panels.canvas.zoomOut')}
          >
            −
          </button>
          <span className="text-xs font-semibold text-[#64748b] dark:text-gray-400 min-w-[40px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(1.1)}
            className="w-[34px] h-[34px] rounded-[9px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#475569] dark:text-gray-300 text-[15px] hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label={t('panels.canvas.zoomIn')}
          >
            +
          </button>
        </div>
      </div>

      {/* Preview + legend */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[14px] overflow-hidden">
          <SideBySideView showToolbar={false} showLegend={false} />
        </div>
        <LegendBar />
      </div>

      {paintModeOpen && <PaintMode onClose={() => setPaintModeOpen(false)} />}
    </div>
  );
}
