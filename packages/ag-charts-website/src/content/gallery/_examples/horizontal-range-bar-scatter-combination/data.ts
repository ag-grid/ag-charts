export interface DataType {
    smartphone: string;
    lowCost: number;
    highCost: number;
    lowRetail: number;
    highRetail: number;
    profitMargin: number;
}

export function getData(): DataType[] {
    return [
        {
            smartphone: 'Apple iPhone',
            lowCost: 188,
            highCost: 501,
            lowRetail: 599,
            highRetail: 1449,
            profitMargin: 68.6,
        },
        {
            smartphone: 'Google Pixel',
            lowCost: 285.75,
            highCost: 485.5,
            lowRetail: 699,
            highRetail: 899,
            profitMargin: 54.6,
        },
        {
            smartphone: 'Samsung Galaxy',
            lowCost: 213,
            highCost: 670,
            lowRetail: 549,
            highRetail: 1799,
            profitMargin: 59.2,
        },
    ];
}
