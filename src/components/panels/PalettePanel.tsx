import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { findPresetPalette } from '../../data/paletteRegistry';
import { CustomPaletteControls } from '../controls/CustomPaletteControls';
import { AffiliatePaletteHero } from '../affiliate/AffiliatePaletteHero';
import { Segmented } from './Segmented';
import { useAffiliatePreset } from '../../hooks/useAffiliatePreset';

type PaletteMode = 'preset' | 'auto' | 'custom';

const DEFAULT_PRESET_ID = 'crayola-24';

export function PalettePanel() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const { preset } = useAffiliatePreset();

  const disabled = pipelineStatus === 'running';

  let mode: PaletteMode = 'auto';
  if (settings.presetPaletteId !== null) mode = 'preset';
  if (settings.customPalette !== null) mode = 'custom';

  const setMode = (next: PaletteMode) => {
    if (next === 'auto') {
      updateSettings({ presetPaletteId: null, customPalette: null });
    } else if (next === 'preset') {
      // Keep the current/fallback selection so the hero + CTAs stay in sync.
      const id = findPresetPalette(settings.presetPaletteId ?? '')?.id ?? DEFAULT_PRESET_ID;
      updateSettings({ presetPaletteId: id, customPalette: null });
    } else {
      updateSettings({ presetPaletteId: null, customPalette: [] });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* A. Featured affiliate hero */}
      <AffiliatePaletteHero />

      {/* B. How colors are chosen */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-[18px]">
        <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-2">
          {t('panels.palette.howColorsChosen')}
        </label>
        <Segmented<PaletteMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'preset', label: t('panels.palette.fromSet'), disabled },
            { value: 'auto', label: t('panels.palette.autoDetect'), disabled },
            { value: 'custom', label: t('panels.palette.custom'), disabled },
          ]}
        />

        {mode === 'preset' && (
          <p className="text-[11.5px] text-[#94a3b8] dark:text-gray-500 mt-[9px] leading-[1.45]">
            {t('panels.palette.fromSetHelp', { count: preset.size, brand: preset.brand })}
          </p>
        )}

        {mode === 'auto' && (
          <div className="mt-3">
            <label className="flex items-center justify-between text-[12.5px] font-medium text-[#475569] dark:text-gray-300 mb-1.5">
              <span>{t('controls.paletteSize')}</span>
              <span className="text-[#64748b] dark:text-gray-400 font-mono tabular-nums">
                {settings.paletteSize}
              </span>
            </label>
            <input
              type="range"
              min={3}
              max={30}
              value={settings.paletteSize}
              onChange={(e) => updateSettings({ paletteSize: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-[#94a3b8] dark:text-gray-500 mt-0.5">
              <span>3</span>
              <span>30</span>
            </div>
          </div>
        )}

        {mode === 'custom' && (
          <div className="mt-3">
            <CustomPaletteControls />
          </div>
        )}
      </div>

      {/* C. Color style */}
      <div>
        <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-2">
          {t('panels.palette.quantizationAlgorithm')}
        </label>
        <Segmented<'kmeans' | 'mediancut'>
          size="md"
          value={settings.algorithm}
          onChange={(v) => updateSettings({ algorithm: v })}
          options={[
            { value: 'kmeans', label: t('controls.kmeans'), disabled },
            { value: 'mediancut', label: t('controls.mediancut'), disabled },
          ]}
        />
      </div>
    </div>
  );
}
