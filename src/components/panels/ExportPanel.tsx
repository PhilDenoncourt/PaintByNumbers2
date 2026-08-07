import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { generateSvg, downloadSvg } from '../../export/svgExporter';
import { downloadPdf, downloadColorLegendPdf } from '../../export/pdfExporter';
import { downloadPng, downloadColorLegendPng } from '../../export/pngExporter';
import { trackEvent } from '../../utils/analytics';
import { sessionStorage } from '../../utils/sessionStorage';
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
  const result = useAppStore((s) => s.result);
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);
  const settings = useAppStore((s) => s.settings);
  const sourceImageUrl = useAppStore((s) => s.sourceImageUrl);
  const labelOverrides = useAppStore((s) => s.labelOverrides);
  // Exports must match what's on screen: same scale, same manual positions
  const renderLabels = useRenderLabels();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      downloadPdf(result, includeColor, `paint-by-numbers-${suffix}.pdf`, presetPaletteId, renderLabels);
    }
    trackEvent('export', { format, variant: suffix });
  };

  const exportColorGuide = (format: 'pdf' | 'png') => {
    if (format === 'pdf') downloadColorLegendPdf(result, presetPaletteId);
    else downloadColorLegendPng(result, presetPaletteId);
    trackEvent('export', { format, variant: 'color-guide' });
  };

  const handleSaveToBrowser = () => {
    sessionStorage.autoSave(settings, result, sourceImageUrl, labelOverrides);
    alert(t('export.autoSaveMessage'));
  };

  const handleExportJson = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    sessionStorage.exportToFile(
      settings,
      result,
      sourceImageUrl,
      `pbn-session-${timestamp}.json`,
      labelOverrides
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const session = await sessionStorage.importFromFile(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        useAppStore.setState({
          sourceImageUrl: canvas.toDataURL('image/png'),
          sourceImageData: imageData,
          processedWidth: imageData.width,
          processedHeight: imageData.height,
          settings: session.settings,
          result: session.result,
          labelOverrides: session.labelOverrides ?? {},
        });
        alert(t('export.sessionLoaded'));
      };
      img.src = session.sourceImageBase64;
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
