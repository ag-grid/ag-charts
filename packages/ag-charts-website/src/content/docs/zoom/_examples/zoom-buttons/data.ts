const day = 1000 * 60 * 60 * 24;

export const dataStart = new Date('2024-01-01 00:00:00').getTime();
export const dataEnd = new Date('2024-12-30 23:59:59').getTime();

let seed = 1;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

export function getData() {
    const data: Array<Datum> = [];
    seed = 1;
    for (let time = dataStart; time <= dataEnd; time += day) {
        let price;
        if (data.length === 0) {
            price = 1000 + random() * 100;
        } else {
            price = data[data.length - 1].price + random() * 20 - 10;
        }
        data.push({ time, price });
    }

    return data;
}

type Datum = { time: number; price: number };
