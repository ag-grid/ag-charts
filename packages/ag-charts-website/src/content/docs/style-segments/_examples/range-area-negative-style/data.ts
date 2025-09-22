export interface DataType {
    quarter: string;
    projected: number;
    actual: number;
}

export const data: DataType[] = [
    { quarter: 'Q1 23', projected: 85, actual: 92 },
    { quarter: 'Q2 23', projected: 88, actual: 95 },
    { quarter: 'Q3 23', projected: 95, actual: 87 },
    { quarter: 'Q4 23', projected: 98, actual: 82 },
    { quarter: 'Q1 24', projected: 90, actual: 96 },
    { quarter: 'Q2 24', projected: 93, actual: 99 },
    { quarter: 'Q3 24', projected: 100, actual: 89 },
    { quarter: 'Q4 24', projected: 105, actual: 112 },
    { quarter: 'Q1 25', projected: 108, actual: 115 },
    { quarter: 'Q2 25', projected: 118, actual: 105 },
    { quarter: 'Q3 25', projected: 115, actual: 122 },
    { quarter: 'Q4 25', projected: 120, actual: 125 },
];
