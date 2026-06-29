import { useTranslation } from 'react-i18next';

interface AmazonCtaProps {
  href: string;
  label: string;
  onClick?: () => void;
  /** `full` = the big money button; `pill` = the compact legend-bar variant. */
  variant?: 'full' | 'pill';
}

/**
 * The Amazon affiliate CTA — the site's revenue surface. Always opens the
 * selected paint set's `vendorUrl` in a new tab with `rel="noopener sponsored"`.
 */
export function AmazonCta({ href, label, onClick, variant = 'full' }: AmazonCtaProps) {
  if (variant === 'pill') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener sponsored"
        onClick={onClick}
        className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#0f1111] bg-[#ffd814] hover:bg-[#f7ca00] px-[11px] py-[5px] rounded-[7px] no-underline border border-[#f0c000] whitespace-nowrap"
      >
        🛒 {label} ↗
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored"
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full py-[13px] rounded-[11px] bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] text-[13.5px] font-bold no-underline border border-[#f0c000] shadow-[0_4px_12px_rgba(255,153,0,0.28)]"
    >
      <span className="text-[15px]">🛒</span> {label} ↗
    </a>
  );
}

export function AssociateDisclosure({ short = false }: { short?: boolean }) {
  const { t } = useTranslation();
  return (
    <p className="text-[10.5px] text-[#94a3b8] dark:text-gray-500 text-center mt-[9px] leading-[1.45]">
      {short ? t('affiliate.disclosureShort') : t('affiliate.disclosure')}
    </p>
  );
}

/** A row of equal-width swatches filled from `rgb()` color strings. */
export function SwatchRow({ colors, height = 22 }: { colors: string[]; height?: number }) {
  return (
    <div className="flex gap-1">
      {colors.map((c, i) => (
        <span
          key={i}
          className="flex-1 rounded-[5px] border border-black/[0.06]"
          style={{ height, background: c }}
        />
      ))}
    </div>
  );
}
