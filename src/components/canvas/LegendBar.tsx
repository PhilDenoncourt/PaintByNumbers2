import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { CompactPaletteLegend } from '../palette/CompactPaletteLegend';
import { AmazonCta } from '../affiliate/AmazonCta';
import { useAffiliatePreset } from '../../hooks/useAffiliatePreset';

/**
 * Legend bar beneath the preview — color chips plus the third affiliate CTA
 * ("Get these in {set}"), so the buy link is reachable right next to the
 * generated colors.
 */
export function LegendBar() {
  const { t } = useTranslation();
  const result = useAppStore((s) => s.result);
  const { setLabel, buyUrl, trackClick } = useAffiliatePreset();

  if (!result) return null;

  return (
    <div className="shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[14px] px-[14px] py-[11px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-[#334155] dark:text-gray-200">
          {t('panels.canvas.colors')}{' '}
          <span className="text-[#94a3b8] dark:text-gray-500 font-medium">
            · {t('panels.canvas.tapToIsolate')}
          </span>
        </span>
        <AmazonCta
          variant="pill"
          href={buyUrl}
          onClick={trackClick}
          label={t('affiliate.getTheseIn', { set: setLabel })}
        />
      </div>
      <CompactPaletteLegend bare />
    </div>
  );
}
