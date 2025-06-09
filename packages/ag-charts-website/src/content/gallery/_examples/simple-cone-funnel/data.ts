export interface DataType {
    group: string;
    value: number;
}

export function getData(): DataType[] {
    return [
        { group: 'INITIAL CONTACT', value: 20000 },
        { group: 'LEAD ENGAGEMENT', value: 15000 },
        { group: 'QUALIFIED LEADS', value: 10000 },
        { group: 'NEGOTIATION', value: 6000 },
        { group: 'DEALS CLOSED', value: 3000 },
    ];
}
