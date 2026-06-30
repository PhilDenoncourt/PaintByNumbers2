import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { findPresetPalette } from '../../data/paletteRegistry';
import { useAffiliatePreset } from '../../hooks/useAffiliatePreset';
import { Segmented } from '../panels/Segmented';
import { CustomPaletteControls } from '../controls/CustomPaletteControls';
import { AdjustPanel } from '../panels/AdjustPanel';
import { RefinePanel } from '../panels/RefinePanel';
import { ExportPanel } from '../panels/ExportPanel';
import { StudioAmazonCard } from './StudioAmazonCard';
import { StudioPalette } from './StudioPalette';
import { useStudioTokens } from './studioTokens';
import type { RGB } from './studioColor';

type PaletteMode = 'preset' | 'auto' | 'custom';
const DEFAULT_PRESET_ID = 'crayola-24';
const SPECTRUM_THRESHOLD = 24;

/**
 * Right-hand controls column for the Open Studio editor. The Palette step gets
 * the bespoke "Pick your colors" treatment (Amazon card + paint drops/spectrum);
 * Adjust/Refine/Export reuse the existing functional panels under a studio
 * heading. A single Generate button lives at the foot of every step.
 */
export function StudioControls() {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const activePanel = useAppStore((s) => s.ui.activePanel);
  const result = useAppStore((s) => s.result);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const pipelineError = useAppStore((s) => s.pipeline.error);
  const startPipeline = useAppStore((s) => s.startPipeline);
  const { preset } = useAffiliatePreset();

  const running = pipelineStatus === 'running';
  const disabled = running;

  let mode: PaletteMode = 'auto';
  if (settings.presetPaletteId !== null) mode = 'preset';
  if (settings.customPalette !== null) mode = 'custom';

  const setMode = (next: PaletteMode) => {
    if (next === 'auto') updateSettings({ presetPaletteId: null, customPalette: null });
    else if (next === 'preset') {
      const id = findPresetPalette(settings.presetPaletteId ?? '')?.id ?? DEFAULT_PRESET_ID;
      updateSettings({ presetPaletteId: id, customPalette: null });
    } else updateSettings({ presetPaletteId: null, customPalette: [] });
  };

  // Palette colors to display: the generated result if present, else a preview
  // of the chosen source (preset swatches / custom palette).
  let displayColors: RGB[] = [];
  if (result) {
    displayColors = result.palette as RGB[];
  } else if (mode === 'custom' && settings.customPalette) {
    displayColors = settings.customPalette as RGB[];
  } else {
    displayColors = preset.colors.map((c) => c.rgb as RGB);
  }

  const colorCount = result
    ? result.palette.length
    : mode === 'auto'
      ? settings.paletteSize
      : displayColors.length;
  const bigSet = colorCount > SPECTRUM_THRESHOLD;

  const heading =
    activePanel === 'palette'
      ? t('studio.pickYourColors', { defaultValue: 'Pick your colors' })
      : t(`panels.${activePanel}.title`);
  const subtitle =
    activePanel === 'palette'
      ? t('studio.pickYourColorsSub', {
          defaultValue: 'Match the template to a paint set you can hold in your hand.',
        })
      : t(`panels.${activePanel}.desc`);

  return (
    <div className="pbn-sc flex flex-col gap-5 lg:overflow-y-auto lg:min-h-0 lg:pr-1">
      {/* Step heading */}
      <div>
        <div className="flex items-baseline gap-[10px] flex-wrap">
          <span
            className="font-display text-[26px] sm:text-[28px] font-extrabold -tracking-[0.02em] leading-[1.05]"
            style={{ color: tk.text }}
          >
            {heading}
          </span>
          {activePanel === 'palette' && (
            <span className="font-display text-[13px] font-bold" style={{ color: '#ffd814' }}>
              {colorCount}
            </span>
          )}
        </div>
        <p className="mt-[7px] text-[13.5px] leading-[1.5]" style={{ color: tk.muted }}>
          {subtitle}
        </p>
      </div>

      {activePanel === 'palette' && (
        <>
          <StudioAmazonCard bigSetNote={bigSet} />

          {/* How colors are chosen */}
          <div>
            <div
              className="font-display text-[11px] font-bold uppercase tracking-[0.06em] mb-2"
              style={{ color: tk.faint }}
            >
              {t('panels.palette.howColorsChosen')}
            </div>
            <Segmented<PaletteMode>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'preset', label: t('panels.palette.fromSet'), disabled },
                { value: 'auto', label: t('panels.palette.autoDetect'), disabled },
                { value: 'custom', label: t('panels.palette.custom'), disabled },
              ]}
            />

            {mode === 'auto' && (
              <div className="mt-3">
                <label className="flex items-center justify-between text-[12.5px] font-medium mb-1.5" style={{ color: tk.muted }}>
                  <span>{t('controls.paletteSize')}</span>
                  <span className="font-mono tabular-nums">{settings.paletteSize}</span>
                </label>
                <input
                  type="range"
                  min={3}
                  max={30}
                  value={settings.paletteSize}
                  onChange={(e) => updateSettings({ paletteSize: Number(e.target.value) })}
                  disabled={disabled}
                  className="w-full"
                  style={{ accentColor: '#ffd814' }}
                />
              </div>
            )}

            {mode === 'custom' && (
              <div className="mt-3">
                <CustomPaletteControls />
              </div>
            )}
          </div>

          {/* Generated / preview palette */}
          {displayColors.length > 0 && <StudioPalette colors={displayColors} />}
        </>
      )}

      {activePanel === 'adjust' && <AdjustPanel />}
      {activePanel === 'refine' && <RefinePanel />}
      {activePanel === 'export' && <ExportPanel />}

      {/* Generate */}
      <div className="mt-auto pt-1">
        <button
          onClick={startPipeline}
          disabled={running}
          className="w-full py-4 rounded-[16px] font-display text-[15px] font-extrabold transition-opacity disabled:opacity-60"
          style={{ background: tk.generateBg, color: tk.generateFg, boxShadow: tk.generateShadow }}
        >
          {running ? t('sidebar.stop') : `✨ ${t('panels.generate')}`}
        </button>
        {pipelineError ? (
          <p className="mt-2 text-[11px] text-red-600 dark:text-red-400 text-center">{pipelineError}</p>
        ) : (
          <p className="mt-2 text-[11px] text-center" style={{ color: tk.faint }}>
            {t('panels.generateCaption')}
          </p>
        )}
      </div>
    </div>
  );
}
