const dataStart = new Date('2024-01-01 00:00:00').getTime();
const dataEnd = new Date('2024-07-01 00:00:00').getTime();

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const week = day * 7;

type Datum = { time: number; price: number; quantity: number };

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

const data: Array<Datum> = [];
for (let time = dataStart; time < dataEnd; time += hour) {
    let price;
    let quantity;
    if (data.length === 0) {
        price = random() * 100;
    } else {
        price = data[data.length - 1].price + random() * 10 - 5;
    }
    quantity = random() * 10;
    data.push({ time, price, quantity });
}

export function getData(windowStart: number, windowEnd: number) {
    const diff = windowEnd - windowStart;
    let granularity = day;
    if (diff < day * 4) {
        granularity = hour;
    } else if (diff < week * 2) {
        granularity = hour * 6;
    }
    return delay(0).then(() =>
        data.filter(({ time }) => {
            const isCoarse = time % day === 0;
            const isFineWithinWindow = time % granularity === 0 && time >= windowStart && time <= windowEnd;
            return isCoarse || isFineWithinWindow;
        })
    );
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
