export interface DataType {
    group: string;
    value: number;
}

export function getData(): DataType[] {
    return [
        { group: 'Qualify', value: 7910 },
        { group: 'Develop', value: 8170 },
        { group: 'Propose', value: 7260 },
        { group: 'Close', value: 4460 },
    ];
}
