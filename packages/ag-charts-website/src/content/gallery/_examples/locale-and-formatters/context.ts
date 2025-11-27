export type LocaleString = 'fr-FR' | 'en-US' | 'en-IN' | 'pl-PL' | 'ar-EG' | 'fa-IR' | 'tr-TR' | 'zh-CN' | 'he-IL';

export interface LocaleContext {
    get locale(): LocaleString;
    formatUSD(value: number): string;
    formatMonth(value: Date): string;
    formatPercent(value: number): string;
}

export function makeLocaleContext(locale: LocaleString): LocaleContext {
    const usdFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    });
    const monthFormatter = new Intl.DateTimeFormat(locale, {
        month: 'short',
    });
    const percentFormatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 1,
    });

    if ('document' in global) {
        document.documentElement.lang = locale;
    }

    return {
        get locale(): LocaleString {
            return locale;
        },
        formatUSD(value: number): string {
            return usdFormatter.format(value);
        },
        formatMonth(value: Date): string {
            return monthFormatter.format(value);
        },
        formatPercent(value: number): string {
            return percentFormatter.format(value);
        },
    };
}
