import { useAppStore } from '../../state/appStore';
import { generateSvg, downloadSvg } from '../../export/svgExporter';

export function ExportButton() {
  const result = useAppStore((s) => s.result);

  if (!result) return null;

  const handleExport = (includeColor: boolean) => {
    const svg = generateSvg(result, includeColor);
    const suffix = includeColor ? 'colored' : 'outline';
    downloadSvg(svg, `paint-by-numbers-${suffix}.svg`);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => handleExport(false)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        Export SVG (Outline)
      </button>
      <button
        onClick={() => handleExport(true)}
        className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
      >
        Export SVG (Colored)
      </button>
    </div>
  );
}
