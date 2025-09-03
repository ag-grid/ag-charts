export interface DataType {
    date: Date;
    value: number;
    status: 'actual' | 'forecast';
}

export const data: DataType[] = [
    // Actuals
    { date: new Date('2024-07-01'), value: 120, status: 'actual' },
    { date: new Date('2024-08-01'), value: 118, status: 'actual' },
    { date: new Date('2024-09-01'), value: 121, status: 'actual' },
    { date: new Date('2024-10-01'), value: 125, status: 'actual' },
    { date: new Date('2024-11-01'), value: 128, status: 'actual' },
    { date: new Date('2024-12-01'), value: 130, status: 'actual' },
    { date: new Date('2025-01-01'), value: 129, status: 'actual' },
    { date: new Date('2025-02-01'), value: 131, status: 'actual' },
    { date: new Date('2025-03-01'), value: 133, status: 'actual' },
    // Forecasts
    { date: new Date('2025-04-01'), value: 135, status: 'forecast' },
    { date: new Date('2025-05-01'), value: 137, status: 'forecast' },
    { date: new Date('2025-06-01'), value: 140, status: 'forecast' },
    { date: new Date('2025-07-01'), value: 142, status: 'forecast' },
    { date: new Date('2025-08-01'), value: 145, status: 'forecast' },
];
