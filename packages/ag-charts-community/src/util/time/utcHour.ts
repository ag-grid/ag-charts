import { durationHour } from './duration';
import { TimeInterval } from './interval';
import { utcDay } from './utcDay';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationHour);
}

function decode(encoded: number) {
    return new Date(encoded * durationHour);
}

export const utcHour = new TimeInterval('hour', { milliseconds: 60 * 60 * 1000, exact: true }, utcDay, encode, decode);
