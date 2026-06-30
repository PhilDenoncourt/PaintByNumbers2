import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../state/appStore';
import { useStudioTokens } from './studioTokens';
import { LanguageSelector } from '../layout/LanguageSelector';

/**
 * Open Studio header: Bricolage wordmark and a theme pill.
 */
export function StudioHeader() {
  const { t } = useTranslation();
  const tk = useStudioTokens();
  const darkMode = useAppStore((s) => s.ui.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const reset = useAppStore((s) => s.reset);
  const sourceImageData = useAppStore((s) => s.sourceImageData);
  const result = useAppStore((s) => s.result);
  const processedWidth = useAppStore((s) => s.processedWidth);
  const processedHeight = useAppStore((s) => s.processedHeight);

  return (
    <div
      className="px-4 sm:px-[30px] pt-[18px] pb-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ background: tk.headerBg }}
    >
      <div className="flex items-center gap-2 sm:gap-[11px] min-w-0">
        <span
          className="font-display font-extrabold text-[20px] sm:text-[23px] -tracking-[0.02em] truncate"
          style={{ color: tk.text }}
        >
          {t('header.title')}
        </span>

        <button
          onClick={toggleDarkMode}
          title={darkMode ? t('header.lightMode') : t('header.darkMode')}
          aria-label={darkMode ? t('header.lightMode') : t('header.darkMode')}
          className="hidden sm:flex items-center gap-1.5 px-[11px] py-[5px] rounded-full font-display text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{ color: tk.muted, background: tk.dotIdleBg }}
        >
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </button>

        {result && (
          <span
            className="hidden md:flex items-center gap-1.5 font-display text-[11px] font-semibold px-[11px] py-[5px] rounded-full"
            style={{ color: tk.muted, background: tk.dotIdleBg }}
          >
            {processedWidth} × {processedHeight} · {result.regions.length} {t('header.regions')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {sourceImageData && (
          <button
            onClick={reset}
            className="hidden sm:flex items-center gap-1.5 px-[13px] py-[9px] rounded-full font-display text-[12px] font-semibold transition-opacity hover:opacity-80"
            style={{ color: tk.muted, background: tk.dotIdleBg }}
          >
            ↑ {t('panels.new')}
          </button>
        )}
        <LanguageSelector />
      </div>
    </div>
  );
}
