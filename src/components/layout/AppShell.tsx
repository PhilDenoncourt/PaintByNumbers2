import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { ImageUploader } from '../upload/ImageUploader';
import { IconRail } from './IconRail';
import { ContextPanel } from './ContextPanel';
import { CanvasArea } from '../canvas/CanvasArea';
import { ProcessingProgress } from '../progress/ProcessingProgress';
import { PreprocessedImagePreview } from '../preview/PreprocessedImagePreview';
import { ErrorBoundary } from './ErrorBoundary';
import { PrivacyFooter } from './PrivacyFooter';
import { FaqSection } from '../seo/FaqSection';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        setMergeMode(mergeMode === 'merge' ? 'browse' : 'merge');
      } else if (e.key === 's' || e.key === 'S') {
        setMergeMode(mergeMode === 'split' ? 'browse' : 'split');
      } else if (e.key === 'Escape') {
        setMergeMode('browse');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mergeMode, setMergeMode]);

  // Resolve the hovered region's color for the header readout pill
  let readoutColor: string | null = null;
  let readoutText = '';
  if (hoveredRegion !== null && result) {
    const label = result.labels.find((l) => l.regionId === hoveredRegion);
    if (label) {
      const [r, g, b] = result.palette[label.colorIndex];
      readoutColor = `rgb(${r},${g},${b})`;
      readoutText = `${t('header.color')} ${label.colorIndex + 1} · rgb(${r}, ${g}, ${b})`;
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f1f5f9] dark:bg-gray-900 text-[#0f172a] dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-5 h-[60px] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-[14px]">
          {sourceImageData && (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('sidebar.openSettings')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-[9px]">
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[#2563eb] to-[#16a34a] flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <h1 className="text-base font-bold text-[#0f172a] dark:text-gray-100 -tracking-[0.01em]">
              {t('header.title')}
            </h1>
          </div>
          {result && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#64748b] dark:text-gray-400 bg-[#f1f5f9] dark:bg-gray-700 px-2.5 py-[5px] rounded-[7px] font-medium">
              <span className="w-[7px] h-[7px] rounded-full bg-[#16a34a]" />
              {processedWidth} × {processedHeight} · {regionCount} {t('header.regions')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {readoutColor && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#475569] dark:text-gray-300 bg-[#f1f5f9] dark:bg-gray-700 px-[11px] py-[5px] rounded-[7px] font-medium">
              <span
                className="w-[14px] h-[14px] rounded border border-gray-300 dark:border-gray-500"
                style={{ background: readoutColor }}
              />
              {readoutText}
            </div>
          )}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 px-[11px] py-[7px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#475569] dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? t('header.lightMode') : t('header.darkMode')}
            aria-label={darkMode ? t('header.lightMode') : t('header.darkMode')}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0 relative">
        {sourceImageData && (
          <>
            {/* Mobile backdrop */}
            {mobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
            )}

            {/* Rail + contextual panel — drawer on mobile, static on desktop */}
            <div
              className={`absolute inset-y-0 left-0 z-40 h-full flex md:relative md:inset-auto md:z-auto transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
                mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}
            >
              <ErrorBoundary
                fallback={
                  <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
                    <div className="text-sm text-red-600 dark:text-red-400 text-center">
                      <p className="font-medium">{t('sidebar.controlsUnavailable')}</p>
                      <p className="text-xs mt-1">{t('sidebar.tryRefreshing')}</p>
                    </div>
                  </div>
                }
              >
                <IconRail />
                <ContextPanel onClose={() => setMobileSidebarOpen(false)} />
              </ErrorBoundary>
            </div>
          </>
        )}

        <main className="flex-1 flex flex-col min-h-0">
          {!sourceImageData && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">
                <ErrorBoundary
                  fallback={
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.failedToLoadUploader')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('errors.refreshPage')}</p>
                    </div>
                  }
                >
                  <ImageUploader />
                </ErrorBoundary>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                    {t('welcome.tagline')}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {t('welcome.description')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([
                    { title: t('welcome.feature1Title'), body: t('welcome.feature1Body'), icon: '🎨' },
                    { title: t('welcome.feature2Title'), body: t('welcome.feature2Body'), icon: '🖍️' },
                    { title: t('welcome.feature3Title'), body: t('welcome.feature3Body'), icon: '✏️' },
                    { title: t('welcome.feature4Title'), body: t('welcome.feature4Body'), icon: '📄' },
                  ] as const).map(({ title, body, icon }) => (
                    <div
                      key={title}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    {t('welcome.howToBegin')}
                  </h3>
                  <ol className="space-y-2">
                    {[t('welcome.step1'), t('welcome.step2'), t('welcome.step3'), t('welcome.step4')].map((step, i) => (
                      <li key={i} className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-semibold text-xs">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <FaqSection />
              </div>
            </div>
          )}

          {sourceImageData && pipelineStatus === 'idle' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <ErrorBoundary
                  fallback={
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.previewUnavailable')}</p>
                    </div>
                  }
                >
                  <PreprocessedImagePreview />
                </ErrorBoundary>
                {sourceImageUrl && (
                  <img
                    src={sourceImageUrl}
                    alt="Uploaded"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md mx-auto mb-4"
                  />
                )}
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('sidebar.adjustSettings')}</p>
              </div>
            </div>
          )}

          {pipelineStatus === 'running' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-80">
                <ErrorBoundary
                  fallback={
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <p className="text-gray-600 dark:text-gray-300 font-medium">{t('processing.processing')}</p>
                    </div>
                  }
                >
                  <ProcessingProgress />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {pipelineStatus === 'error' && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-red-600 dark:text-red-400">
                <p className="font-medium">{t('sidebar.processingFailed')}</p>
                <p className="text-sm mt-1">{useAppStore.getState().pipeline.error}</p>
              </div>
            </div>
          )}

          {result && pipelineStatus === 'complete' && (
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                    <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.failedToDisplay')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('sidebar.tryRegenerate')}</p>
                  </div>
                </div>
              }
            >
              <CanvasArea />
            </ErrorBoundary>
          )}
        </main>
      </div>
      <PrivacyFooter />
    </div>
  );
}
