export interface RevenueDatum {
    month: string;
    revenue: number;
}

export function getData(): RevenueDatum[] {
    return [
        { month: 'Jan', revenue: 145 },
        { month: 'Feb', revenue: 162 },
        { month: 'Mar', revenue: 158 },
        { month: 'Apr', revenue: 184 },
        { month: 'May', revenue: 201 },
        { month: 'Jun', revenue: 197 },
        { month: 'Jul', revenue: 223 },
        { month: 'Aug', revenue: 236 },
    ];
}
