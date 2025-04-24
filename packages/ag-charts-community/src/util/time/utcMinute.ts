import { durationMinute } from './duration';
import { TimeInterval } from './interval';
import { utcDay } from './utcDay';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationMinute);
}

function decode(encoded: number) {
    return new Date(encoded * durationMinute);
}

export const utcMinute = new TimeInterval('minute', 60 * 1000, utcDay, encode, decode);
