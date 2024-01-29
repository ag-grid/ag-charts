const dataStart = new Date('2024-01-01 00:00:00').getTime();
const dataEnd = new Date('2024-07-01 00:00:00').getTime();

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;

type Datum = { time: number; value: number };

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

const data: Array<Datum> = [];
for (let time = dataStart; time < dataEnd; time += hour) {
    let value;
    if (data.length === 0) {
        value = random() * 100;
    } else {
        value = data[data.length - 1].value + random() * 10 - 5;
    }
    data.push({ time, value });
}

const coarseData = data.filter(({ time }) => time % day === 0);

export function getCoarseData() {
    return coarseData;
}

export function getCoarseWithWindowData(windowStart: number, windowEnd: number) {
    const diff = windowEnd - windowStart;
    let granularity = day;
    if (diff < day * 4) {
        granularity = hour;
    } else if (diff < week * 2) {
        granularity = hour * 6;
    } else {
        return coarseData;
    }
    return data.filter(
        ({ time }) => time % day === 0 || (time % granularity === 0 && time >= windowStart && time <= windowEnd)
    );
}
