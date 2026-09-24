export interface DataType {
    month: string;
    low: number;
    high: number;
}

export function getData(): DataType[] {
    return [
        { month: 'March', low: 3.9, high: 11.3 },
        { month: 'April', low: 5.5, high: 14.2 },
        { month: 'May', low: 8.7, high: 17.9 },
    ];
}
