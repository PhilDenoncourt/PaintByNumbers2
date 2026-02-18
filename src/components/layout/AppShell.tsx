import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { ImageUploader } from '../upload/ImageUploader';
import { Sidebar } from './Sidebar';
import { ProcessingProgress } from '../progress/ProcessingProgress';
import { SideBySideView } from '../preview/SideBySideView';
import { PreprocessedImagePreview } from '../preview/PreprocessedImagePreview';
import { ErrorBoundary } from './ErrorBoundary';
import { PrivacyFooter } from './PrivacyFooter';

export function AppShell() {
  const { t } = useTranslation();
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const sourceImageUrl = useAppStore((s) => s.sourceImageUrl);
  const result = useAppStore((s) => s.result);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const processedWidth = useAppStore((s) => s.processedWidth);
  const processedHeight = useAppStore((s) => s.processedHeight);
  const regionCount = result?.regions.length ?? 0;
  const hoveredRegion = useAppStore((s) => s.ui.hoveredRegion);
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const setMergeMode = useAppStore((s) => s.setMergeMode);
  const darkMode = useAppStore((s) => s.ui.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  // Sync dark class on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Follow system preference changes when the user hasn't pinned a choice
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('darkMode') === null) {
        useAppStore.setState((s) => ({ ui: { ...s.ui, darkMode: e.matches } }));
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keyboard shortcuts for merge/split modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (mergeMode === 'merge') {
          setMergeMode('browse');
        } else {
          setMergeMode('merge');
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (mergeMode === 'split') {
          setMergeMode('browse');
        } else {
          setMergeMode('split');
        }
      } else if (e.key === 'Escape') {
        setMergeMode('browse');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mergeMode, setMergeMode]);

  // Find hovered region info for tooltip
  let tooltipText = '';
  if (hoveredRegion !== null && result) {
    const label = result.labels.find((l) => l.regionId === hoveredRegion);
    if (label) {
      const [r, g, b] = result.palette[label.colorIndex];
      tooltipText = `Color #${label.colorIndex + 1} (${r}, ${g}, ${b})`;
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('header.title')}</h1>
          {result && (
            <span className="text-xs text-gray-400 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {processedWidth}x{processedHeight} &middot; {regionCount} {t('header.regions')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {tooltipText && (
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
              {tooltipText}
            </div>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? t('header.lightMode', 'Switch to light mode') : t('header.darkMode', 'Switch to dark mode')}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        <ErrorBoundary fallback={
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
            <div className="text-sm text-red-600 dark:text-red-400 text-center">
              <p className="font-medium">{t('sidebar.controlsUnavailable')}</p>
              <p className="text-xs mt-1">{t('sidebar.tryRefreshing')}</p>
            </div>
          </div>
        }>
          <Sidebar />
        </ErrorBoundary>

        <main className="flex-1 flex flex-col min-h-0 p-4">
          {!sourceImageData && (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-lg w-full">
                <ErrorBoundary fallback={
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.failedToLoadUploader')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('errors.refreshPage')}</p>
                  </div>
                }>
                  <ImageUploader />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {sourceImageData && pipelineStatus === 'idle' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ErrorBoundary fallback={
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.previewUnavailable')}</p>
                  </div>
                }>
                  <PreprocessedImagePreview />
                </ErrorBoundary>
                {sourceImageUrl && (
                  <img
                    src={sourceImageUrl}
                    alt="Uploaded"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md mx-auto mb-4"
                  />
                )}
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('sidebar.adjustSettings')}
                </p>
              </div>
            </div>
          )}

          {pipelineStatus === 'running' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-80">
                <ErrorBoundary fallback={
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Processing...</p>
                  </div>
                }>
                  <ProcessingProgress />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {pipelineStatus === 'error' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-red-600 dark:text-red-400">
                <p className="font-medium">{t('sidebar.processingFailed')}</p>
                <p className="text-sm mt-1">{useAppStore.getState().pipeline.error}</p>
              </div>
            </div>
          )}

          {result && pipelineStatus === 'complete' && (
            <ErrorBoundary fallback={
              <div className="flex items-center justify-center h-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                  <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.failedToDisplay')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('sidebar.tryRegenerate')}</p>
                </div>
              </div>
            }>
              <SideBySideView />
            </ErrorBoundary>
          )}
        </main>
      </div>
      <PrivacyFooter />
    </div>
  );
}
