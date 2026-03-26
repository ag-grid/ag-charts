export function getData() {
    const data: { date: Date; value: number }[] = [];
    const start = new Date(2024, 6, 1);
    const end = new Date(2024, 11, 31);
    let value = 100;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        value += random() * 6 - 3;
        value = Math.max(10, value);
        data.push({ date: new Date(d), value: Math.round(value * 100) / 100 });
    }
    return data;
}

let seed = 1234567;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
