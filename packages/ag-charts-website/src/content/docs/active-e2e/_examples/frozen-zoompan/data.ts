export type DataType = { month: string; sales: number };

export function getData(): DataType[] {
    return [
        { month: 'Jan', sales: 120 },
        { month: 'Feb', sales: 145 },
        { month: 'Mar', sales: 132 },
        { month: 'Apr', sales: 220 },
        { month: 'May', sales: 156 },
        { month: 'Jun', sales: 189 },
        { month: 'Jul', sales: 201 },
        { month: 'Aug', sales: 167 },
        { month: 'Sep', sales: 195 },
        { month: 'Oct', sales: 240 },
        { month: 'Nov', sales: 245 },
        { month: 'Dec', sales: 280 },
    ];
}
