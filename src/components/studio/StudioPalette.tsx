import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { useStudioTokens } from './studioTokens';
import { lighten, rgbCss, textOn, type RGB } from './studioColor';

/** Above this many colors the big paint-drops give way to the dense spectrum + index (handoff 3a). */
const SPECTRUM_THRESHOLD = 24;

/**
 * The generated palette, Open Studio style. Small palettes render as tactile
 * paint drops (1c/2a); large palettes switch to a compact spectrum block plus a
 * scrollable numbered swatch index (3a). Tap a color to isolate its regions.
 */
export function StudioPalette({ colors }: { colors: RGB[] }) {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const selectedColor = useAppStore((s) => s.ui.selectedColor);
  const setSelectedColor = useAppStore((s) => s.setSelectedColor);

  if (colors.length === 0) return null;

  const toggle = (i: number) => setSelectedColor(selectedColor === i ? null : i);
  const large = colors.length > SPECTRUM_THRESHOLD;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-[10px]">
        <span
          className="font-display text-[12px] font-bold uppercase tracking-[0.06em]"
          style={{ color: tk.faint }}
        >
          {large
            ? t('studio.paletteCount', { count: colors.length, defaultValue: `Palette · ${colors.length} colors` })
            : t('studio.paletteDrops', { count: colors.length, defaultValue: `Your palette · ${colors.length} drops` })}
        </span>
        <span className="font-serif-studio italic text-[11px]" style={{ color: tk.muted }}>
          {t('studio.tapToIsolate', { defaultValue: 'tap to isolate' })}
        </span>
      </div>

      {large ? (
        /* Spectrum at a glance */
        <div
          className="grid gap-[2px] p-[5px] rounded-[10px] mb-3"
          style={{ gridTemplateColumns: 'repeat(20, 1fr)', background: tk.spectrumBg }}
        >
          {colors.map((c, i) => (
            <button
              key={i}
              title={String(i + 1)}
              onClick={() => toggle(i)}
              className="h-[13px] rounded-[2px] transition-transform hover:scale-110"
              style={{
                background: rgbCss(c),
                outline: selectedColor === i ? '2px solid #ffd814' : 'none',
                outlineOffset: '1px',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-x-2 gap-y-[13px]" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {colors.map((c, i) => (
            <div key={i} className="flex flex-col items-center">
              <button
                onClick={() => toggle(i)}
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-display text-[13px] font-bold transition-transform hover:scale-105"
                style={{
                  background: `radial-gradient(circle at 34% 30%, ${lighten(c, 0.4)}, ${rgbCss(c)})`,
                  color: textOn(c),
                  boxShadow: `${tk.dropShadow}, 0 0 0 1px ${tk.dropRing}`,
                  outline: selectedColor === i ? '2px solid #ffd814' : 'none',
                  outlineOffset: '2px',
                }}
                title={t('studio.tapToIsolate', { defaultValue: 'tap to isolate' })}
              >
                {i + 1}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
