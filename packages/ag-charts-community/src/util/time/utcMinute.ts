import { durationMinute } from './duration';
import { CountableTimeInterval } from './interval';
import { utcDay } from './utcDay';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationMinute);
}

function decode(encoded: number) {
    return new Date(encoded * durationMinute);
}

export const utcMinute = new CountableTimeInterval(
    'minute',
    { milliseconds: 60 * 1000, exact: true },
    utcDay,
    encode,
    decode
);
