import { useAppStore } from '../../state/appStore';
import { generateSvg, downloadSvg } from '../../export/svgExporter';
import { downloadPdf } from '../../export/pdfExporter';

export function ExportButton() {
  const result = useAppStore((s) => s.result);

  if (!result) return null;

  const handleSvgExport = (includeColor: boolean) => {
    const svg = generateSvg(result, includeColor);
    const suffix = includeColor ? 'colored' : 'outline';
    downloadSvg(svg, `paint-by-numbers-${suffix}.svg`);
  };

  const handlePdfExport = (includeColor: boolean) => {
    const suffix = includeColor ? 'colored' : 'outline';
    downloadPdf(result, includeColor, `paint-by-numbers-${suffix}.pdf`);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">SVG</p>
      <button
        onClick={() => handleSvgExport(false)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        Export SVG (Outline)
      </button>
      <button
        onClick={() => handleSvgExport(true)}
        className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
      >
        Export SVG (Colored)
      </button>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-2">PDF (Print-Ready)</p>
      <button
        onClick={() => handlePdfExport(false)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        Export PDF (Outline)
      </button>
      <button
        onClick={() => handlePdfExport(true)}
        className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
      >
        Export PDF (Colored)
      </button>
    </div>
  );
}
