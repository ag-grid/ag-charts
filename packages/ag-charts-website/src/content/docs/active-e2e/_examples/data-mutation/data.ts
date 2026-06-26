export type DataType = { month: string; value: number };

export function getData(): DataType[] {
    return [
        { month: 'Jan', value: 110 },
        { month: 'Feb', value: 145 },
        { month: 'Mar', value: 130 },
        { month: 'Apr', value: 170 },
        { month: 'May', value: 155 },
        { month: 'Jun', value: 190 },
    ];
}
