import { useAppStore } from '../../state/appStore';

export function ContourSmoothingControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);

  const disabled = pipelineStatus === 'running';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Contour Smoothing</h3>
      
      {/* Smoothing Strength */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
          <span>Smoothing Strength</span>
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
          <span>Sharp edges</span>
          <span>Smooth curves</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Controls how much to simplify contour lines. Lower values preserve more detail.
        </p>
      </div>

      {/* Smoothing Passes */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
          <span>Smoothing Passes</span>
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
          <span>None</span>
          <span>Heavy</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Applies additional smoothing iterations. Higher values create rounder curves.
        </p>
      </div>

      {/* Preserve Corners */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Preserve Sharp Corners
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
        When enabled, keeps sharp corners intact instead of rounding them.
      </p>

      {/* Visual Example */}
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-2">Smoothing Guide:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Low strength</strong> (0.5-1.0): Detailed, accurate outlines</li>
          <li>• <strong>Medium strength</strong> (1.5-2.5): Balanced detail and smoothness</li>
          <li>• <strong>High strength</strong> (3.0-5.0): Very smooth, simplified outlines</li>
          <li>• <strong>Passes</strong>: Use 1-2 for moderate smoothing, 3+ for heavy smoothing</li>
        </ul>
      </div>
    </div>
  );
}
