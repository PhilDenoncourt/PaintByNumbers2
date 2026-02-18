import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config.ts'
import i18n, { isRTLLanguage } from './i18n/config.ts'
import App from './App.tsx'
import { ErrorBoundary } from './components/layout/ErrorBoundary'

// Apply initial RTL settings based on browser-detected language
const currentLang = i18n.language
const isRTL = isRTLLanguage(currentLang)
document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
document.documentElement.lang = currentLang

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
