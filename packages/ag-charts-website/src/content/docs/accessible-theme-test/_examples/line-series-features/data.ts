export function getData() {
    const data: { date: Date; north: number; south: number }[] = [];
    const start = new Date(2023, 0, 1);
    const end = new Date(2025, 11, 31);
    let north = 100;
    let south = 80;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        north = Math.max(10, north + random() * 6 - 2.9);
        south = Math.max(10, south + random() * 6 - 3);
        data.push({
            date: new Date(d),
            north: Math.round(north * 100) / 100,
            south: Math.round(south * 100) / 100,
        });
    }
    return data;
}

let seed = 1234567;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}
