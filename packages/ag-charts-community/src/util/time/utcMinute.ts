import { durationMinute } from './duration';
import { CountableTimeInterval } from './interval';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationMinute);
}

function decode(encoded: number) {
    return new Date(encoded * durationMinute);
}

export const utcMinute = new CountableTimeInterval(encode, decode);
