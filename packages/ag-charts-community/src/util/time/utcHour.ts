import { durationHour } from './duration';
import { CountableTimeInterval } from './interval';
import { utcDay } from './utcDay';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationHour);
}

function decode(encoded: number) {
    return new Date(encoded * durationHour);
}

export const utcHour = new CountableTimeInterval('hour', 60 * 60 * 1000, utcDay, encode, decode);
