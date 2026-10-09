import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdSenseConfig, loadAdSense } from '../../utils/adsense';

/** Mount only on the landing page, before the user starts a project. */
export function HomeAd() {
  const config = getAdSenseConfig();
  if (!config || window.location.pathname !== '/') return null;
  return <AdUnit {...config} />;
}

function AdUnit({ client, slot, testMode }: NonNullable<ReturnType<typeof getAdSenseConfig>>) {
  const { t } = useTranslation();
  const element = useRef<HTMLModElement>(null);
  const requested = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadAdSense(client).then((ready) => {
      // A slow script must never request an ad after entering the creator.
      if (cancelled || !element.current?.isConnected || requested.current) return;
      if (!ready) { setFailed(true); return; }
      requested.current = true;
      try {
        window.adsbygoogle ??= [] as Record<string, never>[];
        window.adsbygoogle.push({});
      } catch {
        // Ad blockers or a failed ad request must not affect image creation.
        setFailed(true);
      }
    });
    return () => { cancelled = true; };
  }, [client]);

  if (failed) return null;
  return (
    <aside aria-label={t('ads.advertisement')} className="w-full min-w-0 text-center">
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('ads.advertisement')}</p>
      <ins
        ref={element}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 100 }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
        data-adtest={testMode ? 'on' : undefined}
      />
    </aside>
  );
}
