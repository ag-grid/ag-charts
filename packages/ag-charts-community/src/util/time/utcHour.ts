import { durationHour } from './duration';
import { CountableTimeInterval } from './interval';
import { utcDay } from './utcDay';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationHour);
}

function decode(encoded: number) {
    return new Date(encoded * durationHour);
}

export const utcHour = new CountableTimeInterval(
    'hour',
    { milliseconds: 60 * 60 * 1000, exact: true },
    utcDay,
    encode,
    decode
);
