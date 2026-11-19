export function getData() {
    const start = new Date(2024, 4, 13, 9, 30);
    const data = [];
    for (let i = 0; i <= 78; i++) {
        const date = new Date(start.getTime() + i * 5 * 60 * 1000);
        const price = 101.4 + 1.6 * Math.sin(i / 9) + 0.55 * Math.sin(i / 2.3) + 0.013 * i;
        data.push({ date, price: Math.round(price * 100) / 100 });
    }
    return data;
}
