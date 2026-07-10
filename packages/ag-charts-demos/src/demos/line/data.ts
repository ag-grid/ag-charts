export interface VisitorsDatum {
    month: string;
    visitors: number;
}

export function getData(): VisitorsDatum[] {
    return [
        { month: 'Jan', visitors: 3200 },
        { month: 'Feb', visitors: 3450 },
        { month: 'Mar', visitors: 3980 },
        { month: 'Apr', visitors: 4210 },
        { month: 'May', visitors: 4600 },
        { month: 'Jun', visitors: 4380 },
        { month: 'Jul', visitors: 5020 },
        { month: 'Aug', visitors: 5460 },
    ];
}
