import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { generateSvg, downloadSvg } from '../../export/svgExporter';
import { downloadPdf, downloadColorLegendPdf } from '../../export/pdfExporter';
import { downloadPng, downloadColorLegendPng } from '../../export/pngExporter';

export function ExportButton() {
  const { t } = useTranslation();
  const result = useAppStore((s) => s.result);
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);

  if (!result) return null;

  const handleSvgExport = (includeColor: boolean) => {
    const svg = generateSvg(result, includeColor, presetPaletteId);
    const suffix = includeColor ? 'colored' : 'outline';
    downloadSvg(svg, `paint-by-numbers-${suffix}.svg`);
  };

  const handlePdfExport = (includeColor: boolean) => {
    const suffix = includeColor ? 'colored' : 'outline';
    downloadPdf(result, includeColor, `paint-by-numbers-${suffix}.pdf`, presetPaletteId);
  };

  const handlePngExport = (includeColor: boolean) => {
    const suffix = includeColor ? 'colored' : 'outline';
    downloadPng(result, includeColor, `paint-by-numbers-${suffix}.png`);
  };

  const handleColorGuideExport = (format: 'svg' | 'pdf' | 'png') => {
    if (format === 'svg') {
      const svg = generateSvg(result, true, presetPaletteId);
      downloadSvg(svg, 'paint-by-numbers-color-guide.svg');
    } else if (format === 'pdf') {
      downloadColorLegendPdf(result, presetPaletteId);
    } else if (format === 'png') {
      downloadColorLegendPng(result, presetPaletteId);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('export.svgTitle')}</p>
      <button
        onClick={() => handleSvgExport(false)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        {t('export.exportSvgOutline')}
      </button>
      <button
        onClick={() => handleSvgExport(true)}
        className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
      >
        {t('export.exportSvgColored')}
      </button>

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-2">{t('export.pngTitle')}</p>
      <button
        onClick={() => handlePngExport(false)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        {t('export.exportPngOutline')}
      </button>
      <button
        onClick={() => handlePngExport(true)}
        className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
      >
        {t('export.exportPngColored')}
      </button>

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-2">{t('export.pdfPrintReady')}</p>
      <button
        onClick={() => handlePdfExport(false)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        {t('export.exportPdfOutline')}
      </button>
      <button
        onClick={() => handlePdfExport(true)}
        className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
      >
        {t('export.exportPdfColored')}
      </button>

      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-2">{t('export.colorGuide')}</p>
      <button
        onClick={() => handleColorGuideExport('pdf')}
        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
      >
        {t('export.colorGuidePdf')}
      </button>
      <button
        onClick={() => handleColorGuideExport('png')}
        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
      >
        {t('export.colorGuidePng')}
      </button>
    </div>
  );
}
