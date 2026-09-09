export interface DataType {
    month: string;
    units: number;
    brands: {
        [key: string]: number;
    };
}

export function getData(): DataType[] {
    return [
        { month: 'March', units: 25, brands: { BMW: 10, Toyota: 15 } },
        { month: 'April', units: 27, brands: { Ford: 17, BMW: 10 } },
        { month: 'May', units: 42, brands: { Nissan: 20, Toyota: 22 } },
    ];
}
