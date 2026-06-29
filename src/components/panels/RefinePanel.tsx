import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import type { MergeMode } from '../../state/types';
import { PaletteLegend } from '../palette/PaletteLegend';
import { RegionMergeControls } from '../controls/RegionMergeControls';
import { calculateRegionStatistics } from '../../utils/statisticsCalculator';
import { Segmented } from './Segmented';

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function RefinePanel() {
  const { t } = useTranslation();
  const result = useAppStore((s) => s.result);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const history = useAppStore((s) => s.history);
  const historyIndex = useAppStore((s) => s.historyIndex);
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const setMergeMode = useAppStore((s) => s.setMergeMode);
  const clearRegionSelection = useAppStore((s) => s.clearRegionSelection);

  if (!result) return null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const stats = calculateRegionStatistics(result.regions);
  const colorsUsed = stats.colorSizes.length;

  const statTiles = [
    { value: compact(stats.totalRegions), label: t('panels.refine.totalRegions') },
    { value: compact(colorsUsed), label: t('panels.refine.colorsUsed') },
    { value: compact(stats.averageRegionSize), label: t('panels.refine.avgRegionPx') },
    { value: compact(stats.smallestRegion?.pixelCount ?? 0), label: t('panels.refine.smallestPx') },
  ];

  const handleMode = (mode: MergeMode) => {
    setMergeMode(mode);
    if (mode === 'browse') clearRegionSelection();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Undo / Redo */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center gap-1.5 py-[9px] rounded-[9px] text-[12.5px] font-semibold border transition-colors ${
            canUndo
              ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#334155] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              : 'border-gray-100 dark:border-gray-700 bg-[#f8fafc] dark:bg-gray-800/50 text-[#cbd5e1] dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          ↶ {t('sidebar.undo')}
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`flex-1 flex items-center justify-center gap-1.5 py-[9px] rounded-[9px] text-[12.5px] font-semibold border transition-colors ${
            canRedo
              ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#334155] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              : 'border-gray-100 dark:border-gray-700 bg-[#f8fafc] dark:bg-gray-800/50 text-[#cbd5e1] dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          ↷ {t('sidebar.redo')}
        </button>
      </div>

      {/* Region tool */}
      <div>
        <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-2">
          {t('panels.refine.regionTool')}
        </label>
        <Segmented<MergeMode>
          value={mergeMode}
          onChange={handleMode}
          options={[
            { value: 'browse', label: `👁 ${t('merge.browse')}` },
            { value: 'merge', label: `🔗 ${t('controls.merge')}` },
            { value: 'split', label: `✂ ${t('controls.split')}` },
          ]}
        />
        <p className="text-[11.5px] text-[#94a3b8] dark:text-gray-500 mt-2 leading-[1.4]">
          {t('panels.refine.regionToolHelp')}
        </p>
        {mergeMode !== 'browse' && (
          <div className="mt-3 rounded-[10px] overflow-hidden border border-gray-100 dark:border-gray-700">
            <RegionMergeControls showModeButtons={false} />
          </div>
        )}
      </div>

      {/* Palette legend */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-[9px]">
          <h3 className="text-xs font-bold text-[#334155] dark:text-gray-200 uppercase tracking-[0.04em]">
            {t('panels.refine.paletteLegend')}
          </h3>
          <span className="text-[11px] text-[#94a3b8] dark:text-gray-500">
            {t('panels.refine.dragToReorder')}
          </span>
        </div>
        <PaletteLegend showHeader={false} />
      </div>

      {/* Statistics */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <h3 className="text-xs font-bold text-[#334155] dark:text-gray-200 uppercase tracking-[0.04em] mb-[10px]">
          {t('panels.refine.statistics')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              className="bg-[#f8fafc] dark:bg-gray-700/40 rounded-[10px] px-3 py-[10px]"
            >
              <div className="text-[18px] font-bold text-[#0f172a] dark:text-gray-100 tabular-nums">
                {tile.value}
              </div>
              <div className="text-[11px] text-[#94a3b8] dark:text-gray-500">{tile.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
