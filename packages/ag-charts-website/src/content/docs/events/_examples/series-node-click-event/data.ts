export type DataType = {
    month: string;
    mean: number;
    low: number;
    high: number;
};

export function getData(): DataType[] {
    return [
        { month: 'Jan', mean: 5.2, low: 1.8, high: 9.4 },
        { month: 'Feb', mean: 6.1, low: 2.4, high: 10.2 },
        { month: 'Mar', mean: 8.7, low: 4.1, high: 13.1 },
        { month: 'Apr', mean: 11.2, low: 6.3, high: 16.4 },
        { month: 'May', mean: 14.3, low: 9.1, high: 19.8 },
        { month: 'Jun', mean: 17.2, low: 12.4, high: 22.6 },
        { month: 'Jul', mean: 19.1, low: 14.5, high: 24.8 },
        { month: 'Aug', mean: 18.7, low: 14.1, high: 24.1 },
        { month: 'Sep', mean: 16.1, low: 11.6, high: 21.3 },
        { month: 'Oct', mean: 12.5, low: 8.2, high: 17.1 },
        { month: 'Nov', mean: 8.4, low: 4.8, high: 12.3 },
        { month: 'Dec', mean: 5.9, low: 2.7, high: 9.8 },
    ];
}
