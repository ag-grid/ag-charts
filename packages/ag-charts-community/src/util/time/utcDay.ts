import { durationDay } from './duration';
import { TimeInterval } from './interval';
import { utcMonth } from './utcMonth';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationDay);
}

function decode(encoded: number) {
    const d = new Date(0);
    d.setUTCDate(d.getUTCDate() + encoded);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export const utcDay = new TimeInterval(
    'day',
    { milliseconds: 24 * 60 * 60 * 1000, exact: true },
    utcMonth,
    encode,
    decode
);
