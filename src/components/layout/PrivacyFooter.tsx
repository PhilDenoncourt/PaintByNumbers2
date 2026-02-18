import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function PrivacyFooter() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <footer className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 text-xs text-gray-400 dark:text-gray-500">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>{t('privacy.tagline')}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
          aria-expanded={expanded}
        >
          {expanded ? t('privacy.seeLess') : t('privacy.learnMore')}
        </button>
          <span className="ml-auto text-gray-300 dark:text-gray-600">
          &copy; {new Date().getFullYear()} {t('privacy.author')}
        </span>
      </div>

      {expanded && (
        <div className="mt-2 pb-1 space-y-1 text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
          <p>
            <strong className="text-gray-600 dark:text-gray-300">{t('privacy.noDataTitle')}</strong>{' '}
            {t('privacy.noDataBody')}
          </p>
          <p>
            <strong className="text-gray-600 dark:text-gray-300">{t('privacy.localStorageTitle')}</strong>{' '}
            {t('privacy.localStorageBody')}
          </p>
          <p>
            <strong className="text-gray-600 dark:text-gray-300">{t('privacy.imagesTitle')}</strong>{' '}
            {t('privacy.imagesBody')}
          </p>
          <p>
            <strong className="text-gray-600 dark:text-gray-300">{t('privacy.copyrightTitle')}</strong>{' '}
            {t('privacy.copyrightBody')}
          </p>
        </div>
      )}
    </footer>
  );
}
