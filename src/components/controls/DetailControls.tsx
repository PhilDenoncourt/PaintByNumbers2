import { useAppStore } from '../../state/appStore';

export function DetailControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>Detail Level</span>
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
