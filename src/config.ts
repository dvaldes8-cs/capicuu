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

/**
 * Free Web3Forms access key (https://web3forms.com).
 * Emails visit/install notices to the address you verify there
 * (e.g. dvaldes8.cs@gmail.com). Leave empty to disable.
 */
export const WEB3FORMS_ACCESS_KEY =
  (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined)?.trim() ||
  '';
