import { day } from './day';
import { durationMinute } from './duration';
import { TimeInterval } from './interval';

const offset = new Date().getTimezoneOffset() * durationMinute;

function encode(date: Date) {
    return Math.floor((date.getTime() - offset) / durationMinute);
}

function decode(encoded: number) {
    return new Date(offset + encoded * durationMinute);
}

export const minute = new TimeInterval('minute', 60 * 1000, day, encode, decode);
