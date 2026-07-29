export interface DataType {
    quarter: string;
    hardware: number;
    software: number;
    services: number;
}

export const data: DataType[] = [
    { quarter: 'Q1', hardware: 42, software: 26, services: 3 },
    { quarter: 'Q2', hardware: 35, software: 31, services: 9 },
    { quarter: 'Q3', hardware: 29, software: 33, services: 2 },
    { quarter: 'Q4', hardware: 46, software: 21, services: 6 },
];
