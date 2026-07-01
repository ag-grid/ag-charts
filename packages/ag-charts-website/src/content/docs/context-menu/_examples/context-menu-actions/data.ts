export interface DataType {
    month: string;
    sweaters: number;
    hats: number;
}

export function getData(): DataType[] {
    return [
        {
            month: 'Jul',
            sweaters: 50,
            hats: 40,
        },
        {
            month: 'Aug',
            sweaters: 70,
            hats: 50,
        },
        {
            month: 'Sep',
            sweaters: 60,
            hats: 30,
        },
    ];
}
