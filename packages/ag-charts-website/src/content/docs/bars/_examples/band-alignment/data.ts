export interface DataType {
    quarter: string;
    museums: number;
    galleries: number;
    heritage: number;
}

export function getData(): DataType[] {
    return [
        { quarter: 'Q1', museums: 12836720, galleries: 8472190, heritage: 5631280 },
        { quarter: 'Q2', museums: 14272922, galleries: 9123450, heritage: 6284130 },
        { quarter: 'Q3', museums: 13800193, galleries: 9842310, heritage: 7123540 },
        { quarter: 'Q4', museums: 12458355, galleries: 8930240, heritage: 5429240 },
    ];
}
