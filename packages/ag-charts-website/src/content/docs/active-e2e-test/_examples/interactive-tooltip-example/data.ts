export interface DataType {
    month: string;
    sweaters: number;
}

export function getData(): DataType[] {
    return [
        {
            month: 'Jun',
            sweaters: 50,
        },
        {
            month: 'Jul',
            sweaters: 70,
        },
        {
            month: 'Aug',
            sweaters: 60,
        },
    ];
}
