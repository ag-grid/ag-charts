export interface TData {
    country: string;
    flag: string;
    revenue: number;
    delta: number;
}

export function getData(): TData[] {
    return [
        { country: 'US', flag: '🇺🇸', revenue: 482, delta: 18 },
        { country: 'GB', flag: '🇬🇧', revenue: 264, delta: -7 },
        { country: 'DE', flag: '🇩🇪', revenue: 318, delta: 12 },
        { country: 'JP', flag: '🇯🇵', revenue: 197, delta: 4 },
        { country: 'BR', flag: '🇧🇷', revenue: 132, delta: -3 },
    ];
}
