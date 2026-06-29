import { useTranslation } from 'react-i18next';
import { useAffiliatePreset } from '../../hooks/useAffiliatePreset';
import { AmazonCta, AssociateDisclosure, SwatchRow } from './AmazonCta';

/**
 * "Ready to start painting?" — the second affiliate surface, shown on the
 * Export tab. Reads the same selected-preset state as the palette hero.
 */
export function AffiliateExportHero() {
  const { t } = useTranslation();
  const { setLabel, buyUrl, swatches, trackClick } = useAffiliatePreset();

  return (
    <div className="rounded-2xl overflow-hidden border border-[#fde9c8] dark:border-amber-900/40 bg-gradient-to-br from-[#fff7ed] to-[#fffbeb] dark:from-amber-950/40 dark:to-amber-900/20 shadow-[0_6px_20px_rgba(255,153,0,0.12)]">
      <div className="p-[15px]">
        <div className="text-[14px] font-bold text-[#0f172a] dark:text-amber-50 mb-[3px]">
          {t('affiliate.exportHeroTitle')}
        </div>
        <div className="text-xs text-[#92703a] dark:text-amber-200/80 leading-[1.45] mb-3">
          {t('affiliate.exportHeroBody', { set: setLabel })}
        </div>
        <div className="mb-[13px]">
          <SwatchRow colors={swatches} height={18} />
        </div>
        <AmazonCta
          href={buyUrl}
          onClick={trackClick}
          label={t('affiliate.buyOnAmazon', { set: setLabel })}
        />
        <AssociateDisclosure short />
      </div>
    </div>
  );
}
