/** Centralized app configuration */

export const APP_VERSION = '1.0.3';

/**
 * Buy Me a Coffee creator URL.
 * Set VITE_BUY_ME_A_COFFEE_URL in .env to enable the support button.
 * Leave unset to hide actionable donation links.
 */
export const BUY_ME_A_COFFEE_URL =
  (import.meta.env.VITE_BUY_ME_A_COFFEE_URL as string | undefined)?.trim() ||
  '';

export const hasBuyMeACoffee = BUY_ME_A_COFFEE_URL.length > 0;
