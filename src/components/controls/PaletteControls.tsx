import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { allPresetPalettes, presetBrands, palettesForBrand, findPresetPalette } from '../../data/paletteRegistry';
import { CustomPaletteControls } from './CustomPaletteControls';

export function PaletteControls() {
  const { t } = useTranslation();
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
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('controls.paletteModeLabel')}</label>
        <select
          value={paletteMode}
          onChange={(e) => {
            if (e.target.value === 'auto') {
              updateSettings({ presetPaletteId: null, customPalette: null });
            } else if (e.target.value === 'preset') {
              updateSettings({ presetPaletteId: allPresetPalettes[0].id, customPalette: null });
            } else if (e.target.value === 'custom') {
              updateSettings({ presetPaletteId: null, customPalette: [] });
            }
          }}
          disabled={disabled}
          className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        >
          <option value="auto">{t('controls.autoDetect')}</option>
          <option value="preset">{t('controls.brandPreset')}</option>
          <option value="custom">{t('controls.customPalette')}</option>
        </select>
      </div>

      {/* Preset palette selector */}
      {isPreset && (
        <div className="space-y-2">
          {/* Brand selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('controls.presetBrand')}</label>
            <select
              value={findPresetPalette(settings.presetPaletteId ?? '')?.brand ?? presetBrands[0]}
              onChange={(e) => {
                const first = palettesForBrand(e.target.value)[0];
                if (first) updateSettings({ presetPaletteId: first.id });
              }}
              disabled={disabled}
              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            >
              {presetBrands.map((brand) => (
                <option key={brand} value={brand}>{brand} — {palettesForBrand(brand)[0]?.medium}</option>
              ))}
            </select>
          </div>

          {/* Set selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('controls.presetSet')}</label>
            <select
              value={settings.presetPaletteId ?? ''}
              onChange={(e) => updateSettings({ presetPaletteId: e.target.value })}
              disabled={disabled}
              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            >
              {palettesForBrand(findPresetPalette(settings.presetPaletteId ?? '')?.brand ?? presetBrands[0]).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.size} {t('controls.colorPlural')})
                </option>
              ))}
            </select>
          </div>

          {/* Buy link */}
          {(() => {
            const selected = findPresetPalette(settings.presetPaletteId ?? '');
            if (!selected?.vendorUrl) return null;
            return (
              <a
                href={selected.vendorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {t('controls.buyThisSet')} ↗
              </a>
            );
          })()}

          {/* Color preview swatches */}
          {(() => {
            const selected = findPresetPalette(settings.presetPaletteId ?? '');
            if (!selected) return null;
            return (
              <div className="mt-1 flex flex-wrap gap-1">
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
            <span>{t('controls.paletteSize')}</span>
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
