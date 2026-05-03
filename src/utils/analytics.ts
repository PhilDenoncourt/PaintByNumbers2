type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: 'js' | 'config' | 'event' | 'consent',
      target: string | Date,
      params?: AnalyticsParams,
    ) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';

export const analyticsEnabled = measurementId.length > 0;

let initialized = false;

function gtag(command: 'js' | 'config' | 'event' | 'consent', target: string | Date, params?: AnalyticsParams) {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (typeof window.gtag === 'function') {
    window.gtag(command, target, params);
    return;
  }

  window.dataLayer.push([command, target, params]);
}

function injectGtagScript(id: string): void {
  if (document.getElementById('ga4-gtag-script')) return;

  const script = document.createElement('script');
  script.id = 'ga4-gtag-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function initAnalytics(): void {
  if (!analyticsEnabled || initialized) return;

  injectGtagScript(measurementId);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtagProxy(...args: unknown[]) {
    window.dataLayer?.push(args);
  } as Window['gtag'];

  gtag('js', new Date());
  gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });

  initialized = true;
}

export function trackPageView(path: string = window.location.pathname): void {
  if (!analyticsEnabled) return;

  gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    language: document.documentElement.lang || navigator.language,
  });
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (!analyticsEnabled) return;
  gtag('event', eventName, params);
}
