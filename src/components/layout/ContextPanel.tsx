import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import type { ActivePanel } from '../../state/types';
import { PalettePanel } from '../panels/PalettePanel';
import { AdjustPanel } from '../panels/AdjustPanel';
import { RefinePanel } from '../panels/RefinePanel';
import { ExportPanel } from '../panels/ExportPanel';

const PANEL_STEP: Record<ActivePanel, number> = {
  palette: 1,
  adjust: 2,
  refine: 3,
  export: 4,
};

export function ContextPanel({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const activePanel = useAppStore((s) => s.ui.activePanel);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const pipelineError = useAppStore((s) => s.pipeline.error);
  const startPipeline = useAppStore((s) => s.startPipeline);

  const running = pipelineStatus === 'running';
  const step = PANEL_STEP[activePanel];

  return (
    <section className="w-[312px] max-w-[85vw] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 min-h-0 h-full">
      {/* Panel header */}
      <div className="px-[18px] pt-[18px] pb-[14px] border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-[#2563eb] dark:text-blue-300 uppercase tracking-[0.07em] mb-[3px]">
            {t('panels.step', { n: step })}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('sidebar.closeSidebar')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <h2 className="text-[18px] font-bold text-[#0f172a] dark:text-gray-100 mb-[3px] -tracking-[0.01em]">
          {t(`panels.${activePanel}.title`)}
        </h2>
        <p className="text-[12.5px] text-[#64748b] dark:text-gray-400 leading-[1.45]">
          {t(`panels.${activePanel}.desc`)}
        </p>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-[18px] min-h-0">
        {activePanel === 'palette' && <PalettePanel />}
        {activePanel === 'adjust' && <AdjustPanel />}
        {activePanel === 'refine' && <RefinePanel />}
        {activePanel === 'export' && <ExportPanel />}
      </div>

      {/* Sticky generate footer */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-700 px-[18px] py-[14px] bg-white dark:bg-gray-800">
        <button
          onClick={startPipeline}
          disabled={running}
          className={`flex items-center justify-center gap-2 w-full py-[13px] rounded-[11px] text-sm font-bold transition-colors ${
            running
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-[#16a34a] text-white hover:bg-green-700 shadow-[0_4px_12px_rgba(22,163,74,0.25)]'
          }`}
        >
          {running ? t('sidebar.stop') : `✨ ${t('panels.generate')}`}
        </button>
        {pipelineError ? (
          <p className="mt-2 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded text-center">
            {pipelineError}
          </p>
        ) : (
          <p className="text-[11px] text-[#94a3b8] dark:text-gray-500 text-center mt-2">
            {t('panels.generateCaption')}
          </p>
        )}
      </div>
    </section>
  );
}
