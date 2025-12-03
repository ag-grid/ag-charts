export interface DataType {
    month: string;
    temperature: number;
}

export function getData(): DataType[] {
    return [
        { month: 'Dec', temperature: 2 },
        { month: 'Jan', temperature: -1 },
        { month: 'Feb', temperature: 3 },
        { month: 'Mar', temperature: 8 },
        { month: 'Apr', temperature: 12 },
    ];
}
