import { useAppStore } from '../../state/appStore';

export function PaletteControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
          <span>Palette Size</span>
          <span className="text-gray-500 font-mono">{settings.paletteSize}</span>
        </label>
        <input
          type="range"
          min={3}
          max={30}
          value={settings.paletteSize}
          onChange={(e) => updateSettings({ paletteSize: Number(e.target.value) })}
          disabled={disabled}
          className="w-full mt-1 accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>3</span>
          <span>30</span>
        </div>
      </div>
    </div>
  );
}
