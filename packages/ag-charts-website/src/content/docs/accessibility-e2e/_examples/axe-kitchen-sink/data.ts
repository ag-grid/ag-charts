export interface DataType {
    month: string;
    north: number;
    south: number;
    east: number;
    west: number;
    revenue: number;
    margin: number;
    returns: number;
    growth: number;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getData(): DataType[] {
    return months.map((month, i) => ({
        month,
        north: 40 + ((i * 7) % 23),
        south: 35 + ((i * 11) % 19),
        east: 50 + ((i * 5) % 17),
        west: 30 + ((i * 13) % 21),
        revenue: 150 + i * 12 + ((i * 9) % 14),
        margin: 18 + ((i * 3) % 8),
        returns: 5 + ((i * 7) % 6),
        growth: 2 + ((i * 5) % 9),
    }));
}
