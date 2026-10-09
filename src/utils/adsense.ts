export function getAdSenseConfig() {
  const client = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim() ?? '';
  const slot = import.meta.env.VITE_ADSENSE_HOME_SLOT?.trim() ?? '';
  const testMode = import.meta.env.VITE_ADSENSE_TEST_MODE === 'true';
  if (!/^ca-pub-\d{16}$/.test(client) || !/^\d+$/.test(slot)) return null;
  // Local development must explicitly opt into test ads.
  if (!import.meta.env.PROD && !testMode) return null;
  return { client, slot, testMode };
}

declare global {
  interface Window {
    adsbygoogle?: { push: (ad: Record<string, never>) => unknown };
  }
}

let scriptReady: Promise<boolean> | undefined;

export function loadAdSense(client: string): Promise<boolean> {
  if (scriptReady) return scriptReady;
  scriptReady = new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'home-adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return scriptReady;
}
