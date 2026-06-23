import { createSeededRandom } from './seededRandom';

/**
 * This fake database generates and returns randomised data of objects with time, price and quantity. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const Database = {
    get: () => (data ??= generate(seed)),
    // Re-generate the dataset with a new seed so a reload returns a visibly different price series, mimicking
    // fresh data arriving from a real server.
    refresh: () => {
        seed += 1;
        data = generate(seed);
    },
};

export const minute = 1000 * 60;
export const hour = minute * 60;
export const day = hour * 24;
export const week = day * 7;
export const month = day * 30;

export const dataStart = new Date('2019-01-01 00:00:00').getTime();
export const dataEnd = new Date('2024-12-30 23:59:59').getTime();

let data: Array<Datum> | undefined;
let seed = 1;

const center = 1000;

function generate(seed: number): Array<Datum> {
    const random = createSeededRandom(seed);
    const result: Array<Datum> = [];
    for (let time = dataStart; time < dataEnd; time += hour) {
        let price;
        if (result.length === 0) {
            price = center + random() * 100;
        } else if (result.length < 5) {
            price = result[result.length - 1].price + random() * 20 - 10;
        } else {
            const avg = result.slice(result.length - 5).reduce((a, v) => a + v.price, 0) / 5;
            // Mean-reverting random walk: a gentle pull back towards the centre keeps the series within the
            // chart's fixed y-axis range for any seed, so each reload looks different without clipping.
            price = avg + (random() * 50 - 25) + (center - avg) * 0.002;
        }
        result.push({ time, price });
    }
    return result;
}

export type Datum = { time: number; price: number };
