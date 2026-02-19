import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';

export function ContourSmoothingControls() {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('controls.contourSmoothing')}</h3>
      
      {/* Smoothing Strength */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
          <span>{t('controls.smoothingStrength')}</span>
          <span className="text-gray-500 font-mono text-xs">{settings.simplificationEpsilon.toFixed(1)}px</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.25}
          value={settings.simplificationEpsilon}
          onChange={(e) => updateSettings({ simplificationEpsilon: Number(e.target.value) })}
          disabled={disabled}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{t('controls.sharpEdges')}</span>
          <span>{t('controls.smoothCurves')}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('controls.simplifyDescription')}
        </p>
      </div>

      {/* Smoothing Passes */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
          <span>{t('controls.smoothingPasses')}</span>
          <span className="text-gray-500 font-mono text-xs">{settings.smoothingPasses}</span>
        </label>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={settings.smoothingPasses}
          onChange={(e) => updateSettings({ smoothingPasses: Number(e.target.value) })}
          disabled={disabled}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{t('common.none')}</span>
          <span>{t('controls.heavyLabel')}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('controls.heavySmoothing')}
        </p>
      </div>

      {/* Preserve Corners */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {t('controls.preserveCorners')}
        </label>
        <input
          type="checkbox"
          checked={settings.preserveCorners}
          onChange={(e) => updateSettings({ preserveCorners: e.target.checked })}
          disabled={disabled}
          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
        />
      </div>
      <p className="text-xs text-gray-500">
        {t('controls.cornerDescription')}
      </p>

      {/* Visual Example */}
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-2">{t('controls.smoothingGuide')}</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>{t('controls.lowStrength')}</strong> (0.5-1.0): {t('controls.detailedOutlines')}</li>
          <li>• <strong>{t('controls.mediumStrength')}</strong> (1.5-2.5): {t('controls.balancedDetail')}</li>
          <li>• <strong>{t('controls.highStrength')}</strong> (3.0-5.0): {t('controls.smoothOutlines')}</li>
          <li>• <strong>{t('controls.smoothingPasses')}</strong>: {t('controls.passesDescription')}</li>
        </ul>
      </div>
    </div>
  );
}
