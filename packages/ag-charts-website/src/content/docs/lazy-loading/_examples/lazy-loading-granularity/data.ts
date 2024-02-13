/**
 * This fake database generates and returns randomised data of objects with time, price and quantity. If you are a
 * frontend developer you can safely ignore this part of the example.
 */
export const Database = {
    getHourly: () => data,
    getDaily: () => dailyData,
    getWeekly: () => weeklyData,
};

export const minute = 1000 * 60;
export const hour = minute * 60;
export const day = hour * 24;
export const week = day * 7;

const dataStart = new Date('2024-01-01 00:00:00').getTime();
const dataEnd = new Date('2024-12-30 23:59:59').getTime();

let seed = 1234;
function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

// Generate data for the fake database
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

const dailyData = data.filter(({ time }) => time % day === 0);
const weeklyData = data.filter(({ time }) => time % week === 0);

export type Datum = { time: number; price: number; quantity: number };
