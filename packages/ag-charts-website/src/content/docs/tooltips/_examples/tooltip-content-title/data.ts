export interface DataType {
    month: string;
    sweaters: number;
    hats: number;
}

export function getData(): DataType[] {
    return [
        {
            month: 'Dec',
            sweaters: 50,
            hats: 40,
        },
        {
            month: 'Jan',
            sweaters: 70,
            hats: 50,
        },
        {
            month: 'Feb',
            sweaters: 60,
            hats: 30,
        },
    ];
}
