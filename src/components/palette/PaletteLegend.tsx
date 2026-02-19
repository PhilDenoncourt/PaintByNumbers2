import { useState } from 'react';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { rgbToHex } from '../../algorithms/colorUtils';
import { findPresetPalette } from '../../data/paletteRegistry';

export function PaletteLegend() {
  const { t } = useTranslation();
  const [draggedFrom, setDraggedFrom] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);

  const result = useAppStore((s) => s.result);
  const selectedColor = useAppStore((s) => s.ui.selectedColor);
  const hoveredRegion = useAppStore((s) => s.ui.hoveredRegion);
  const setSelectedColor = useAppStore((s) => s.setSelectedColor);
  const reorderPalette = useAppStore((s) => s.reorderPalette);
  const paletteColorOrder = useAppStore((s) => s.paletteColorOrder);
  const presetPaletteId = useAppStore((s) => s.settings.presetPaletteId);

  if (!result) return null;

  // Apply color order if exists
  const displayIndices = paletteColorOrder || Array.from({ length: result.palette.length }, (_, i) => i);
  const palette = result.palette;

  // Resolve preset palette for colour names
  const presetColors = presetPaletteId ? (findPresetPalette(presetPaletteId)?.colors ?? null) : null;

  // Find which color is hovered via region
  let hoveredColorIndex: number | null = null;
  if (hoveredRegion !== null) {
    const label = result.labels.find((l) => l.regionId === hoveredRegion);
    if (label) hoveredColorIndex = label.colorIndex;
  }

  const handleDragStart = (idx: number, e: React.DragEvent) => {
    setDraggedFrom(idx);
    // Set data for dragging color to regions
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-color-index', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedFrom !== null && draggedFrom !== idx) {
      reorderPalette(draggedFrom, idx);
    }
    setDraggedFrom(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedFrom(null);
    setDraggedOver(null);
  };

  // Count regions per color
  const regionsPerColor = new Map<number, number>();
  for (const label of result.labels) {
    regionsPerColor.set(label.colorIndex, (regionsPerColor.get(label.colorIndex) || 0) + 1);
  }

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        {t('palette.title')} ({result.palette.length})
      </h3>
      <div className="text-xs text-gray-400 mb-1">
        {t('palette.dragToReorder')}
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {displayIndices.map((colorIdx, displayOrder) => {
          const color = palette[colorIdx];
          const [r, g, b] = color;
          const hex = rgbToHex(r, g, b);
          const isSelected = selectedColor === colorIdx;
          const isHovered = hoveredColorIndex === colorIdx;
          const isDimmed =
            (selectedColor !== null && !isSelected) ||
            (hoveredColorIndex !== null && !isHovered);
          const regionCount = regionsPerColor.get(colorIdx) || 0;

          // Look up crayon name by matching the RGB value
          let crayonName: string | null = null;
          if (presetColors) {
            const match = presetColors.find(
              (c) => c.rgb[0] === r && c.rgb[1] === g && c.rgb[2] === b
            );
            if (match) crayonName = match.name;
          }

          return (
            <div
              key={colorIdx}
              draggable
              onDragStart={(e) => handleDragStart(displayOrder, e)}
              onDragOver={(e) => handleDragOver(e, displayOrder)}
              onDrop={(e) => handleDrop(e, displayOrder)}
              onDragEnd={handleDragEnd}
              title={t('palette.dragTip')}
              className={`flex items-center gap-2 w-full px-2 py-1 rounded text-sm transition-all cursor-move ${
                draggedFrom === displayOrder
                  ? 'opacity-50 bg-gray-200'
                  : draggedOver === displayOrder
                    ? 'bg-blue-100 ring-1 ring-blue-400'
                    : isSelected
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : isHovered
                        ? 'bg-yellow-50 ring-1 ring-yellow-400'
                        : 'hover:bg-gray-100'
              } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              onClick={() => setSelectedColor(isSelected ? null : colorIdx)}
            >
              <div
                className="w-5 h-5 rounded border border-gray-300 shrink-0"
                style={{ backgroundColor: `rgb(${r},${g},${b})` }}
              />
              <span className="font-mono text-gray-700 w-5 text-right">{colorIdx + 1}</span>
              <span className="text-gray-400 text-xs truncate flex-1">
                {crayonName ?? hex}
              </span>
              <span className="text-gray-400 text-xs shrink-0">
                ({regionCount})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
