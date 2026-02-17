import { useAppStore } from '../../state/appStore';
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
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
        {/* Empty sidebar on start - user can drop image or session to main area */}
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Quick Settings Section */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-4">
          Palette
        </h2>
        <PaletteControls />
      </div>

      {/* Advanced Settings - Collapsible */}
      <details className="border-b border-gray-200">
        <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide inline">
            ⚙ Advanced Settings
          </h2>
        </summary>
        <div className="px-4 pb-4 space-y-4 bg-gray-50">
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase">Image</h3>
            <PreprocessingControls />
          </div>
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase">Quality</h3>
            <DetailControls />
          </div>
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase">Output</h3>
            <RenderingControls />
          </div>
          <div className="pt-3 border-t border-gray-200">
            <ContourSmoothingControls />
          </div>
        </div>
      </details>

      {/* Generate Section */}
      <div className="p-4 border-b border-gray-200 bg-green-50">
        <button
          onClick={startPipeline}
          disabled={pipelineStatus === 'running'}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
            pipelineStatus === 'running'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
          }`}
        >
          {pipelineStatus === 'running' ? 'Processing...' : '✨ Generate'}
        </button>
        {pipelineError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{pipelineError}</p>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <>
          <details className="border-b border-gray-200">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide inline">
                ✏️ Edit
              </h2>
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                    canUndo
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Undo (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                    canRedo
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Redo (Ctrl+Y)"
                >
                  ↷ Redo
                </button>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Colors</h3>
                <PaletteLegend />
              </div>
            </div>
          </details>

          <details className="border-b border-gray-200">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide inline">
                🎯 Refine
              </h2>
            </summary>
            <div className="px-4 pb-4 bg-gray-50">
              <RegionMergeControls />
            </div>
          </details>

          <details className="border-b border-gray-200">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide inline">
                📊 Stats
              </h2>
            </summary>
            <div className="px-4 pb-4 bg-gray-50">
              <RegionStatistics />
            </div>
          </details>

          <details className="border-b border-gray-200">
            <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide inline">
                📤 Export & Save
              </h2>
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50">
              <SessionControls />
              <ExportButton />
            </div>
          </details>
        </>
      )}

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-gray-200">
        <button
          onClick={reset}
          className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
        >
          ↺ Upload New Image
        </button>
      </div>
    </div>
  );
}
