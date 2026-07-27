export interface DataType {
    quarter: string;
    profitChange: number;
}

export const data: DataType[] = [
    { quarter: 'Q1', profitChange: 12 },
    { quarter: 'Q2', profitChange: 8 },
    { quarter: 'Q3', profitChange: -5 },
    { quarter: 'Q4', profitChange: 1 },
    { quarter: 'Q5', profitChange: -9 },
];
