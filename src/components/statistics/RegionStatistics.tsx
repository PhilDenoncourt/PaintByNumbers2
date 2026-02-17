import { useAppStore } from '../../state/appStore';
import { calculateRegionStatistics } from '../../utils/statisticsCalculator';

export function RegionStatistics() {
  const result = useAppStore((s) => s.result);
  const paletteColorOrder = useAppStore((s) => s.paletteColorOrder);

  if (!result || !result.regions || result.regions.length === 0) {
    return null;
  }

  const stats = calculateRegionStatistics(result.regions);
  const palette = result.palette;

  // Apply color order if reordered
  const getDisplayColorIndex = (colorIndex: number): number => {
    if (!paletteColorOrder) return colorIndex;
    return paletteColorOrder.indexOf(colorIndex);
  };

  const getRgbStyle = (colorIndex: number) => {
    const [r, g, b] = palette[colorIndex];
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Region Statistics</h3>

      {/* Overall statistics */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Regions:</span>
          <span className="font-medium">{stats.totalRegions}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Region Size:</span>
          <span className="font-medium">{stats.averageRegionSize.toLocaleString()} px</span>
        </div>
        {stats.largestRegion && (
          <div className="flex justify-between">
            <span className="text-gray-600">Largest Region:</span>
            <span className="font-medium">{stats.largestRegion.pixelCount.toLocaleString()} px</span>
          </div>
        )}
        {stats.smallestRegion && (
          <div className="flex justify-between">
            <span className="text-gray-600">Smallest Region:</span>
            <span className="font-medium">{stats.smallestRegion.pixelCount.toLocaleString()} px</span>
          </div>
        )}
      </div>

      {/* Regions by color */}
      <div className="border-t border-gray-200 pt-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">By Color</h4>
        <div className="space-y-1">
          {stats.colorSizes.map(({ colorIndex, count, totalPixels }) => (
            <div
              key={colorIndex}
              className="flex items-center gap-2 text-xs p-1.5 rounded bg-gray-50 hover:bg-gray-100"
            >
              <div
                className="w-3 h-3 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: getRgbStyle(colorIndex) }}
                title={`Color ${getDisplayColorIndex(colorIndex)}`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-gray-700">
                  Color {getDisplayColorIndex(colorIndex)}: {count} region{count !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-gray-500 flex-shrink-0">
                {totalPixels.toLocaleString()} px
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
