import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

let HomeAd: typeof import('../../../components/ads/HomeAd').HomeAd;
const client = 'ca-pub-8829035634388232';
const adScript = () => document.querySelector<HTMLScriptElement>('#home-adsense-script');

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_ADSENSE_CLIENT_ID', client);
  vi.stubEnv('VITE_ADSENSE_HOME_SLOT', '1234567890');
  vi.stubEnv('VITE_ADSENSE_TEST_MODE', 'false');
  window.history.replaceState({}, '', '/');
  ({ HomeAd } = await import('../../../components/ads/HomeAd'));
});

afterEach(() => {
  cleanup();
  adScript()?.remove();
  delete window.adsbygoogle;
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});

describe('home-page AdSense', () => {
  it.each([
    ['VITE_ADSENSE_CLIENT_ID', ''],
    ['VITE_ADSENSE_CLIENT_ID', 'ca-pub-invalid'],
    ['VITE_ADSENSE_HOME_SLOT', ''],
    ['VITE_ADSENSE_HOME_SLOT', 'invalid'],
  ])('does not render or load a script with %s=%s', (key, value) => {
    vi.stubEnv(key, value);
    const { container } = render(<HomeAd />);
    expect(container).toBeEmptyDOMElement();
    expect(adScript()).toBeNull();
  });

  it('never loads on a non-home URL', () => {
    window.history.replaceState({}, '', '/photo-to-paint-by-numbers-svg');
    const { container } = render(<HomeAd />);
    expect(container).toBeEmptyDOMElement();
    expect(adScript()).toBeNull();
  });

  it('requires test mode in development and marks test requests', () => {
    vi.stubEnv('PROD', false);
    const { container, rerender } = render(<HomeAd />);
    expect(container).toBeEmptyDOMElement();
    expect(adScript()).toBeNull();
    vi.stubEnv('VITE_ADSENSE_TEST_MODE', 'true');
    rerender(<HomeAd />);
    expect(container.querySelector('ins')).toHaveAttribute('data-adtest', 'on');
  });

  it('loads once and requests only one ad under StrictMode and rerenders', async () => {
    const push = vi.fn();
    window.adsbygoogle = { push };
    const { container, rerender } = render(<StrictMode><HomeAd /></StrictMode>);
    expect(document.querySelectorAll('#home-adsense-script')).toHaveLength(1);
    expect(adScript()).toHaveAttribute('crossorigin', 'anonymous');
    expect(adScript()?.src).toContain(`client=${client}`);
    expect(container.querySelector('ins')).toHaveAttribute('data-ad-slot', '1234567890');
    expect(container.querySelector('ins')).not.toHaveAttribute('data-adtest');
    expect(push).not.toHaveBeenCalled();
    fireEvent.load(adScript()!);
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    rerender(<StrictMode><HomeAd /></StrictMode>);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('does not request an ad if creation begins before the script loads', async () => {
    const push = vi.fn();
    window.adsbygoogle = { push };
    const { unmount } = render(<HomeAd />);
    const script = adScript()!;
    unmount();
    await act(async () => { fireEvent.load(script); });
    expect(push).not.toHaveBeenCalled();
    expect(document.querySelector('ins.adsbygoogle')).toBeNull();
  });

  it('removes the placement when the script is blocked', async () => {
    render(<HomeAd />);
    fireEvent.error(adScript()!);
    await waitFor(() => expect(screen.queryByRole('complementary')).not.toBeInTheDocument());
  });

  it('contains failures from the Google ad request', async () => {
    window.adsbygoogle = { push: () => { throw new Error('Ad blocked'); } };
    render(<HomeAd />);
    fireEvent.load(adScript()!);
    await waitFor(() => expect(screen.queryByRole('complementary')).not.toBeInTheDocument());
  });
});
