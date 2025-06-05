export interface DataType {
    group: string;
    value: number;
}

export function getData(): DataType[] {
    return [
        { group: 'Website Visitors', value: 15000 },
        { group: 'Sign-Ups', value: 12000 },
        { group: 'Product Trials', value: 7000 },
        { group: 'Qualified Leads', value: 4000 },
        { group: 'Purchases', value: 1200 },
    ];
}
