import { useAppStore } from '../../state/appStore';
import type { PipelineStage } from '../../state/types';

const stageLabels: Record<PipelineStage, string> = {
  quantize: 'Quantizing colors',
  segment: 'Finding regions',
  merge: 'Merging small regions',
  contour: 'Tracing outlines',
  label: 'Placing labels',
};

const stageOrder: PipelineStage[] = ['quantize', 'segment', 'merge', 'contour', 'label'];

export function ProcessingProgress() {
  const pipeline = useAppStore((s) => s.pipeline);

  if (pipeline.status !== 'running') return null;

  const currentIdx = pipeline.currentStage
    ? stageOrder.indexOf(pipeline.currentStage)
    : -1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Processing...</h3>
      <div className="space-y-3">
        {stageOrder.map((stage, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={stage} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isComplete ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    isCurrent ? 'text-gray-800 font-medium' : isPending ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {stageLabels[stage]}
                </div>
                {isCurrent && (
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${pipeline.stageProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
