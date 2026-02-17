import { useEffect } from 'react';
import { useAppStore } from '../../state/appStore';
import { ImageUploader } from '../upload/ImageUploader';
import { Sidebar } from './Sidebar';
import { ProcessingProgress } from '../progress/ProcessingProgress';
import { SideBySideView } from '../preview/SideBySideView';
import { PreprocessedImagePreview } from '../preview/PreprocessedImagePreview';

export function AppShell() {
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const sourceImageUrl = useAppStore((s) => s.sourceImageUrl);
  const result = useAppStore((s) => s.result);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const processedWidth = useAppStore((s) => s.processedWidth);
  const processedHeight = useAppStore((s) => s.processedHeight);
  const regionCount = result?.regions.length ?? 0;
  const hoveredRegion = useAppStore((s) => s.ui.hoveredRegion);
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const setMergeMode = useAppStore((s) => s.setMergeMode);

  // Keyboard shortcuts for merge/split modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (mergeMode === 'merge') {
          setMergeMode('browse');
        } else {
          setMergeMode('merge');
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (mergeMode === 'split') {
          setMergeMode('browse');
        } else {
          setMergeMode('split');
        }
      } else if (e.key === 'Escape') {
        setMergeMode('browse');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mergeMode, setMergeMode]);

  // Find hovered region info for tooltip
  let tooltipText = '';
  if (hoveredRegion !== null && result) {
    const label = result.labels.find((l) => l.regionId === hoveredRegion);
    if (label) {
      const [r, g, b] = result.palette[label.colorIndex];
      tooltipText = `Color #${label.colorIndex + 1} (${r}, ${g}, ${b})`;
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">Paint by Numbers</h1>
          {result && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {processedWidth}x{processedHeight} &middot; {regionCount} regions
            </span>
          )}
        </div>
        {tooltipText && (
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
            {tooltipText}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        <Sidebar />

        <main className="flex-1 flex flex-col min-h-0 p-4">
          {!sourceImageData && (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-lg w-full">
                <ImageUploader />
              </div>
            </div>
          )}

          {sourceImageData && pipelineStatus === 'idle' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <PreprocessedImagePreview />
                {sourceImageUrl && (
                  <img
                    src={sourceImageUrl}
                    alt="Uploaded"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md mx-auto mb-4"
                  />
                )}
                <p className="text-gray-500 text-sm">
                  Adjust settings on the left, then click "Generate Paint-by-Numbers"
                </p>
              </div>
            </div>
          )}

          {pipelineStatus === 'running' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-80">
                <ProcessingProgress />
              </div>
            </div>
          )}

          {pipelineStatus === 'error' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="font-medium">Processing failed</p>
                <p className="text-sm mt-1">{useAppStore.getState().pipeline.error}</p>
              </div>
            </div>
          )}

          {result && pipelineStatus === 'complete' && (
            <SideBySideView />
          )}
        </main>
      </div>
    </div>
  );
}
