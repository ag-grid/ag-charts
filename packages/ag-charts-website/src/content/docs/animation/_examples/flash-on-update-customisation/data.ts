export interface DataType {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
}

let seed = 5678;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

function addBusinessDays(start: Date, days: number): Date {
    const result = new Date(start);
    let added = 0;
    while (added < days) {
        result.setDate(result.getDate() + 1);
        const day = result.getDay();
        if (day !== 0 && day !== 6) added++;
    }
    return result;
}

export function getInitialData(): DataType[] {
    seed = 5678;

    const data: DataType[] = [];
    const startDate = new Date('2025-01-27');
    let previousClose = 185.4;

    for (let i = 0; i < 30; i++) {
        const date = i === 0 ? new Date(startDate) : addBusinessDays(startDate, i);
        const dailyChange = (random() - 0.5) * 6;
        const open = previousClose + (random() - 0.5) * 1.5;
        const close = open + dailyChange;
        const wickUp = random() * 2;
        const wickDown = random() * 2;
        const high = Math.max(open, close) + wickUp;
        const low = Math.min(open, close) - wickDown;

        data.push({
            date,
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
        });

        previousClose = close;
    }

    return data;
}

export function applyLiveUpdate(data: DataType[]): DataType[] {
    const result = data.map((d) => ({ ...d }));
    const last = result[result.length - 1];
    const tick = (Math.random() - 0.5) * 3;
    last.close = Math.round((last.close + tick) * 100) / 100;
    last.high = Math.round(Math.max(last.high, last.close) * 100) / 100;
    last.low = Math.round(Math.min(last.low, last.close) * 100) / 100;
    return result;
}
