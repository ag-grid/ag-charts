export interface DataType {
    month: string;
    units: number;
    brands: {
        [key: string]: number;
    };
}
