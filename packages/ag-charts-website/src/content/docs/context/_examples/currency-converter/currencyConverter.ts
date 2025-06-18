import { TradeDatum } from './data';

function unreachable(_arg: never): never {
    throw new Error('');
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR';

export interface CurrencyConverter {
    userCurrency: Currency;
    formatCurrency(stockPrice: number, currency: Currency): string;

    formatStockCurrency(stockPrice: number): string;
    formatUserCurrency(stockPrice: number): string;
    formatBothCurrencies(stockPrice: number): string;
    formatLog(datum: TradeDatum, currency: Currency): string;
}

export function makeCurrencyConverter(userCurrency: Currency): CurrencyConverter {
    const self: CurrencyConverter = {
        userCurrency,

        formatCurrency(stockPrice: number, currency: Currency): string {
            const convertedPrice = Math.floor(USD_CONVERSION_RATES[currency] * stockPrice);
            switch (currency) {
                case 'USD':
                    return `\$${convertedPrice}`;
                case 'EUR':
                    return `€${convertedPrice}`;
                case 'GBP':
                    return `£${convertedPrice}`;
                case 'JPY':
                    return `¥${convertedPrice}`;
                case 'INR':
                    return `₹${convertedPrice}`;
                default:
                    unreachable(currency);
            }
        },

        formatStockCurrency(stockPrice: number): string {
            return this.formatCurrency(stockPrice, 'USD');
        },

        formatUserCurrency(stockPrice: number): string {
            return this.formatCurrency(stockPrice, this.userCurrency);
        },

        formatBothCurrencies(stockPrice: number): string {
            if (this.userCurrency === 'USD') {
                return this.formatCurrency(stockPrice, 'USD');
            } else {
                const stockFmt = this.formatStockCurrency(stockPrice);
                const userFmt = this.formatUserCurrency(stockPrice);
                return `${stockFmt} (${userFmt})`;
            }
        },

        formatLog(datum: TradeDatum, currency: Currency): string {
            return [
                `Pricing in ${currency}:`,
                `  Open  : ${this.formatCurrency(datum.open, currency)}`,
                `  High  : ${this.formatCurrency(datum.high, currency)}`,
                `  Low   : ${this.formatCurrency(datum.low, currency)}`,
                `  Close : ${this.formatCurrency(datum.close, currency)}`,
            ].join('\n');
        },
    };
    return self;
}

const USD_CONVERSION_RATES: { [key in Currency]: number } = {
    USD: 1,
    EUR: 0.87,
    GBP: 0.74,
    JPY: 144,
    INR: 86.06,
};
