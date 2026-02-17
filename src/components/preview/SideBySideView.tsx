import { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { ZoomPanContainer } from './ZoomPanContainer';
import { CanvasPreview } from './CanvasPreview';
import { RegionHoverOverlay } from './RegionHoverOverlay';

export function SideBySideView() {
  const sourceImageUrl = useAppStore((s) => s.sourceImageUrl);
  const result = useAppStore((s) => s.result);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  if (!result) return null;

  if (viewMode === 'sidebyside') {
    return (
      <div className="flex flex-col h-full">
        <ViewModeBar viewMode={viewMode} setViewMode={setViewMode} />
        <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
          <div className="overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            {sourceImageUrl && (
              <img
                src={sourceImageUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          <div className="relative overflow-hidden rounded-lg">
            <ZoomPanContainer>
              <CanvasPreview />
            </ZoomPanContainer>
            <RegionHoverOverlay />
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'overlay') {
    return (
      <div className="flex flex-col h-full">
        <ViewModeBar viewMode={viewMode} setViewMode={setViewMode} />
        <div className="px-4 pb-2 flex items-center gap-3">
          <span className="text-xs text-gray-500">Original</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-xs text-gray-500">PBN</span>
        </div>
        <div className="flex-1 relative min-h-0 overflow-hidden rounded-lg">
          {sourceImageUrl && (
            <img
              src={sourceImageUrl}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: 1 - overlayOpacity }}
            />
          )}
          <div className="absolute inset-0" style={{ opacity: overlayOpacity }}>
            <ZoomPanContainer>
              <CanvasPreview />
            </ZoomPanContainer>
          </div>
          <RegionHoverOverlay />
        </div>
      </div>
    );
  }

  // Default: colored or print mode
  return (
    <div className="flex flex-col h-full">
      <ViewModeBar viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex-1 relative min-h-0">
        <ZoomPanContainer>
          <CanvasPreview />
        </ZoomPanContainer>
        <RegionHoverOverlay />
      </div>
    </div>
  );
}

function ViewModeBar({
  viewMode,
  setViewMode,
}: {
  viewMode: string;
  setViewMode: (mode: 'colored' | 'print' | 'sidebyside' | 'overlay') => void;
}) {
  const modes = [
    { key: 'colored' as const, label: 'Colored' },
    { key: 'print' as const, label: 'Print' },
    { key: 'sidebyside' as const, label: 'Side by Side' },
    { key: 'overlay' as const, label: 'Overlay' },
  ];

  return (
    <div className="flex gap-1 p-2">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => setViewMode(m.key)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            viewMode === m.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
