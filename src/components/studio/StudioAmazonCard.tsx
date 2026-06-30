import { useTranslation } from 'react-i18next';
import { palettesForBrand } from '../../data/paletteRegistry';
import { useAffiliatePreset } from '../../hooks/useAffiliatePreset';
import { useStudioTokens, AMAZON_YELLOW } from './studioTokens';

/**
 * "Match a real paint set" — the warm Amazon affiliate card (handoff 1c/2a/3a).
 * Brand chips + set selector drive `settings.presetPaletteId`, which every CTA
 * across the app links from. When the template needs more colors than a small
 * boxed set can cover, it surfaces the 3a "we matched a larger set" note.
 */
export function StudioAmazonCard({ bigSetNote = false }: { bigSetNote?: boolean }) {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const { preset, brand, setLabel, buyUrl, swatches, brands, selectBrand, selectSet, trackClick } =
    useAffiliatePreset();
  const setsForBrand = palettesForBrand(brand);

  return (
    <div
      className="rounded-[20px] p-[18px]"
      style={{ background: tk.amazonCardBg, border: `1px solid ${tk.amazonCardBorder}` }}
    >
      {/* Featured set header */}
      <div className="flex items-center gap-[10px] mb-3">
        <span className="text-[22px]">{preset.size > 48 ? '🖍' : '🎨'}</span>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-bold truncate" style={{ color: tk.text }}>
            {setLabel}
          </div>
          <div className="text-[12px]" style={{ color: tk.amazonSubFg }}>
            {t('studio.everyNumberMaps', {
              defaultValue: 'Every number maps to a real color',
            })}
          </div>
        </div>
      </div>

      {/* Brand chips */}
      <div className="flex flex-wrap gap-[6px] mb-[10px]">
        {brands.map((b) => {
          const active = b === brand;
          return (
            <button
              key={b}
              onClick={() => selectBrand(b)}
              className="px-[11px] py-[5px] rounded-full font-display text-[11px] font-semibold transition-colors"
              style={
                active
                  ? { background: tk.text, color: tk.cardBg }
                  : { background: 'transparent', color: tk.muted, border: `1px solid ${tk.amazonCardBorder}` }
              }
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* Set selector */}
      <div className="flex flex-col gap-[5px] mb-[13px]">
        {setsForBrand.map((s) => {
          const active = s.id === preset.id;
          return (
            <button
              key={s.id}
              onClick={() => selectSet(s.id)}
              className="flex items-center justify-between px-[11px] py-[8px] rounded-[10px] transition-colors text-left"
              style={{
                background: active ? 'rgba(255,216,20,.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(255,216,20,.4)' : tk.amazonCardBorder}`,
              }}
            >
              <span className="text-[12.5px] font-semibold" style={{ color: tk.text }}>
                {s.label}
              </span>
              <span className="text-[11px] font-medium tabular-nums" style={{ color: tk.muted }}>
                {t('affiliate.colorCount', { count: s.size })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Swatch preview */}
      <div className="flex gap-[3px] mb-[14px]">
        {swatches.map((c, i) => (
          <span key={i} className="flex-1 h-[22px] rounded-[5px]" style={{ background: c }} />
        ))}
      </div>

      {/* "Needs a bigger set" note (3a) */}
      {bigSetNote && (
        <div
          className="flex items-center gap-2 mb-[13px] px-[11px] py-2 rounded-[10px]"
          style={{ background: tk.noteBg, border: `1px solid ${tk.noteBorder}` }}
        >
          <span className="text-[13px]">💡</span>
          <span className="font-serif-studio text-[11.5px] leading-[1.4]" style={{ color: tk.noteFg }}>
            {t('studio.biggerSetNote', {
              defaultValue:
                'A large palette needs more than a small boxed set — we matched a wider set for you.',
            })}
          </span>
        </div>
      )}

      <a
        href={buyUrl}
        target="_blank"
        rel="noopener sponsored"
        onClick={trackClick}
        className="flex items-center justify-center gap-2 w-full py-[14px] rounded-[14px] no-underline font-display text-[14px] font-bold"
        style={{ background: AMAZON_YELLOW, color: '#0f1111', boxShadow: '0 8px 20px -6px rgba(255,216,20,.55)' }}
      >
        🛒 {t('affiliate.buyOnAmazonShort', { defaultValue: 'Buy on Amazon' })} ↗
      </a>
      <p className="mt-[9px] text-[11px] text-center leading-[1.45]" style={{ color: tk.faint }}>
        {t('affiliate.disclosure')}
      </p>
    </div>
  );
}
