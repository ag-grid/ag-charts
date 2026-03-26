export interface DataType {
    date: Date;
    low: number;
    high: number;
}

export function getData(): DataType[] {
    return [
        { date: new Date(2024, 0, 1), low: 0.033, high: 0.037 },
        { date: new Date(2024, 1, 1), low: 0.034, high: 0.036 },
        { date: new Date(2024, 2, 1), low: 0.038, high: 0.041 },
        { date: new Date(2024, 3, 1), low: 0.039, high: 0.043 },
        { date: new Date(2024, 4, 1), low: 0.033, high: 0.04 },
        { date: new Date(2024, 5, 1), low: 0.032, high: 0.039 },
        { date: new Date(2024, 6, 1), low: 0.03, high: 0.038 },
        { date: new Date(2024, 7, 1), low: 0.029, high: 0.037 },
        { date: new Date(2024, 8, 1), low: 0.031, high: 0.039 },
        { date: new Date(2024, 9, 1), low: 0.033, high: 0.042 },
        { date: new Date(2024, 10, 1), low: 0.031, high: 0.04 },
        { date: new Date(2024, 11, 1), low: 0.03, high: 0.044 },
    ];
}
