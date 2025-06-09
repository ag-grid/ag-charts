export interface DataType {
    month: string;
    sweaters: number;
    hats?: number;
}

export const data1: DataType[] = [
    { month: 'Jun', sweaters: 50, hats: 40 },
    { month: 'Jul', sweaters: 70, hats: 50 },
    { month: 'Aug', sweaters: 60, hats: 30 },
];

export const data2: DataType[] = [
    { month: 'Jun', sweaters: 50 },
    { month: 'Jul', sweaters: 70 },
    { month: 'Aug', sweaters: 60 },
];
