export interface DataType {
    quarter: string;
    petrol: number;
    diesel: number;
}

export function getData(): DataType[] {
    return [
        {
            quarter: 'Q1',
            petrol: 200,
            diesel: 100,
        },
        {
            quarter: 'Q2',
            petrol: 300,
            diesel: 130,
        },
        {
            quarter: 'Q3',
            petrol: 350,
            diesel: 160,
        },
        {
            quarter: 'Q4',
            petrol: 400,
            diesel: 200,
        },
    ];
}
