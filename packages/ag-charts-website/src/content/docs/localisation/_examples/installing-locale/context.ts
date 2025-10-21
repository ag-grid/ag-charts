export type LocaleString = 'fr-FR' | 'en-IN' | 'pl-PL' | 'ar-EG' | 'fa-IR' | 'tr-TR' | 'zh-CN' | 'he-IL';

export interface LocaleContext {
    locale: LocaleString;
    formatUSD(value: number): string;
    formatMonth(value: Date): string;
    formatPercent(value: number): string;
}

export function makeLocaleContext(locale: LocaleString): LocaleContext {
    function newUSDFormatter(locale: LocaleString) {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        });
    }
    function newMonthFormatter(locale: LocaleString) {
        return new Intl.DateTimeFormat(locale, {
            month: 'short',
        });
    }
    function newPercentFormatter(locale: LocaleString) {
        return new Intl.NumberFormat(locale, {
            style: 'percent',
            minimumFractionDigits: 1,
        });
    }
    function updateHTMLElement(locale: LocaleString) {
        document.getElementById('myChart')!.lang = locale;
    }

    let usdFormatter = newUSDFormatter(locale);
    let monthFormatter = newMonthFormatter(locale);
    let percentFormatter = newPercentFormatter(locale);
    updateHTMLElement(locale);

    const self: LocaleContext = {
        set locale(newLocale: LocaleString) {
            locale = newLocale;
            usdFormatter = newUSDFormatter(locale);
            monthFormatter = newMonthFormatter(locale);
            percentFormatter = newPercentFormatter(locale);
            updateHTMLElement(locale);
        },
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

    return self;
}
