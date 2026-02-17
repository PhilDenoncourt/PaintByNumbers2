import { useAppStore } from '../../state/appStore';
import { rgbToHex } from '../../algorithms/colorUtils';
import { crayolaPalettes } from '../../data/crayolaPalettes';

export function PaletteLegend() {
  const result = useAppStore((s) => s.result);
  const selectedColor = useAppStore((s) => s.ui.selectedColor);
  const hoveredRegion = useAppStore((s) => s.ui.hoveredRegion);
  const setSelectedColor = useAppStore((s) => s.setSelectedColor);
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);

  if (!result) return null;

  // Resolve preset palette for crayon names
  const presetColors = (() => {
    if (!presetPaletteId) return null;
    const preset = crayolaPalettes.find(
      (p) => `crayola-${p.size}` === presetPaletteId
    );
    return preset?.colors ?? null;
  })();

  // Find which color is hovered via region
  let hoveredColorIndex: number | null = null;
  if (hoveredRegion !== null) {
    const label = result.labels.find((l) => l.regionId === hoveredRegion);
    if (label) hoveredColorIndex = label.colorIndex;
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Colors ({result.palette.length})
      </h3>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {result.palette.map((color, idx) => {
          const [r, g, b] = color;
          const hex = rgbToHex(r, g, b);
          const isSelected = selectedColor === idx;
          const isHovered = hoveredColorIndex === idx;
          const isDimmed =
            (selectedColor !== null && !isSelected) ||
            (hoveredColorIndex !== null && !isHovered);

          // Look up crayon name by matching the RGB value
          let crayonName: string | null = null;
          if (presetColors) {
            const match = presetColors.find(
              (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
            );
            if (match) crayonName = match.name;
          }

          return (
            <button
              key={idx}
              className={`flex items-center gap-2 w-full px-2 py-1 rounded text-sm transition-all ${
                isSelected
                  ? 'bg-blue-100 ring-2 ring-blue-500'
                  : isHovered
                    ? 'bg-yellow-50 ring-1 ring-yellow-400'
                    : 'hover:bg-gray-100'
              } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              onClick={() => setSelectedColor(isSelected ? null : idx)}
            >
              <div
                className="w-5 h-5 rounded border border-gray-300 shrink-0"
                style={{ backgroundColor: `rgb(${r},${g},${b})` }}
              />
              <span className="font-mono text-gray-700 w-5 text-right">{idx + 1}</span>
              <span className="text-gray-400 text-xs truncate">
                {crayonName ?? hex}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
