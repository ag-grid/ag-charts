import { TimeInterval } from './interval';
import { year } from './year';

function encode(date: Date) {
    return date.getUTCFullYear();
}

function decode(encoded: number) {
    // Note: assigning years through the constructor
    // will break for years 0 - 99 AD (will turn 1900's).
    const d = new Date();
    d.setUTCFullYear(encoded);
    d.setUTCMonth(0, 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export const utcYear = new TimeInterval('year', year.milliseconds, undefined, encode, decode);
