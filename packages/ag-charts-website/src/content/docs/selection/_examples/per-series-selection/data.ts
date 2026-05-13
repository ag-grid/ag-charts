export interface QuarterDatum {
    quarter: string;
    revenue: number;
    forecast: number;
}

export function getData(): QuarterDatum[] {
    return [
        { quarter: 'Q1 2023', revenue: 184, forecast: 190 },
        { quarter: 'Q2 2023', revenue: 212, forecast: 205 },
        { quarter: 'Q3 2023', revenue: 198, forecast: 215 },
        { quarter: 'Q4 2023', revenue: 245, forecast: 230 },
        { quarter: 'Q1 2024', revenue: 221, forecast: 240 },
        { quarter: 'Q2 2024', revenue: 268, forecast: 255 },
        { quarter: 'Q3 2024', revenue: 254, forecast: 270 },
        { quarter: 'Q4 2024', revenue: 301, forecast: 285 },
    ];
}
