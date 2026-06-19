export interface TData {
    country: string;
    revenue: number;
    delta: number;
}

export function getData(): TData[] {
    return [
        { country: 'US', revenue: 482, delta: 18 },
        { country: 'GB', revenue: 264, delta: -7 },
        { country: 'DE', revenue: 318, delta: 12 },
        { country: 'JP', revenue: 197, delta: 4 },
        { country: 'BR', revenue: 132, delta: -3 },
    ];
}
