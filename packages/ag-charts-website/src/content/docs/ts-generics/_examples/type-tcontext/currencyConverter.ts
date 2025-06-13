export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR';

export class CurrencyConverter {
    constructor(public userCurrency: Currency) {}

    formatCurrency(stockPrice: number, currency: Currency): string {
        const convertedPrice = USD_CONVERSION_RATES[currency] * stockPrice;
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
                currency satisfies never;
        }
    }

    formatStockCurrency(stockPrice: number): string {
        return this.formatCurrency(stockPrice, 'USD');
    }

    formatUserCurrency(stockPrice: number): string {
        return this.formatCurrency(stockPrice, this.userCurrency);
    }

    formatBothCurrencies(stockPrice: number): string {
        if (this.userCurrency === 'USD') {
            return this.formatCurrency(stockPrice, 'USD');
        } else {
            const stockFmt = this.formatStockCurrency(stockPrice);
            const userFmt = this.formatUserCurrency(stockPrice);
            return `${stockFmt} (${userFmt})`;
        }
    }
}

const USD_CONVERSION_RATES: { [key in Currency]: number } = {
    USD: 1,
    EUR: 1.15,
    GBP: 1.35,
    JPY: 0.006966,
    INR: 0.011616,
};
