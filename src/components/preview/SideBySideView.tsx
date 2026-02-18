import { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { ZoomPanContainer } from './ZoomPanContainer';
import { CanvasPreview } from './CanvasPreview';
import { RegionHoverOverlay } from './RegionHoverOverlay';

export function SideBySideView() {
  const { t } = useTranslation();
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
        <div className="px-4 pb-3 space-y-2 bg-white border-b border-gray-200">
          <div className="text-xs font-medium text-gray-700">{t('preview.beforeAfterSlider')}</div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium min-w-12">{t('preview.before')}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                WebkitAppearance: 'slider-horizontal',
              }}
              aria-label="Before/After slider"
            />
            <span className="text-xs text-gray-500 font-medium min-w-12 text-right">{t('preview.after')}</span>
          </div>
          <div className="text-xs text-gray-400">{t('preview.dragToCompare')}</div>
        </div>
        <div className="flex-1 relative min-h-0 overflow-hidden rounded-lg bg-gray-100">
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
  const { t } = useTranslation();
  const modes = [
    { key: 'colored' as const, label: t('preview.colored') },
    { key: 'print' as const, label: t('preview.print') },
    { key: 'sidebyside' as const, label: t('preview.sideBySide') },
    { key: 'overlay' as const, label: t('preview.overlay') },
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
