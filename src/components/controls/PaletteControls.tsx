import { useAppStore } from '../../state/appStore';
import { crayolaPalettes } from '../../data/crayolaPalettes';
import { CustomPaletteControls } from './CustomPaletteControls';

export function PaletteControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  const isPreset = settings.presetPaletteId !== null;
  const isCustomSelected = settings.customPalette !== null;

  let paletteMode: 'auto' | 'preset' | 'custom' = 'auto';
  if (isPreset) paletteMode = 'preset';
  if (isCustomSelected) paletteMode = 'custom';

  return (
    <div className="space-y-3">
      {/* Palette mode selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Palette Mode</label>
        <select
          value={paletteMode}
          onChange={(e) => {
            if (e.target.value === 'auto') {
              updateSettings({ presetPaletteId: null, customPalette: null });
            } else if (e.target.value === 'preset') {
              updateSettings({ presetPaletteId: `crayola-${crayolaPalettes[0].size}`, customPalette: null });
            } else if (e.target.value === 'custom') {
              updateSettings({ presetPaletteId: null, customPalette: [] });
            }
          }}
          disabled={disabled}
          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        >
          <option value="auto">Auto-detect</option>
          <option value="preset">Crayola Preset</option>
          <option value="custom">Custom Palette</option>
        </select>
      </div>

      {/* Preset palette selector */}
      {isPreset && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crayon Set</label>
          <select
            value={settings.presetPaletteId ?? ''}
            onChange={(e) => updateSettings({ presetPaletteId: e.target.value })}
            disabled={disabled}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
          >
            {crayolaPalettes.map((p) => (
              <option key={p.size} value={`crayola-${p.size}`}>
                {p.label} ({p.size} colors)
              </option>
            ))}
          </select>

          {/* Color preview swatches */}
          {(() => {
            const selected = crayolaPalettes.find(
              (p) => `crayola-${p.size}` === settings.presetPaletteId
            );
            if (!selected) return null;
            return (
              <div className="mt-2 flex flex-wrap gap-1">
                {selected.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm border border-gray-300"
                    style={{ backgroundColor: `rgb(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})` }}
                    title={c.name}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Custom palette controls */}
      {isCustomSelected && <CustomPaletteControls />}

      {/* Palette size slider (only for auto mode) */}
      {!isPreset && !isCustomSelected && (
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
      )}
    </div>
  );
}
