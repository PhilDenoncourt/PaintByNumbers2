import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { PaletteControls } from '../controls/PaletteControls';
import { DetailControls } from '../controls/DetailControls';
import { PreprocessingControls } from '../controls/PreprocessingControls';
import { RenderingControls } from '../controls/RenderingControls';
import { ContourSmoothingControls } from '../controls/ContourSmoothingControls';
import { RegionMergeControls } from '../controls/RegionMergeControls';
import { ExportButton } from '../controls/ExportButton';
import { SessionControls } from '../controls/SessionControls';
import { PaletteLegend } from '../palette/PaletteLegend';
import { RegionStatistics } from '../statistics/RegionStatistics';

export function Sidebar() {
  const { t } = useTranslation();
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const result = useAppStore((s) => s.result);
  const startPipeline = useAppStore((s) => s.startPipeline);
  const reset = useAppStore((s) => s.reset);
  const pipelineError = useAppStore((s) => s.pipeline.error);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const historyIndex = useAppStore((s) => s.historyIndex);
  const history = useAppStore((s) => s.history);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Show minimal sidebar even without image - removed session controls from initial screen
  if (!sourceImageData) {
    return (
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto">
        {/* Empty sidebar on start - user can drop image or session to main area */}
      </div>
    );
  }

  return (
    <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto">
      {/* Quick Settings Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-4">
          {t('sidebar.palette')}
        </h2>
        <PaletteControls />
      </div>

      {/* Advanced Settings - Collapsible */}
      <details className="border-b border-gray-200 dark:border-gray-700">
        <summary className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide inline">
            ⚙ {t('sidebar.advancedSettings')}
          </h2>
        </summary>
        <div className="px-4 pb-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">{t('sidebar.image')}</h3>
            <PreprocessingControls />
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">{t('sidebar.quality')}</h3>
            <DetailControls />
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">{t('sidebar.output')}</h3>
            <RenderingControls />
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <ContourSmoothingControls />
          </div>
        </div>
      </details>

      {/* Generate Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-950/30">
        <button
          onClick={startPipeline}
          disabled={pipelineStatus === 'running'}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
            pipelineStatus === 'running'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
          }`}
        >
          {pipelineStatus === 'running' ? t('sidebar.stop') : `✨ ${t('sidebar.generate')}`}
        </button>
        {pipelineError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">{pipelineError}</p>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <>
          <details className="border-b border-gray-200 dark:border-gray-700">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide inline">
                ✏️ {t('sidebar.edit')}
              </h2>
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                    canUndo
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Undo (Ctrl+Z)"
                >
                  ↶ {t('sidebar.undo')}
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                    canRedo
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Redo (Ctrl+Y)"
                >
                  ↷ {t('sidebar.redo')}
                </button>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">{t('palette.legend')}</h3>
                <PaletteLegend />
              </div>
            </div>
          </details>

          <details className="border-b border-gray-200 dark:border-gray-700">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide inline">
                🎯 {t('controls.regionMerging')}
              </h2>
            </summary>
            <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900/50">
              <RegionMergeControls />
            </div>
          </details>

          <details className="border-b border-gray-200 dark:border-gray-700">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide inline">
                📊 {t('statistics.title')}
              </h2>
            </summary>
            <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900/50">
              <RegionStatistics />
            </div>
          </details>

          <details className="border-b border-gray-200 dark:border-gray-700">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide inline">
                📤 {t('sidebar.exportSave')}
              </h2>
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
              <SessionControls />
              <ExportButton />
            </div>
          </details>
        </>
      )}

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={reset}
          className="w-full py-2 px-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
        >
          ↺ {t('sidebar.uploadNewImage')}
        </button>
      </div>
    </div>
  );
}
