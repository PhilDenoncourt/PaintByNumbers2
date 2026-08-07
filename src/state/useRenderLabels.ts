import { useMemo } from 'react';
import { useAppStore } from './appStore';
import { computeRenderLabels, type RenderLabel } from '../utils/labels';

/**
 * The numbers as they should actually be drawn: user overrides applied, `numberScale`
 * applied, anything under `numberMinSize` dropped. Every renderer and exporter reads this
 * so the canvas, the reveal overlay, paint mode, and the SVG/PNG/PDF output agree.
 */
export function useRenderLabels(): RenderLabel[] {
  const labels = useAppStore((s) => s.result?.labels);
  const numberScale = useAppStore((s) => s.settings.numberScale);
  const numberMinSize = useAppStore((s) => s.settings.numberMinSize);
  const numberFont = useAppStore((s) => s.settings.numberFont);
  const overrides = useAppStore((s) => s.labelOverrides);

  return useMemo(
    () =>
      labels
        ? computeRenderLabels(
            labels,
            { numberScale: numberScale ?? 1, numberMinSize: numberMinSize ?? 0, numberFont },
            overrides
          )
        : [],
    [labels, numberScale, numberMinSize, numberFont, overrides]
  );
}
