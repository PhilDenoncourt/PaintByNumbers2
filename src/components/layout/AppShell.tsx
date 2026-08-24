import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { ImageUploader } from '../upload/ImageUploader';
import { ProcessingProgress } from '../progress/ProcessingProgress';
import { PreprocessedImagePreview } from '../preview/PreprocessedImagePreview';
import { ErrorBoundary } from './ErrorBoundary';
import { PrivacyFooter } from './PrivacyFooter';
import { FaqSection } from '../seo/FaqSection';
import { StudioHeader } from '../studio/StudioHeader';
import { StudioStepper } from '../studio/StudioStepper';
import { StudioControls } from '../studio/StudioControls';
import { StudioCanvasCard } from '../studio/StudioCanvasCard';
import { useStudioTokens } from '../studio/studioTokens';

export function AppShell() {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const sourceImageUrl = useAppStore((s) => s.sourceImageUrl);
  const result = useAppStore((s) => s.result);
  const pipelineStatus = useAppStore((s) => s.pipeline.status);
  const darkMode = useAppStore((s) => s.ui.darkMode);
  const mergeMode = useAppStore((s) => s.ui.mergeMode);
  const setMergeMode = useAppStore((s) => s.setMergeMode);

  // Sync the `dark` class on <html> so Tailwind `dark:` and the .dark scrollbar apply.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Follow system preference changes when the user hasn't pinned a choice.
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

  // Keyboard shortcuts for merge/split modes (Refine step).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') setMergeMode(mergeMode === 'merge' ? 'browse' : 'merge');
      else if (e.key === 's' || e.key === 'S') setMergeMode(mergeMode === 'split' ? 'browse' : 'split');
      else if (e.key === 'Escape') setMergeMode('browse');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mergeMode, setMergeMode]);

  const cardStyle = {
    background: tk.cardBg,
    border: `1px solid ${tk.border}`,
    boxShadow: tk.dropShadow,
  } as const;

  return (
    <div className="h-full flex flex-col" style={{ background: tk.pageBg, color: tk.text }}>
      <StudioHeader />
      {sourceImageData && <StudioStepper />}

      {!sourceImageData ? (
        // ── Landing / upload ──
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">
            <ErrorBoundary
              fallback={
                <div className="rounded-lg p-6" style={cardStyle}>
                  <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.failedToLoadUploader')}</p>
                  <p className="text-sm mt-2" style={{ color: tk.muted }}>{t('errors.refreshPage')}</p>
                </div>
              }
            >
              <ImageUploader />
            </ErrorBoundary>

            <div className="text-center">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-display text-[11px] font-semibold"
                  style={{ color: tk.text, background: tk.dotIdleBg }}
                >
                  📐 {t('welcome.vectorBadge')}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-display text-[11px] font-semibold"
                  style={{ color: tk.text, background: tk.dotIdleBg }}
                >
                  ✂️ {t('welcome.regionBadge')}
                </span>
              </div>
              <h1 className="font-display text-2xl font-extrabold mb-3" style={{ color: tk.text }}>
                {t('welcome.tagline')}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: tk.muted }}>
                {t('welcome.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { title: t('welcome.feature1Title'), body: t('welcome.feature1Body'), icon: '🎨' },
                { title: t('welcome.feature2Title'), body: t('welcome.feature2Body'), icon: '🖍️' },
                { title: t('welcome.feature3Title'), body: t('welcome.feature3Body'), icon: '✏️' },
                { title: t('welcome.feature4Title'), body: t('welcome.feature4Body'), icon: '📐' },
              ] as const).map(({ title, body, icon }) => (
                <div key={title} className="rounded-[16px] p-4" style={cardStyle}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="text-sm font-semibold mb-1" style={{ color: tk.text }}>{title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: tk.muted }}>{body}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-center" style={{ color: tk.muted }}>
              {t('welcome.comparePromptPrefix')}{' '}
              <a href="/paint-by-numbers-vs-pbnify" className="font-semibold underline" style={{ color: tk.text }}>
                {t('welcome.comparePromptLink')}
              </a>
            </p>

            <div className="rounded-[16px] p-5" style={cardStyle}>
              <h3 className="font-display text-sm font-bold mb-3" style={{ color: tk.text }}>
                {t('welcome.guidesTitle')}
              </h3>
              <ul className="space-y-2">
                {([
                  { href: '/paint-by-numbers-vs-pbnify', title: t('welcome.guideVsPbnifyTitle'), body: t('welcome.guideVsPbnifyBody') },
                  { href: '/photo-to-paint-by-numbers-svg', title: t('welcome.guideSvgTitle'), body: t('welcome.guideSvgBody') },
                  { href: '/merge-split-paint-by-numbers-regions', title: t('welcome.guideMergeSplitTitle'), body: t('welcome.guideMergeSplitBody') },
                  { href: '/paint-by-numbers-generator-no-upload', title: t('welcome.guideNoUploadTitle'), body: t('welcome.guideNoUploadBody') },
                ] as const).map(({ href, title, body }) => (
                  <li key={href} className="text-xs leading-relaxed">
                    <a href={href} className="font-semibold underline" style={{ color: tk.text }}>
                      {title}
                    </a>{' '}
                    <span style={{ color: tk.muted }}>— {body}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[16px] p-5" style={cardStyle}>
              <h3 className="font-display text-sm font-bold mb-3" style={{ color: tk.text }}>
                {t('welcome.howToBegin')}
              </h3>
              <ol className="space-y-2">
                {[t('welcome.step1'), t('welcome.step2'), t('welcome.step3'), t('welcome.step4')].map((step, i) => (
                  <li key={i} className="flex gap-3 text-xs" style={{ color: tk.muted }}>
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-semibold text-xs"
                      style={{ background: tk.dotIdleBg, color: tk.text }}
                    >
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
      ) : (
        // ── Editor ──
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_392px] gap-[26px] p-4 sm:px-[30px] sm:py-[26px] lg:h-full">
            {/* Left: canvas / preview / progress */}
            <div className="min-h-0 flex flex-col">
              {result && pipelineStatus === 'complete' ? (
                <ErrorBoundary
                  fallback={
                    <div className="rounded-[24px] p-8 flex items-center justify-center" style={cardStyle}>
                      <p className="text-red-600 dark:text-red-400 font-medium">{t('sidebar.failedToDisplay')}</p>
                    </div>
                  }
                >
                  <StudioCanvasCard />
                </ErrorBoundary>
              ) : (
                <div
                  className="rounded-[24px] p-6 flex-1 min-h-[420px] flex items-center justify-center"
                  style={cardStyle}
                >
                  {pipelineStatus === 'running' ? (
                    <div className="w-80 max-w-full">
                      <ErrorBoundary fallback={<p style={{ color: tk.muted }}>{t('processing.processing')}</p>}>
                        <ProcessingProgress />
                      </ErrorBoundary>
                    </div>
                  ) : pipelineStatus === 'error' ? (
                    <div className="text-center text-red-600 dark:text-red-400">
                      <p className="font-medium">{t('sidebar.processingFailed')}</p>
                      <p className="text-sm mt-1">{useAppStore.getState().pipeline.error}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ErrorBoundary fallback={<p style={{ color: tk.muted }}>{t('sidebar.previewUnavailable')}</p>}>
                        <PreprocessedImagePreview />
                      </ErrorBoundary>
                      {sourceImageUrl && (
                        <img
                          src={sourceImageUrl}
                          alt={t('preview.original')}
                          className="max-h-[52vh] max-w-full object-contain rounded-[14px] mx-auto mb-4"
                        />
                      )}
                      <p className="text-sm" style={{ color: tk.muted }}>{t('sidebar.adjustSettings')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: controls */}
            <ErrorBoundary
              fallback={
                <div className="rounded-[20px] p-4" style={cardStyle}>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{t('sidebar.controlsUnavailable')}</p>
                  <p className="text-xs mt-1" style={{ color: tk.muted }}>{t('sidebar.tryRefreshing')}</p>
                </div>
              }
            >
              <StudioControls />
            </ErrorBoundary>
          </div>
        </div>
      )}

      <PrivacyFooter />
    </div>
  );
}
