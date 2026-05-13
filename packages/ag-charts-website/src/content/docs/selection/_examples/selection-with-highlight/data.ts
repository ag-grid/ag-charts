export interface QuarterDatum {
    quarter: string;
    revenue: number;
    costs: number;
}

export function getData(): QuarterDatum[] {
    return [
        { quarter: 'Q1 2023', revenue: 184, costs: 120 },
        { quarter: 'Q2 2023', revenue: 212, costs: 135 },
        { quarter: 'Q3 2023', revenue: 198, costs: 142 },
        { quarter: 'Q4 2023', revenue: 245, costs: 158 },
        { quarter: 'Q1 2024', revenue: 221, costs: 148 },
        { quarter: 'Q2 2024', revenue: 268, costs: 162 },
        { quarter: 'Q3 2024', revenue: 254, costs: 155 },
        { quarter: 'Q4 2024', revenue: 301, costs: 170 },
    ];
}
