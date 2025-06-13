export type TradeDatum = { date: Date; open: number; high: number; low: number; close: number };

export function getData() {
    return [
        { date: new Date(2024, 0, 1), open: 120, high: 125, low: 118, close: 123 },
        { date: new Date(2024, 0, 2), open: 123, high: 127, low: 122, close: 126 },
        { date: new Date(2024, 0, 3), open: 126, high: 130, low: 124, close: 128 },
        { date: new Date(2024, 0, 4), open: 128, high: 132, low: 127, close: 130 },
        { date: new Date(2024, 0, 5), open: 130, high: 133, low: 129, close: 131 },
        { date: new Date(2024, 0, 6), open: 131, high: 135, low: 130, close: 134 },
        { date: new Date(2024, 0, 7), open: 134, high: 137, low: 133, close: 136 },
        { date: new Date(2024, 0, 8), open: 136, high: 140, low: 135, close: 138 },
        { date: new Date(2024, 0, 9), open: 138, high: 142, low: 137, close: 141 },
        { date: new Date(2024, 0, 10), open: 141, high: 145, low: 140, close: 144 },
    ];
}
