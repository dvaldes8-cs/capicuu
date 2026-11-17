import { APP_VERSION, WEB3FORMS_ACCESS_KEY } from '../config';

const VISIT_KEY = 'capicuu:last-visit-notify';
const ENDPOINT = 'https://api.web3forms.com/submit';

type NotifyKind = 'visit' | 'install';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function platformLabel(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'iPhone/iPad';
  if (/android/i.test(ua)) return 'Android';
  if (/mac/i.test(ua)) return 'Mac';
  if (/windows/i.test(ua)) return 'Windows';
  return 'Other';
}

function modeLabel(): string {
  if (typeof window === 'undefined') return 'browser';
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(
      (navigator as Navigator & { standalone?: boolean }).standalone,
    );
  return standalone ? 'installed app' : 'browser';
}

async function send(kind: NotifyKind): Promise<void> {
  if (!WEB3FORMS_ACCESS_KEY) return;
  if (isLocalHost()) return;

  const subject =
    kind === 'install'
      ? 'Capicuu — someone installed the app'
      : 'Capicuu — someone opened the link';

  const message = [
    kind === 'install'
      ? 'Someone added Capicuu to their phone (or installed the PWA).'
      : 'Someone opened the Capicuu link.',
    '',
    `When: ${new Date().toISOString()}`,
    `Device: ${platformLabel()}`,
    `Mode: ${modeLabel()}`,
    `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
    `Version: ${APP_VERSION}`,
  ].join('\n');

  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject,
        from_name: 'Capicuu',
        message,
      }),
      keepalive: true,
    });
  } catch {
    /* offline / blocked — ignore */
  }
}

/** Email once per calendar day when Capicuu is opened (not localhost). */
export function notifyVisitOncePerDay(): void {
  if (!WEB3FORMS_ACCESS_KEY || isLocalHost()) return;
  try {
    if (localStorage.getItem(VISIT_KEY) === todayKey()) return;
    localStorage.setItem(VISIT_KEY, todayKey());
  } catch {
    /* private mode — still try once this session */
  }
  void send('visit');
}

/** Email when the browser fires appinstalled. */
export function notifyInstall(): void {
  void send('install');
}
