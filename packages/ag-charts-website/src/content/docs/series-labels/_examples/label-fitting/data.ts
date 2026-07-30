export interface DataType {
    quarter: string;
    revenue: number;
    division: string;
}

export const data: DataType[] = [
    { quarter: 'Q1 2024', revenue: 42, division: 'Energy' },
    { quarter: 'Q2 2024', revenue: 58, division: 'Semiconductors' },
    { quarter: 'Q3 2024', revenue: 51, division: 'Infrastructure' },
    { quarter: 'Q4 2024', revenue: 67, division: 'Manufacturing' },
];
