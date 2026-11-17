import { es, type Dictionary } from './es';
import { en } from './en';
import type { Language } from '../domain/types';
import { DEFAULT_LANGUAGE } from './language';

const dictionaries: Record<Language, Dictionary> = { es, en };

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang] ?? dictionaries[DEFAULT_LANGUAGE];
}

export { DEFAULT_LANGUAGE } from './language';

export function t(
  dict: Dictionary,
  template: string,
  vars?: Record<string, string | number>,
): string {
  void dict;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export type { Dictionary };
