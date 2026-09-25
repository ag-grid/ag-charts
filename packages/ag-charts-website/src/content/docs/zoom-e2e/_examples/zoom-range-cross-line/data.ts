export function getData() {
    return Array.from({ length: 52 }, (_, i) => ({
        date: new Date(2019, 0, 7 + i * 7),
        price: 120 + 10 * Math.sin(i / 4),
    }));
}
