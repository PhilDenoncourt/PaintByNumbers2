import { useTranslation } from 'react-i18next';
import { palettesForBrand } from '../../data/paletteRegistry';
import { useAffiliatePreset } from '../../hooks/useAffiliatePreset';
import { AmazonCta, SwatchRow } from './AmazonCta';

/**
 * "Match a real paint set" — the featured affiliate surface on the Palette tab.
 * Selecting a brand/set updates `settings.presetPaletteId`, which every Amazon
 * CTA across the app reads from.
 */
export function AffiliatePaletteHero() {
  const { t } = useTranslation();
  const { preset, brand, setLabel, buyUrl, swatches, brands, selectBrand, selectSet, trackClick } =
    useAffiliatePreset();

  const setsForBrand = palettesForBrand(brand);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
      {/* Warm header strip */}
      <div className="flex items-center gap-[9px] px-[15px] py-[13px] bg-gradient-to-br from-[#fff7ed] to-[#fffbeb] dark:from-amber-950/40 dark:to-amber-900/20 border-b border-[#fde9c8] dark:border-amber-900/40">
        <span className="text-base">🎨</span>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-[#0f172a] dark:text-amber-50">
            {t('affiliate.heroTitle')}
          </div>
          <div className="text-[11.5px] text-[#92703a] dark:text-amber-200/80">
            {t('affiliate.heroSubtitle')}
          </div>
        </div>
      </div>

      <div className="p-[15px] bg-white dark:bg-gray-800">
        {/* Brand chips */}
        <div className="flex flex-wrap gap-[7px] mb-[13px]">
          {brands.map((b) => {
            const active = b === brand;
            return (
              <button
                key={b}
                onClick={() => selectBrand(b)}
                className={`px-3 py-[7px] rounded-full text-xs font-semibold whitespace-nowrap border-[1.5px] transition-colors ${
                  active
                    ? 'border-[#2563eb] bg-[#eff6ff] dark:bg-blue-500/15 text-[#1e3a8a] dark:text-blue-200'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#64748b] dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>

        {/* Set rows */}
        <div className="text-[11px] font-bold text-[#94a3b8] dark:text-gray-500 uppercase tracking-[0.05em] mb-[7px]">
          {brand} {preset.medium}
        </div>
        <div className="flex flex-col gap-1.5 mb-[14px]">
          {setsForBrand.map((s) => {
            const active = s.id === preset.id;
            return (
              <button
                key={s.id}
                onClick={() => selectSet(s.id)}
                className={`flex items-center justify-between px-3 py-[9px] rounded-[10px] border-[1.5px] transition-colors ${
                  active
                    ? 'border-[#2563eb] bg-[#eff6ff] dark:bg-blue-500/15'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span
                  className={`text-[12.5px] font-semibold ${
                    active ? 'text-[#1e3a8a] dark:text-blue-200' : 'text-[#334155] dark:text-gray-200'
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    active ? 'text-[#3b82f6] dark:text-blue-300' : 'text-[#94a3b8] dark:text-gray-500'
                  }`}
                >
                  {t('affiliate.colorCount', { count: s.size })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Swatch preview */}
        <div className="mb-[14px]">
          <SwatchRow colors={swatches} height={22} />
        </div>

        {/* Amazon CTA */}
        <AmazonCta
          href={buyUrl}
          onClick={trackClick}
          label={t('affiliate.buyOnAmazon', { set: setLabel })}
        />
      </div>
    </div>
  );
}
