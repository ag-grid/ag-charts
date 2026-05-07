export interface QuarterDatum {
    quarter: string;
    revenue: number;
}

export function getData(): QuarterDatum[] {
    return [
        { quarter: 'Q1 2023', revenue: 184 },
        { quarter: 'Q2 2023', revenue: 212 },
        { quarter: 'Q3 2023', revenue: 198 },
        { quarter: 'Q4 2023', revenue: 245 },
        { quarter: 'Q1 2024', revenue: 221 },
        { quarter: 'Q2 2024', revenue: 268 },
        { quarter: 'Q3 2024', revenue: 254 },
        { quarter: 'Q4 2024', revenue: 301 },
    ];
}
