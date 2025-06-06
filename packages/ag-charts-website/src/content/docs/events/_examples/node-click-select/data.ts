export interface DataType {
    month: string;
    units: number;
    brands: {
        [key: string]: number;
    };
    selected: boolean;
}

const selectedMonths = new Set<string>();

export function getData(): DataType[] {
    return [
        { month: 'March', units: 25, brands: { BMW: 10, Toyota: 15 }, selected: selectedMonths.has('March') },
        { month: 'April', units: 27, brands: { Ford: 17, BMW: 10 }, selected: selectedMonths.has('April') },
        { month: 'May', units: 42, brands: { Nissan: 20, Toyota: 22 }, selected: selectedMonths.has('May') },
    ];
}
