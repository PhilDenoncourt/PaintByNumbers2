# Internationalization (i18n) Setup

This application uses **i18next** and **react-i18next** for multi-language support.

## Current Languages

- **English (en)** - Default
- **Spanish (es-US)** - American Spanish

## How It Works

### 1. Translation Files
- Translations are stored in JSON files in `src/i18n/locales/`
- Each language has its own file: `en.json`, `es.json`, etc.
- Translations are organized by feature/section (e.g., `header`, `sidebar`, `controls`)

### 2. Using Translations in Components

In any React component, import and use the `useTranslation` hook:

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('header.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### 3. Language Persistence
- The selected language is saved to `localStorage` as `preferredLanguage`
- On app load, it checks for a saved preference, then falls back to browser language
- Users can switch languages using the language selector in the header (EN/ES buttons)

## Adding a New Language

### Step 1: Create a new translation file

Create a new file `src/i18n/locales/[language-code].json` following the same structure as `en.json`:

```json
{
  "header": {
    "title": "Your translated title",
    ...
  },
  "sidebar": {
    ...
  }
}
```

### Step 2: Update the i18n config

Edit `src/i18n/config.ts` and add the new language:

```typescript
import newLangLocale from './locales/[language-code].json';

const resources = {
  en: { translation: enLocale },
  es: { translation: esLocale },
  [language-code]: { translation: newLangLocale },  // Add this line
};

// Also add to language detection
const getSavedLanguage = () => {
  const saved = localStorage.getItem('preferredLanguage');
  if (saved && ['en', 'es', '[language-code]'].includes(saved)) {  // Update this
    return saved;
  }
  const browserLang = navigator.language.split('-')[0];
  return ['es', '[language-code]'].includes(browserLang) ? browserLang : 'en';  // Update this
};
```

### Step 3: Update the LanguageSelector component (optional)

Add a button for the new language in `src/components/layout/LanguageSelector.tsx`:

```tsx
<button
  onClick={() => changeLanguage('[language-code]')}
  className={...}
  title="Language Name"
>
  XX  {/* Two-letter code */}
</button>
```

## Translation Keys Reference

The application uses nested keys organized by feature:

- `common.*` - Common UI elements (buttons, labels)
- `header.*` - Header section
- `sidebar.*` - Sidebar section
- `controls.*` - Control labels
- `processing.*` - Progress/processing messages
- `statistics.*` - Statistics panel
- `export.*` - Export functionality
- `palette.*` - Palette controls
- `errors.*` - Error messages
- `shortcuts.*` - Keyboard shortcuts
- `merge.*` - Region merge operations
- `split.*` - Region split operations
- `uploader.*` - Image upload UI

## Interpolation

For dynamic translations with variables, use interpolation:

```json
{
  "regionInfo": "{{width}}x{{height}} · {{count}} regions"
}
```

In component:
```tsx
{t('header.regionInfo', { width: 800, height: 600, count: 42 })}
```

## Browser Language Detection

The app automatically detects the user's browser language and switches to Spanish if it's a Spanish locale. Otherwise, it defaults to English.

## Testing Translations

1. Run the app: `npm run dev`
2. Click the language selector buttons (EN/ES) in the header
3. The entire UI should update immediately
4. Refresh the page - your language choice should persist

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)

## Next Steps with Spanish

The American Spanish translation is now complete with terms commonly used in Spanish-speaking markets. You can further customize:

- Regional variations (es-MX for Mexican Spanish, es-AR for Argentine Spanish)
- Industry-specific terminology
- Additional dialects based on user distribution
