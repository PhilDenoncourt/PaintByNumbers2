import { useAppStore } from '../../state/appStore';

export function PreprocessingControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  const handleReset = () => {
    updateSettings({
      brightness: 0,
      contrast: 0,
      saturation: 0,
    });
  };

  const hasAdjustments = settings.brightness !== 0 || settings.contrast !== 0 || settings.saturation !== 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Image Preprocessing</h3>
        {hasAdjustments && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        )}
      </div>

      {/* Brightness Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">Brightness</label>
          <span className="text-xs font-mono text-gray-500">{settings.brightness > 0 ? '+' : ''}{settings.brightness}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          value={settings.brightness}
          onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Darker</span>
          <span>Lighter</span>
        </div>
      </div>

      {/* Contrast Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">Contrast</label>
          <span className="text-xs font-mono text-gray-500">{settings.contrast > 0 ? '+' : ''}{settings.contrast}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          value={settings.contrast}
          onChange={(e) => updateSettings({ contrast: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Lower</span>
          <span>Higher</span>
        </div>
      </div>

      {/* Saturation Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">Saturation</label>
          <span className="text-xs font-mono text-gray-500">{settings.saturation > 0 ? '+' : ''}{settings.saturation}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          value={settings.saturation}
          onChange={(e) => updateSettings({ saturation: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Desaturated</span>
          <span>Saturated</span>
        </div>
      </div>
    </div>
  );
}
