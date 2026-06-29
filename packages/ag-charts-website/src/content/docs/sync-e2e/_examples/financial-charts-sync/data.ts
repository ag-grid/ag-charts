export function getData(seed = 1) {
    const data: { date: Date; open: number; high: number; low: number; close: number; volume: number }[] = [];
    let rand = seed;

    const random = () => {
        rand = (rand * 9301 + 49297) % 233280;
        return rand / 233280;
    };

    let base = 140;

    for (let i = 0; i < 121; i++) {
        const date = new Date(2022, i, 1);
        const open = +(base + random() * 5 - 2.5).toFixed(6);
        const high = +(open + random() * 5).toFixed(6);
        const low = +(open - random() * 5).toFixed(6);
        const close = +(low + random() * (high - low)).toFixed(6);
        const volume = Math.floor(30000000 + random() * 10000000);

        data.push({ date, open, high, low, close, volume });
        base = close;
    }

    return data;
}
