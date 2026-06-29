import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { CropRotateModal } from '../controls/CropRotateModal';

const DIFFICULTY_PRESETS = {
  simple: { detailLevel: 0, minRegionSize: 510 },
  medium: { detailLevel: 50, minRegionSize: 135 },
  complex: { detailLevel: 100, minRegionSize: 10 },
} as const;

type Difficulty = keyof typeof DIFFICULTY_PRESETS;

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function AdjustPanel() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const [showCropModal, setShowCropModal] = useState(false);

  const disabled = pipelineStatus === 'running';

  const currentDifficulty: Difficulty =
    settings.detailLevel <= 15 ? 'simple' : settings.detailLevel >= 85 ? 'complex' : 'medium';

  const applyDifficulty = (preset: Difficulty) => {
    updateSettings(DIFFICULTY_PRESETS[preset]);
  };

  const hasToneAdjustments =
    settings.brightness !== 0 ||
    settings.contrast !== 0 ||
    settings.saturation !== 0 ||
    settings.sharpness !== 0;

  const resetTone = () =>
    updateSettings({ brightness: 0, contrast: 0, saturation: 0, sharpness: 0 });

  const toneSliders: { key: 'brightness' | 'contrast' | 'saturation' | 'sharpness'; label: string }[] = [
    { key: 'brightness', label: t('controls.brightness') },
    { key: 'contrast', label: t('controls.contrast') },
    { key: 'saturation', label: t('controls.saturation') },
    { key: 'sharpness', label: t('controls.sharpness') },
  ];

  return (
    <>
      {showCropModal && <CropRotateModal onClose={() => setShowCropModal(false)} />}
      <div className="flex flex-col gap-5">
        {/* Difficulty */}
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-2">
            {t('controls.difficultyLevel')}
          </label>
          <div className="flex gap-1.5">
            {(['simple', 'medium', 'complex'] as const).map((preset) => {
              const active = currentDifficulty === preset;
              return (
                <button
                  key={preset}
                  onClick={() => applyDifficulty(preset)}
                  disabled={disabled}
                  className={`flex-1 py-[10px] px-1.5 rounded-[9px] text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-[#f1f5f9] dark:bg-gray-700 text-[#64748b] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t(`controls.${preset}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail level */}
        <div>
          <div className="flex items-center justify-between mb-[7px]">
            <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">
              {t('panels.adjust.detailLevel')}
            </label>
            <span className="text-xs font-bold text-[#64748b] dark:text-gray-400 tabular-nums">
              {settings.detailLevel}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.detailLevel}
            onChange={(e) => {
              const detail = Number(e.target.value);
              const tFactor = 1 - detail / 100;
              const minRegionSize = Math.round(10 + tFactor * tFactor * 500);
              updateSettings({ detailLevel: detail, minRegionSize });
            }}
            disabled={disabled}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-[#94a3b8] dark:text-gray-500 mt-0.5">
            <span>{t('controls.simple')}</span>
            <span>{t('controls.detailed')}</span>
          </div>
        </div>

        {/* Image tone */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-[13px]">
            <h3 className="text-xs font-bold text-[#334155] dark:text-gray-200 uppercase tracking-[0.04em]">
              {t('panels.adjust.imageTone')}
            </h3>
            {hasToneAdjustments && (
              <button
                onClick={resetTone}
                disabled={disabled}
                className="text-[11px] font-semibold text-[#2563eb] dark:text-blue-300 bg-[#eff6ff] dark:bg-blue-500/15 px-[9px] py-[3px] rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors disabled:opacity-50"
              >
                {t('controls.reset')}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-[14px]">
            {toneSliders.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-[5px]">
                  <label className="text-[12.5px] font-medium text-[#475569] dark:text-gray-300">
                    {label}
                  </label>
                  <span className="text-[11px] font-semibold text-[#94a3b8] dark:text-gray-500 tabular-nums">
                    {signed(settings[key])}
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={settings[key]}
                  onChange={(e) =>
                    updateSettings({ [key]: Number(e.target.value) } as Record<typeof key, number>)
                  }
                  disabled={disabled}
                  className="w-full accent-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col gap-[18px]">
          <div>
            <div className="flex items-center justify-between mb-[7px]">
              <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">
                {t('controls.borderWidth')}
              </label>
              <span className="text-xs font-bold text-[#64748b] dark:text-gray-400 tabular-nums">
                {settings.borderWidth.toFixed(1)}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={settings.borderWidth}
              onChange={(e) => updateSettings({ borderWidth: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-[7px]">
              <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">
                {t('controls.lineSmoothing')}
              </label>
              <span className="text-xs font-bold text-[#64748b] dark:text-gray-400 tabular-nums">
                {settings.simplificationEpsilon.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={settings.simplificationEpsilon}
              onChange={(e) => updateSettings({ simplificationEpsilon: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-[#94a3b8] dark:text-gray-500 mt-0.5">
              <span>{t('controls.sharpEdges')}</span>
              <span>{t('controls.smoothCurves')}</span>
            </div>
          </div>

          <button
            onClick={() => setShowCropModal(true)}
            disabled={disabled}
            className="flex items-center justify-center gap-2 w-full py-[11px] rounded-[10px] border border-gray-200 dark:border-gray-600 bg-[#f8fafc] dark:bg-gray-700/50 text-[#334155] dark:text-gray-200 text-[13px] font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            ✂ {t('panels.adjust.cropRotate')}
            {(settings.cropRect !== null || settings.rotation !== 0) && (
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
