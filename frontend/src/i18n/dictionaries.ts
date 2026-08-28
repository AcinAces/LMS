import 'server-only';

const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  bn: () => import('./bn.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.bn();
};
