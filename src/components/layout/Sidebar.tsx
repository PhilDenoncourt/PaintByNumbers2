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

  // Show minimal sidebar with session controls even without image
  if (!sourceImageData) {
    return (
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Session</h2>
          <SessionControls />
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Settings</h2>
        <PaletteControls />
        <div className="mt-4 pt-4 border-t border-gray-200">
          <PreprocessingControls />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <DetailControls />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <RenderingControls />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ContourSmoothingControls />
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button
          onClick={startPipeline}
          disabled={pipelineStatus === 'running'}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
            pipelineStatus === 'running'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {pipelineStatus === 'running' ? 'Processing...' : 'Generate Paint-by-Numbers'}
        </button>
        {pipelineError && (
          <p className="mt-2 text-xs text-red-600">{pipelineError}</p>
        )}
      </div>

      {result && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 mb-3">
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
          <PaletteLegend />
        </div>
      )}

      {result && (
        <div className="border-b border-gray-200">
          <RegionMergeControls />
        </div>
      )}

      {result && <RegionStatistics />}

      {result && (
        <div className="p-4 border-b border-gray-200">
          <SessionControls />
        </div>
      )}

      {result && (
        <div className="p-4 border-b border-gray-200">
          <ExportButton />
        </div>
      )}

      <div className="p-4 mt-auto">
        <button
          onClick={reset}
          className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Upload New Image
        </button>
      </div>
    </div>
  );
}
