import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

const ExportButton = lazy(async () => {
  const module = await import('./ExportButton');
  return { default: module.ExportButton };
});

export function LazyExportPanel() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-500 dark:text-gray-400">
          {t('processing.processing')}
        </div>
      }
    >
      <ExportButton />
    </Suspense>
  );
}
