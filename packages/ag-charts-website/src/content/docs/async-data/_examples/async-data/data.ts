import { createSeededRandom } from './seededRandom';

/**
 * This fake database generates and returns randomised data of objects with time, price and quantity. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const Database = {
    get: () => (data ??= generate()),
};

export const minute = 1000 * 60;
export const hour = minute * 60;
export const day = hour * 24;
export const week = day * 7;
export const month = day * 30;

export const dataStart = new Date('2019-01-01 00:00:00').getTime();
export const dataEnd = new Date('2024-12-30 23:59:59').getTime();

let data: Array<Datum> | undefined;

function generate(): Array<Datum> {
    const random = createSeededRandom(1);
    const result: Array<Datum> = [];
    for (let time = dataStart; time < dataEnd; time += hour) {
        let price;
        if (result.length === 0) {
            price = 1000 + random() * 100;
        } else if (result.length < 5) {
            price = result[result.length - 1].price + random() * 20 - 10;
        } else {
            const avg = result.slice(result.length - 5).reduce((a, v) => a + v.price, 0) / 5;
            price = avg + (random() * 50 - 25);
        }
        result.push({ time, price });
    }
    return result;
}

export type Datum = { time: number; price: number };
