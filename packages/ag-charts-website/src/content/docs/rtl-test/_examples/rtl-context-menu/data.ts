export interface DataType {
    month: string;
    sales: number;
    revenue: number;
}

export function getData(): DataType[] {
    return [
        { month: 'ינואר', sales: 150, revenue: 200 },
        { month: 'פברואר', sales: 230, revenue: 310 },
        { month: 'מרץ', sales: 180, revenue: 250 },
        { month: 'אפריל', sales: 290, revenue: 380 },
        { month: 'מאי', sales: 210, revenue: 290 },
        { month: 'יוני', sales: 260, revenue: 350 },
    ];
}
