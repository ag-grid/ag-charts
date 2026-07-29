export interface DataType {
    quarter: string;
    profitChange: number;
    note?: string;
}

export const data: DataType[] = [
    { quarter: 'Q1 2024', profitChange: 12 },
    { quarter: 'Q2 2024', profitChange: 8 },
    { quarter: 'Q3 2024', profitChange: 15 },
    { quarter: 'Q4 2024', profitChange: 2 },
    { quarter: 'Q1 2025', profitChange: 11 },
    { quarter: 'Q2 2025', profitChange: 9, note: 'best quarter on record' },
    { quarter: 'Q3 2025', profitChange: 14 },
    { quarter: 'Q4 2025', profitChange: 7 },
];
