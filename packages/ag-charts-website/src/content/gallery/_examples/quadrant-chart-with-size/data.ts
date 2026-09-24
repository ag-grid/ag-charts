export interface ProductLine {
    product: string;
    /** Share of the market relative to the largest competitor, where 1 is parity. */
    relativeShare: number;
    /** Annual growth of the market the product competes in, as a percentage. */
    marketGrowth: number;
    /** Annual revenue in millions of US dollars. */
    revenue: number;
}

export function getData(): ProductLine[] {
    return [
        { product: 'Payments API', relativeShare: 2.05, marketGrowth: 22.5, revenue: 486 },
        { product: 'Fraud Detection', relativeShare: 1.6, marketGrowth: 25.0, revenue: 212 },
        { product: 'Card Issuing', relativeShare: 1.3, marketGrowth: 16.5, revenue: 154 },
        { product: 'Crypto Custody', relativeShare: 0.32, marketGrowth: 26.0, revenue: 41 },
        { product: 'Embedded Loans', relativeShare: 0.78, marketGrowth: 22.0, revenue: 94 },
        { product: 'BNPL', relativeShare: 0.5, marketGrowth: 14.5, revenue: 126 },
        { product: 'Acquiring', relativeShare: 2.25, marketGrowth: 3.8, revenue: 742 },
        { product: 'Treasury', relativeShare: 1.75, marketGrowth: -7.2, revenue: 398 },
        { product: 'Direct Debit', relativeShare: 1.35, marketGrowth: 1.4, revenue: 264 },
        { product: 'Cheques', relativeShare: 0.85, marketGrowth: -5.5, revenue: 57 },
        { product: 'SMS Alerts', relativeShare: 0.55, marketGrowth: 1.8, revenue: 46 },
        { product: 'Statements', relativeShare: 0.2, marketGrowth: -10.5, revenue: 12 },
    ];
}
