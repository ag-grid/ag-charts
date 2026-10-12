export type DataType = {
    date: Date;
    price: number;
    volume: number;
};

export function getData(): DataType[] {
    return [
        { date: new Date(2024, 2, 1), price: 152.4, volume: 41.2 },
        { date: new Date(2024, 2, 4), price: 154.1, volume: 38.6 },
        { date: new Date(2024, 2, 5), price: 151.8, volume: 45.9 },
        { date: new Date(2024, 2, 6), price: 153.6, volume: 36.4 },
        { date: new Date(2024, 2, 7), price: 156.2, volume: 52.3 },
        { date: new Date(2024, 2, 8), price: 157.9, volume: 48.7 },
        { date: new Date(2024, 2, 11), price: 156.4, volume: 33.1 },
        { date: new Date(2024, 2, 12), price: 158.8, volume: 39.8 },
        { date: new Date(2024, 2, 13), price: 161.3, volume: 57.4 },
        { date: new Date(2024, 2, 14), price: 160.2, volume: 44.0 },
        { date: new Date(2024, 2, 15), price: 162.7, volume: 61.5 },
        { date: new Date(2024, 2, 18), price: 161.1, volume: 37.9 },
        { date: new Date(2024, 2, 19), price: 159.4, volume: 42.6 },
        { date: new Date(2024, 2, 20), price: 160.8, volume: 35.2 },
        { date: new Date(2024, 2, 21), price: 163.5, volume: 50.8 },
        { date: new Date(2024, 2, 22), price: 165.2, volume: 55.1 },
        { date: new Date(2024, 2, 25), price: 164.0, volume: 34.7 },
        { date: new Date(2024, 2, 26), price: 166.3, volume: 46.3 },
        { date: new Date(2024, 2, 27), price: 167.9, volume: 58.9 },
        { date: new Date(2024, 2, 28), price: 166.6, volume: 40.4 },
    ];
}
