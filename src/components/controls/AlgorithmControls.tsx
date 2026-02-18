import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';

export function AlgorithmControls() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{t('controls.algorithm')}</label>
      <select
        value={settings.algorithm}
        onChange={(e) => updateSettings({ algorithm: e.target.value as 'kmeans' | 'mediancut' })}
        disabled={disabled}
        className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
      >
        <option value="kmeans">{t('controls.kmeans')}</option>
        <option value="mediancut">{t('controls.mediancut')}</option>
      </select>
    </div>
  );
}
