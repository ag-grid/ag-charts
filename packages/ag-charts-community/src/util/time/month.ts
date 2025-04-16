import { CountableTimeInterval } from './interval';
import { year } from './year';

function encode(date: Date) {
    return date.getFullYear() * 12 + date.getMonth();
}

function decode(encoded: number) {
    const y = Math.floor(encoded / 12);
    const month = encoded - y * 12;
    return new Date(y, month, 1);
}

export const month = new CountableTimeInterval(
    'month',
    { milliseconds: year.duration.milliseconds / 12, exact: false },
    year,
    encode,
    decode
);
