import { useTranslation } from 'react-i18next';
import { useStudioTokens } from '../studio/studioTokens';

/**
 * Plain-language definition of paint by numbers plus a quick-facts spec table.
 *
 * Two jobs:
 *  1. AI assistants are the site's largest acquisition channel, and they quote
 *     short factual blocks. This is the block written to be quoted — it mirrors
 *     the "Quick facts" section of /llms.txt.
 *  2. It publishes the specs competitors publish and this site did not: the
 *     colour-count range and the supported paper sizes.
 */
export function AboutSection() {
  const { t } = useTranslation();
  const tk = useStudioTokens();

  const facts = [
    { label: t('about.factPriceLabel'), value: t('about.factPriceValue') },
    { label: t('about.factColorsLabel'), value: t('about.factColorsValue') },
    { label: t('about.factPaperLabel'), value: t('about.factPaperValue') },
    { label: t('about.factExportsLabel'), value: t('about.factExportsValue') },
    { label: t('about.factRegionsLabel'), value: t('about.factRegionsValue') },
    { label: t('about.factProcessingLabel'), value: t('about.factProcessingValue') },
  ];

  return (
    <section
      className="rounded-[16px] p-5"
      style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, boxShadow: tk.dropShadow }}
    >
      <h2 className="font-display text-sm font-bold mb-2" style={{ color: tk.text }}>
        {t('about.title')}
      </h2>
      <p className="text-xs leading-relaxed mb-2" style={{ color: tk.muted }}>
        {t('about.definition')}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: tk.muted }}>
        {t('about.generatorDefinition')}
      </p>

      <h3 className="font-display text-sm font-bold mt-4 mb-2" style={{ color: tk.text }}>
        {t('about.quickFactsTitle')}
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
        {facts.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="text-xs font-semibold" style={{ color: tk.text }}>
              {label}
            </dt>
            <dd className="text-xs leading-relaxed" style={{ color: tk.muted }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
