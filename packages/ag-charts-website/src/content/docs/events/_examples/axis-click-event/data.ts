export interface DataType {
    month: Date;
    profit: number;
    orders: number;
    sales: number;
}

export function getData(): DataType[] {
    return [
        { month: new Date(2025, 0, 1), profit: 18000, orders: 420, sales: 52000 },
        { month: new Date(2025, 1, 1), profit: 24000, orders: 510, sales: 68000 },
        { month: new Date(2025, 2, 1), profit: 31000, orders: 470, sales: 82000 },
        { month: new Date(2025, 3, 1), profit: 39000, orders: 390, sales: 96000 },
        { month: new Date(2025, 4, 1), profit: 48000, orders: 340, sales: 112000 },
        { month: new Date(2025, 5, 1), profit: 57000, orders: 310, sales: 128000 },
        { month: new Date(2025, 6, 1), profit: 63000, orders: 280, sales: 141000 },
        { month: new Date(2025, 7, 1), profit: 59000, orders: 260, sales: 136000 },
        { month: new Date(2025, 8, 1), profit: 51000, orders: 240, sales: 119000 },
        { month: new Date(2025, 9, 1), profit: 43000, orders: 220, sales: 98000 },
        { month: new Date(2025, 10, 1), profit: 35000, orders: 250, sales: 81000 },
        { month: new Date(2025, 11, 1), profit: 28000, orders: 330, sales: 69000 },
    ];
}
