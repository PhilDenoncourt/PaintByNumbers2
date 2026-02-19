import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { rgbToHex } from '../../algorithms/colorUtils';
import { crayolaPalettes } from '../../data/crayolaPalettes';

export function CompactPaletteLegend() {
  const { t } = useTranslation();
  const result = useAppStore((s) => s.result);
  const selectedColor = useAppStore((s) => s.ui.selectedColor);
  const hoveredRegion = useAppStore((s) => s.ui.hoveredRegion);
  const setSelectedColor = useAppStore((s) => s.setSelectedColor);
  const paletteColorOrder = useAppStore((s) => s.paletteColorOrder);
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);

  if (!result) return null;

  const displayIndices = paletteColorOrder || Array.from({ length: result.palette.length }, (_, i) => i);
  const palette = result.palette;

  const presetColors = (() => {
    if (!presetPaletteId) return null;
    const preset = crayolaPalettes.find((p) => `crayola-${p.size}` === presetPaletteId);
    return preset?.colors ?? null;
  })();

  let hoveredColorIndex: number | null = null;
  if (hoveredRegion !== null) {
    const label = result.labels.find((l) => l.regionId === hoveredRegion);
    if (label) hoveredColorIndex = label.colorIndex;
  }

  const regionsPerColor = new Map<number, number>();
  for (const label of result.labels) {
    regionsPerColor.set(label.colorIndex, (regionsPerColor.get(label.colorIndex) || 0) + 1);
  }

  return (
    <div className="bg-white border-t border-gray-200 px-3 py-2">
      <div className="text-xs font-medium text-gray-500 mb-1.5">
        {t('palette.title')} ({result.palette.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayIndices.map((colorIdx) => {
          const color = palette[colorIdx];
          const [r, g, b] = color;
          const hex = rgbToHex(r, g, b);
          const isSelected = selectedColor === colorIdx;
          const isHovered = hoveredColorIndex === colorIdx;
          const isDimmed =
            (selectedColor !== null && !isSelected) ||
            (hoveredColorIndex !== null && !isHovered);

          let crayonName: string | null = null;
          if (presetColors) {
            const match = presetColors.find(
              (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
            );
            if (match) crayonName = match.name;
          }

          const label = crayonName ?? hex;
          const regionCount = regionsPerColor.get(colorIdx) || 0;

          return (
            <button
              key={colorIdx}
              title={`${colorIdx + 1}: ${label} (${regionCount} ${t('palette.regions', { defaultValue: 'regions' })})`}
              onClick={() => setSelectedColor(isSelected ? null : colorIdx)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-400'
                  : isHovered
                  ? 'bg-yellow-50 border-yellow-400'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
            >
              <div
                className="w-4 h-4 rounded-sm border border-gray-300 shrink-0"
                style={{ backgroundColor: `rgb(${r},${g},${b})` }}
              />
              <span className="font-mono text-gray-600 font-medium">{colorIdx + 1}</span>
              <span className="text-gray-400 hidden sm:inline" style={{ maxWidth: '6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
