import { TimeInterval } from './interval';

function encode(date: Date) {
    return date.getFullYear();
}

function decode(encoded: number) {
    // Note: assigning years through the constructor
    // will break for years 0 - 99 AD (will turn 1900's).
    const d = new Date();
    d.setFullYear(encoded);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

export const yearMs = (365 + 1 / 4 - 1 / 100 + 1 / 400) * 24 * 60 * 60 * 1000;

export const year = new TimeInterval('year', yearMs, undefined, encode, decode);
