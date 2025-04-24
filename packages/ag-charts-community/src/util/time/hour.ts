import { day } from './day';
import { durationHour, durationMinute } from './duration';
import { TimeInterval } from './interval';

const offset = new Date().getTimezoneOffset() * durationMinute;

function encode(date: Date) {
    return Math.floor((date.getTime() - offset) / durationHour);
}

function decode(encoded: number) {
    return new Date(offset + encoded * durationHour);
}

export const hour = new TimeInterval('hour', 60 * 60 * 1000, day, encode, decode);
