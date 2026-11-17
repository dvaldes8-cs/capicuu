/** Build and share a finished-game result (Web Share API + clipboard fallback). */

export function appPublicUrl(): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${origin}${path}`;
}

export type ShareResultPayload = {
  title: string;
  /** Full message body (winner + scores + tagline). */
  text: string;
  url: string;
};

export type ShareResultOutcome = 'shared' | 'copied' | 'cancelled';

export async function shareResult(
  payload: ShareResultPayload,
): Promise<ShareResultOutcome> {
  const { title, text, url } = payload;
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (canNativeShare) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      /* fall through to clipboard */
    }
  }

  const clipboardBody = url ? `${text}\n${url}` : text;
  try {
    await navigator.clipboard.writeText(clipboardBody);
    return 'copied';
  } catch {
    window.prompt(title, clipboardBody);
    return 'copied';
  }
}
