export interface DataType {
    group: string;
    value: number;
}

export function getData(): DataType[] {
    return [
        { group: 'Page Visit', value: 490 },
        { group: 'Enquiry', value: 340 },
        { group: 'Quote', value: 300 },
        { group: 'Sale', value: 290 },
    ];
}
