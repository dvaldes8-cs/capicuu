import type { Language } from '../domain/types';

/** Capicuu ships in Spanish by default. */
export const DEFAULT_LANGUAGE: Language = 'es';

export function normalizeLanguage(value: unknown): Language {
  return value === 'en' ? 'en' : DEFAULT_LANGUAGE;
}
