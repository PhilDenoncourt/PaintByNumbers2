import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { isRTLLanguage } from '../../i18n/config';
import { useStudioTokens } from '../studio/studioTokens';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'ja', name: '日本語' },
  { code: 'ar', name: 'العربية' },
  { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'cs', name: 'Čeština' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'uk', name: 'Українська' },
  { code: 'hu', name: 'Magyar' },
  { code: 'sv', name: 'Svenska' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'ca', name: 'Català' },
  { code: 'pcm', name: 'Naijá' },
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const tk = useStudioTokens();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('preferredLanguage', lng);
    setOpen(false);
  };

  // Apply RTL on initial load and when language changes
  useEffect(() => {
    const isRTL = isRTLLanguage(i18n.language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Close the dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('layout.languages', { defaultValue: 'Languages' })}
        aria-label={t('layout.languages', { defaultValue: 'Languages' })}
        aria-expanded={open}
        className="flex items-center gap-1.5 px-[11px] py-[5px] rounded-full font-display text-[11px] font-semibold transition-opacity hover:opacity-80"
        style={{ color: tk.muted, background: tk.dotIdleBg }}
      >
        🌐
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 z-20 flex flex-wrap gap-2 p-3 rounded-xl shadow-lg max-w-[260px]"
          style={{ background: tk.cardBg, border: `1px solid ${tk.border}` }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                i18n.language === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title={lang.name}
              aria-label={t('layout.switchToLanguage', { name: lang.name })}
            >
              {lang.code === 'pt-BR' ? 'PT-BR' : lang.code.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
