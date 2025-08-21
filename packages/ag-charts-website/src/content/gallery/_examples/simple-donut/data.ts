export interface DataType {
    type: string;
    count: number;
}

export function getData(): DataType[] {
    // UK dwelling fire statistics - based on real Home Office data patterns
    return [
        { type: 'Houses', count: 15349 },
        { type: 'Bungalows', count: 1656 },
        { type: 'Converted Maisonettes', count: 2147 },
        { type: 'Low Rise Flats (1-3 floors)', count: 4954 },
        { type: 'Medium Rise Flats (4-9 floors)', count: 1887 },
        { type: 'High Rise Flats (10+ floors)', count: 820 },
        { type: 'Dwelling', count: 610 },
        { type: 'Other', count: 2147 },
    ];
}
