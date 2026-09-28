import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { generateSvg, generateLaserSvg, downloadSvg } from '../../export/svgExporter';
import { downloadPdf, downloadColorLegendPdf } from '../../export/pdfExporter';
import {
  DEFAULT_PAPER_SIZE,
  PAPER_SIZES,
  TILE_TARGET_SIZES,
  type PaperSizeId,
} from '../../export/paperSizes';
import { downloadPng, downloadColorLegendPng } from '../../export/pngExporter';
import { trackEvent } from '../../utils/analytics';
import { projectPersistence, useProjectPersistence } from '../../projects/projectPersistence';
import { useProjectMessage } from '../../projects/projectMessages';
import { useRenderLabels } from '../../state/useRenderLabels';
import { AffiliateExportHero } from '../affiliate/AffiliateExportHero';

type Format = 'svg' | 'png' | 'pdf';

const FORMAT_BADGES: Record<Format, { tint: string; fg: string }> = {
  svg: { tint: 'bg-[#eff6ff] dark:bg-blue-500/15', fg: 'text-[#2563eb] dark:text-blue-300' },
  png: { tint: 'bg-[#ecfdf5] dark:bg-emerald-500/15', fg: 'text-[#16a34a] dark:text-emerald-300' },
  pdf: { tint: 'bg-[#fef3c7] dark:bg-amber-500/15', fg: 'text-[#b45309] dark:text-amber-300' },
};

