export interface TData {
    code: string;
    name: string;
    revenue: number;
    delta: number;
}

export function getData(): TData[] {
    return [
        { code: 'us', name: 'United States', revenue: 482, delta: 18 },
        { code: 'gb', name: 'United Kingdom', revenue: 264, delta: -7 },
        { code: 'de', name: 'Germany', revenue: 318, delta: 12 },
        { code: 'fr', name: 'France', revenue: 197, delta: 4 },
        { code: 'br', name: 'Brazil', revenue: 132, delta: -3 },
    ];
}
