export type DatumType = { month: Date; income: number; growth: number };

export function getData(): DatumType[] {
    return [
        { month: new Date(2025, 0, 1), income: 250000, growth: 0.1 },
        { month: new Date(2025, 1, 1), income: 300000, growth: 0.2 },
        { month: new Date(2025, 2, 1), income: 450000, growth: 0.5 },
        { month: new Date(2025, 3, 1), income: 600000, growth: 0.33 },
        { month: new Date(2025, 4, 1), income: 720000, growth: 0.2 },
        { month: new Date(2025, 5, 1), income: 680000, growth: -0.056 },
    ];
}
