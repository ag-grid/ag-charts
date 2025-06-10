export interface DataType {
    month: string;
    sweaters: number;
    hats: number;
}

export function getData(): DataType[] {
    return [
        {
            month: 'Jun',
            sweaters: 50,
            hats: 40,
        },
        {
            month: 'Jul',
            sweaters: 70,
            hats: 50,
        },
        {
            month: 'Aug',
            sweaters: 60,
            hats: 30,
        },
    ];
}
