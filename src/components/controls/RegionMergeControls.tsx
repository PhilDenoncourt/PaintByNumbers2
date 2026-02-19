import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import type { MergeMode } from '../../state/types';

export function RegionMergeControls() {
  const { t } = useTranslation();
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const setMergeMode = useAppStore((s) => s.setMergeMode);
  const selectedRegions = useAppStore((s) => s.ui.selectedRegions);
  const mergeSuggestions = useAppStore((s) => s.ui.mergeSuggestions);
  const splitAnalysis = useAppStore((s) => s.ui.splitAnalysis);
  const clearRegionSelection = useAppStore((s) => s.clearRegionSelection);
  const performMerge = useAppStore((s) => s.performMerge);
  const performSplit = useAppStore((s) => s.performSplit);

  const handleModeChange = (mode: MergeMode) => {
    setMergeMode(mode);
    if (mode === 'browse') {
      clearRegionSelection();
    }
  };

  const handleConfirmMerge = async () => {
    if (selectedRegions.length === 2) {
      await performMerge(selectedRegions[0], selectedRegions[1]);
    }
  };

  return (
    <div className="border-b border-gray-300 bg-white p-3">
      {/* Mode buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => handleModeChange('browse')}
          className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
            mergeMode === 'browse'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={t('merge.browseDescription')}
        >
          👁️ {t('merge.browse')}
        </button>
        <button
          onClick={() => handleModeChange('merge')}
          className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
            mergeMode === 'merge'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={t('merge.mergeDescription')}
        >
          🔗 {t('controls.merge')}
        </button>
        <button
          onClick={() => handleModeChange('split')}
          className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
            mergeMode === 'split'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={t('merge.splitDescription')}
        >
          ✂️ {t('controls.split')}
        </button>
      </div>

      {/* Merge mode UI */}
      {mergeMode === 'merge' && (
        <div className="space-y-2 rounded bg-blue-50 p-2">
          <div className="text-sm text-gray-700">
            <strong>{t('merge.modeLabel')}:</strong> {t('merge.modeDescription')}
          </div>
          {selectedRegions.length > 0 && (
            <div className="text-sm">
              <div className="mb-2">
                {t('merge.selectedRegions')} <span className="font-mono">{selectedRegions.join(', ')}</span>
              </div>

              {selectedRegions.length === 1 && mergeSuggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600">{t('merge.suggestedMergeTargets')}</div>
                  {mergeSuggestions.slice(0, 3).map((sug) => (
                    <button
                      key={sug.targetRegionId}
                      onClick={async () => {
                        await performMerge(selectedRegions[0], sug.targetRegionId);
                      }}
                      className="block w-full rounded bg-white px-2 py-1 text-left text-xs hover:bg-blue-100"
                    >
                      <div className="font-mono">{t('merge.regionLabel')} {sug.targetRegionId}</div>
                      <div className="text-gray-600">
                        {t('merge.score')}: {(sug.contextScore * 100).toFixed(0)}%
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedRegions.length === 2 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmMerge}
                    className="flex-1 rounded bg-green-500 px-2 py-2 text-sm text-white hover:bg-green-600"
                  >
                    {t('merge.confirmMerge')}
                  </button>
                  <button
                    onClick={clearRegionSelection}
                    className="flex-1 rounded bg-gray-300 px-2 py-2 text-sm text-gray-700 hover:bg-gray-400"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Split mode UI */}
      {mergeMode === 'split' && (
        <div className="space-y-2 rounded bg-orange-50 p-2">
          <div className="text-sm text-gray-700">
            <strong>{t('merge.splitMode')}:</strong> {t('merge.splitModeDescription')}
          </div>
          {splitAnalysis && (
            <div className="space-y-2 text-sm">
              <div className="rounded bg-white p-2">
                <div className="mb-2">
                  <strong>{t('merge.regionLabel')} {splitAnalysis.regionId}</strong>
                </div>
                <div className="mb-2 text-xs text-gray-600">
                  {t('merge.canBeSplit')} {splitAnalysis.hasSubregions ? `✓ ${t('merge.yes')}` : `✗ ${t('merge.no')}`}
                </div>
                <div className="mb-2 text-xs text-gray-600">
                  {t('merge.colorVariance')} {(splitAnalysis.estimatedVariance * 100).toFixed(0)}%
                </div>

                {splitAnalysis.splitCandidates.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-600">{t('merge.splitCandidates')}</div>
                    {splitAnalysis.splitCandidates.map((cand, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          await performSplit(splitAnalysis.regionId, cand.x, cand.y);
                        }}
                        className="block w-full rounded bg-white px-2 py-1 text-left text-xs hover:bg-orange-100"
                      >
                        <div>
                          {t('merge.position')}: ({cand.x}, {cand.y}) — {t('merge.strength')}: {(cand.strength * 100).toFixed(0)}%
                        </div>
                        <div className="text-gray-500">
                          ~{cand.estimatedPixelCount.toLocaleString()} {t('merge.pixels')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    // Clear split analysis
                    useAppStore.setState((s) => ({
                      ui: { ...s.ui, splitAnalysis: null },
                    }));
                  }}
                  className="mt-2 w-full rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {mergeMode === 'browse' && (
        <div className="text-xs text-gray-600">
          <p className="mb-1">
            <strong>{t('merge.keyboardShortcuts')}:</strong>
          </p>
          <ul className="list-inside space-y-0.5">
            <li>
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">M</kbd> — {t('merge.toggleMerge')}
            </li>
            <li>
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">S</kbd> — {t('merge.toggleSplit')}
            </li>
            <li>
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">Esc</kbd> — {t('merge.returnBrowse')}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
