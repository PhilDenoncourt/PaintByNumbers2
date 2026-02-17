import { useAppStore } from '../../state/appStore';
import { PaletteControls } from '../controls/PaletteControls';
import { DetailControls } from '../controls/DetailControls';
import { ExportButton } from '../controls/ExportButton';
import { PaletteLegend } from '../palette/PaletteLegend';

export function Sidebar() {
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const result = useAppStore((s) => s.result);
  const startPipeline = useAppStore((s) => s.startPipeline);
  const reset = useAppStore((s) => s.reset);
  const pipelineError = useAppStore((s) => s.pipeline.error);

  if (!sourceImageData) return null;

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Settings</h2>
        <PaletteControls />
        <div className="mt-4">
          <DetailControls />
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
          <PaletteLegend />
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
