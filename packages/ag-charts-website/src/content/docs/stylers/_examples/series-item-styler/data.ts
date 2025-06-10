export interface DataType {
    country: string;
    gdp: number;
}

export function getData(): DataType[] {
    return [
        { country: 'Spain', gdp: 1419 },
        { country: 'UK', gdp: 2855 },
        { country: 'Germany', gdp: 3948 },
        { country: 'France', gdp: 2778 },
    ];
}
