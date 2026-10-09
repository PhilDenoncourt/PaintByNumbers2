import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsEnabled } from '../../utils/analytics';
import { useProjectMessage } from '../../projects/projectMessages';
import { getAdSenseConfig } from '../../utils/adsense';

export function PrivacyFooter() {
  const { t } = useTranslation();
  const projectMessage = useProjectMessage();
  const [expanded, setExpanded] = useState(false);
  const adsEnabled = getAdSenseConfig() !== null;

  return (
    <footer className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 text-xs text-gray-400 dark:text-gray-500">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>{t('privacy.imagesBody')}</span>
        <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">
          {t('privacy.policyLink')}
        </a>
        <a href="/paint-by-numbers-generator-no-upload" className="underline hover:text-gray-600 dark:hover:text-gray-300">
          {t('welcome.guideNoUploadTitle')}
        </a>
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
          {analyticsEnabled ? (
            <p>
              <strong className="text-gray-600 dark:text-gray-300">{t('privacy.dataUsageTitle')}</strong>{' '}
              {t('privacy.analyticsBody', {
                defaultValue:
                  'This application uses Google Analytics to measure usage (for example page views, processing runs, and export actions). Uploaded images are still processed locally in your browser and are not sent to our server.',
              })}
            </p>
          ) : null}
          {adsEnabled && (
            <p>
              <strong className="text-gray-600 dark:text-gray-300">{t('privacy.adsTitle')}</strong>{' '}
              {t('privacy.adsBody')}{' '}
              <a href="https://policies.google.com/technologies/ads" className="underline">
                {t('privacy.googleAdsLink')}
              </a>
            </p>
          )}
          <p>
            <strong className="text-gray-600 dark:text-gray-300">{t('privacy.localStorageTitle')}</strong>{' '}
            {projectMessage('deviceNotice')}
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
