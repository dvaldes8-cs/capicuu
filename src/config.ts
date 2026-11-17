/** Centralized app configuration */

export const APP_VERSION = '1.0.4';

/**
 * Buy Me a Coffee creator URL.
 * Override with VITE_BUY_ME_A_COFFEE_URL in .env if needed.
 */
export const BUY_ME_A_COFFEE_URL =
  (import.meta.env.VITE_BUY_ME_A_COFFEE_URL as string | undefined)?.trim() ||
  'https://buymeacoffee.com/capicuu';

export const hasBuyMeACoffee = BUY_ME_A_COFFEE_URL.length > 0;
