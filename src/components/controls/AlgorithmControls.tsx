import { useId } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';

export function AlgorithmControls({ textColor }: { textColor?: string }) {
  const id = useId();
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  // Fixed palettes bypass both automatic algorithms.
  if (settings.presetPaletteId !== null || settings.customPalette !== null) return null;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300" style={{ color: textColor }}>
        {t('controls.algorithm')}
      </label>
      <select
        id={id}
        aria-describedby={`${id}-help`}
        value={settings.algorithm}
        onChange={(e) => updateSettings({ algorithm: e.target.value as 'kmeans' | 'mediancut' })}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      >
        <option value="kmeans">{t('controls.kmeans')}</option>
        <option value="mediancut">{t('controls.mediancut')}</option>
      </select>
      <p id={`${id}-help`} className="text-xs leading-relaxed text-gray-600 dark:text-gray-400" style={{ color: textColor }}>
        {t(`controls.${settings.algorithm}Help`)}
      </p>
    </div>
  );
}
