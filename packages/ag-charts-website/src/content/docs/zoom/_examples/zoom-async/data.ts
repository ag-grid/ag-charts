/**
 * This fake database generates and returns randomised data of objects with time, price and quantity. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const Database = {
    get: () => data,
};

export const minute = 1000 * 60;
export const hour = minute * 60;
export const day = hour * 24;
export const week = day * 7;
export const month = day * 30;

export const dataStart = new Date('2024-01-01 00:00:00').getTime();
export const dataEnd = new Date('2024-12-30 23:59:59').getTime();

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

// Generate data for the fake database
const data: Array<Datum> = [];
for (let time = dataStart; time < dataEnd; time += hour) {
    let price;
    if (data.length === 0) {
        price = 100 + random() * 100;
    } else {
        price = data[data.length - 1].price + random() * 10 - 5;
    }
    data.push({ time, price });
}

export type Datum = { time: number; price: number };
