import { TimeInterval } from './interval';
import { month } from './month';
import { utcYear } from './utcYear';

function encode(date: Date) {
    return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function decode(encoded: number) {
    const year = Math.floor(encoded / 12);
    const m = encoded - year * 12;
    return new Date(Date.UTC(year, m, 1));
}

export const utcMonth = new TimeInterval('month', month.milliseconds, utcYear, encode, decode);
