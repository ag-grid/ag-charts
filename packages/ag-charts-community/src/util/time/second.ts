import { day } from './day';
import { durationMinute, durationSecond } from './duration';
import { CountableTimeInterval } from './interval';

const offset = new Date().getTimezoneOffset() * durationMinute;

function encode(date: Date) {
    return Math.floor((date.getTime() - offset) / durationSecond);
}

function decode(encoded: number) {
    return new Date(offset + encoded * durationSecond);
}

export const second = new CountableTimeInterval('second', { milliseconds: 1000, exact: true }, day, encode, decode);
