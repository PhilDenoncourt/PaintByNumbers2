import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';

export function RenderingControls() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between text-sm font-medium text-gray-700">
        <span>{t('controls.borderWidth')}</span>
        <span className="text-gray-500 font-mono">{settings.borderWidth}px</span>
      </label>
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
      <p className="text-xs text-gray-500">
        {t('controls.borderingInfo')}
      </p>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{t('controls.none')}</span>
        <span>{t('controls.thick')}</span>
      </div>
    </div>
  );
}
