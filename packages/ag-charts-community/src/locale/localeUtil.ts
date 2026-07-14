import type { LocaleManager } from './localeManager';

export function joinLocaleText(lm: LocaleManager, texts: (string | undefined)[]) {
    const delim = lm.t('ariaDelimiter');
    const localeText = texts.filter((s): s is string => s != null && s !== '').map((s) => lm.t(s));
    return localeText.join(delim);
}
