import { useAppStore } from '../../state/appStore';

const DIFFICULTY_PRESETS = {
  simple: { detailLevel: 0, minRegionSize: 510 },
  medium: { detailLevel: 50, minRegionSize: 135 },
  complex: { detailLevel: 100, minRegionSize: 10 },
};

export function DetailControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  // Determine current difficulty level based on detail/minRegionSize
  const getCurrentDifficulty = () => {
    const { detailLevel } = settings;
    if (detailLevel <= 15) return 'simple';
    if (detailLevel >= 85) return 'complex';
    return 'medium';
  };

  const currentDifficulty = getCurrentDifficulty();

  const applyDifficultyPreset = (preset: keyof typeof DIFFICULTY_PRESETS) => {
    const { detailLevel, minRegionSize } = DIFFICULTY_PRESETS[preset];
    updateSettings({ detailLevel, minRegionSize });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Difficulty Level
        </label>
        <div className="flex gap-2">
          {(['simple', 'medium', 'complex'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => applyDifficultyPreset(preset)}
              disabled={disabled}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                currentDifficulty === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>Detail Level (Fine Tune)</span>
          <span className="text-gray-500 font-mono">{settings.detailLevel}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.detailLevel}
          onChange={(e) => {
            const detail = Number(e.target.value);
            // Quadratic mapping: low detail = large min region, high detail = small min region
            const t = 1 - detail / 100;
            const minRegionSize = Math.round(10 + t * t * 500);
            updateSettings({ detailLevel: detail, minRegionSize });
          }}
          disabled={disabled}
          className="w-full mt-1 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Simple</span>
          <span>Detailed</span>
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>Line Smoothing</span>
          <span className="text-gray-500 font-mono">{settings.simplificationEpsilon.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.5}
          value={settings.simplificationEpsilon}
          onChange={(e) => updateSettings({ simplificationEpsilon: Number(e.target.value) })}
          disabled={disabled}
          className="w-full mt-1 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Sharp</span>
          <span>Smooth</span>
        </div>
      </div>
    </div>
  );
}
