type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

// gtag must accept the canonical `IArguments` shape used by Google's official
// snippet. Using a rest-parameter signature here causes gtag.js to silently
// skip queued entries because it inspects the pushed item via the live
// `arguments` object pattern.
declare global {
  interface Window {
    dataLayer?: IArguments[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';

export const analyticsEnabled = measurementId.length > 0;

let initialized = false;

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

  // Set up the queue *before* loading gtag.js so any queued calls are picked
  // up when the library finishes loading.
  window.dataLayer = window.dataLayer || [];
  // Use a plain `function` (not an arrow / rest-spread) so `arguments` is the
  // live IArguments object that gtag.js's queue replay expects.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments as unknown as IArguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });

  injectGtagScript(measurementId);

  initialized = true;
}

export function trackPageView(path: string = window.location.pathname): void {
  if (!analyticsEnabled || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    language: document.documentElement.lang || navigator.language,
  });
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (!analyticsEnabled || !window.gtag) return;
  window.gtag('event', eventName, params);
}

/**
 * Track a click on an Amazon affiliate CTA. These links are the site's revenue
 * source, so every surface (palette hero, legend bar, export hero) reports a
 * uniform `affiliate_click` event identifying which paint set was clicked.
 */
export function trackAffiliateClick(brand: string, setId: string): void {
  trackEvent('affiliate_click', { brand, set_id: setId });
}
