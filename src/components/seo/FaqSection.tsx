import { useTranslation } from 'react-i18next';

/**
 * Visible FAQ shown on the welcome screen. Kept in the rendered React tree (not
 * just the static prerender) so it matches the FAQPage structured data in
 * index.html — a requirement for FAQ rich-result eligibility.
 */
export function FaqSection() {
  const { t } = useTranslation();

  const items = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }));

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('faq.title')}</h3>
      <dl className="space-y-3">
        {items.map(({ q, a }) => (
          <div key={q}>
            <dt className="text-xs font-semibold text-gray-700 dark:text-gray-200">{q}</dt>
            <dd className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
