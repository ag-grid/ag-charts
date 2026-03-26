export interface TData {
    product: string;
    sales: number;
    target: number;
}

export function getData(): TData[] {
    return [
        { product: 'Laptops', sales: 145, target: 120 },
        { product: 'Tablets', sales: 98, target: 100 },
        { product: 'Smartphones', sales: 203, target: 180 },
        { product: 'Monitors', sales: 87, target: 90 },
        { product: 'Keyboards', sales: 62, target: 55 },
    ];
}