export function ExportPanel() {
  const { t } = useTranslation();
  const message = useProjectMessage();
  const result = useAppStore((s) => s.result);
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);
  const { metadata } = useProjectPersistence();
  // Exports must match what's on screen: same scale, same manual positions
  const renderLabels = useRenderLabels();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pageSize, setPageSize] = useState<PaperSizeId>(DEFAULT_PAPER_SIZE);
  // '' means print on one sheet at the chosen size rather than tiling.
  const [tileOnto, setTileOnto] = useState<PaperSizeId | ''>('');

  if (!result) return null;

  const exportTemplate = (format: Format, includeColor: boolean) => {
    const suffix = includeColor ? 'colored' : 'outline';
    if (format === 'svg') {
      downloadSvg(
        generateSvg(result, includeColor, presetPaletteId, renderLabels),
        `paint-by-numbers-${suffix}.svg`
      );
    } else if (format === 'png') {
      downloadPng(result, includeColor, `paint-by-numbers-${suffix}.png`, renderLabels);
    } else {
      const tiled = tileOnto !== '' && tileOnto !== pageSize;
      downloadPdf(
        result,
        includeColor,
        `paint-by-numbers-${suffix}-${pageSize}${tiled ? `-on-${tileOnto}` : ''}.pdf`,
        presetPaletteId,
        renderLabels,
        { pageSize, tileOnto: tiled ? tileOnto : null },
      );
      trackEvent('export', { format, variant: suffix, pageSize, tileOnto: tiled ? tileOnto : 'none' });
      return;
    }
    trackEvent('export', { format, variant: suffix });
  };

  const exportLaserSvg = () => {
    downloadSvg(generateLaserSvg(result, renderLabels), 'paint-by-numbers-laser.svg');
    trackEvent('export', { format: 'svg', variant: 'laser' });
  };

  const exportColorGuide = (format: 'pdf' | 'png') => {
    if (format === 'pdf') downloadColorLegendPdf(result, presetPaletteId);
    else downloadColorLegendPng(result, presetPaletteId);
    trackEvent('export', { format, variant: 'color-guide' });
  };

  const handleSaveToBrowser = () => { void projectPersistence.saveNow(); };

  const handleExportJson = () => {
    void projectPersistence.downloadCurrent();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (metadata && !window.confirm(message('replacePrompt'))) return;
      await projectPersistence.importFile(file);
    } catch (err) {
      alert(t('export.failedImportSession', { message: err instanceof Error ? err.message : t('common.unknownError') }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formats: { format: Format; title: string; desc: string }[] = [
    { format: 'svg', title: t('panels.export.svgTitle'), desc: t('panels.export.svgDesc') },
    { format: 'png', title: t('panels.export.pngTitle'), desc: t('panels.export.pngDesc') },
    { format: 'pdf', title: t('panels.export.pdfTitle'), desc: t('panels.export.pdfDesc') },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Affiliate hero */}
      <AffiliateExportHero />

      {/* Download template */}
      <div>
        <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-[9px]">
          {t('panels.export.downloadTemplate')}
        </label>
        <div className="flex flex-col gap-2.5">
          {formats.map(({ format, title, desc }) => (
            <div
              key={format}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-[13px] py-3 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center gap-[9px] mb-[9px]">
                <span
                  className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[11px] font-bold ${FORMAT_BADGES[format].tint} ${FORMAT_BADGES[format].fg}`}
                >
                  {format.toUpperCase()}
                </span>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a] dark:text-gray-100">{title}</div>
                  <div className="text-[11px] text-[#94a3b8] dark:text-gray-500">{desc}</div>
                </div>
              </div>
              {format === 'pdf' && (
                <div className="mb-[9px] flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <label className="flex-1 text-[11px] font-semibold text-[#64748b] dark:text-gray-400">
                      {t('panels.export.paperSize')}
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as PaperSizeId)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-medium text-[#334155] dark:text-gray-200"
                      >
                        {PAPER_SIZES.map((size) => (
                          <option key={size.id} value={size.id}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex-1 text-[11px] font-semibold text-[#64748b] dark:text-gray-400">
                      {t('panels.export.tileAcross')}
                      <select
                        value={tileOnto}
                        onChange={(e) => setTileOnto(e.target.value as PaperSizeId | '')}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-medium text-[#334155] dark:text-gray-200"
                      >
                        <option value="">{t('panels.export.tileNone')}</option>
                        {PAPER_SIZES.filter((size) => TILE_TARGET_SIZES.includes(size.id)).map((size) => (
                          <option key={size.id} value={size.id}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {tileOnto !== '' && tileOnto !== pageSize && (
                    <p className="text-[11px] text-[#94a3b8] dark:text-gray-500">
                      {t('panels.export.tileHint')}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-[7px]">
                <button
                  onClick={() => exportTemplate(format, false)}
                  className="flex-1 py-[7px] rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  {t('panels.export.outline')}
                </button>
                <button
                  onClick={() => exportTemplate(format, true)}
                  className="flex-1 py-[7px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#475569] dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('panels.export.colored')}
                </button>
              </div>
              {format === 'svg' && (
                <button
                  onClick={exportLaserSvg}
                  title={t('panels.export.laserDesc')}
                  className="mt-[7px] w-full py-[7px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#475569] dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  🔦 {t('panels.export.laserButton')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Color guide */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-[9px]">
          {t('export.colorGuide')}
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => exportColorGuide('pdf')}
            className="flex-1 py-[9px] rounded-[9px] bg-[#f3e8ff] dark:bg-purple-500/15 text-[#7e22ce] dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-500/25 transition-colors"
          >
            {t('panels.export.guidePdf')}
          </button>
          <button
            onClick={() => exportColorGuide('png')}
            className="flex-1 py-[9px] rounded-[9px] bg-[#f3e8ff] dark:bg-purple-500/15 text-[#7e22ce] dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-500/25 transition-colors"
          >
            {t('panels.export.guidePng')}
          </button>
        </div>
      </div>

      {/* Session */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <label className="block text-[13px] font-semibold text-[#334155] dark:text-gray-200 mb-[9px]">
          {t('panels.export.session')}
        </label>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <div className="flex flex-col gap-2">
          {metadata && <button onClick={() => void projectPersistence.downloadSaved()} className="text-xs underline self-start">{message('downloadBackup')}</button>}
          <button
            onClick={handleSaveToBrowser}
            className="w-full py-[9px] rounded-[9px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#334155] dark:text-gray-200 text-[12.5px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            💾 {t('export.saveToBrowser')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleExportJson}
              className="flex-1 py-[9px] rounded-[9px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#334155] dark:text-gray-200 text-[12.5px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('panels.export.exportJson')}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-[9px] rounded-[9px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#334155] dark:text-gray-200 text-[12.5px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('panels.export.loadJson')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
