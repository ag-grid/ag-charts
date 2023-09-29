import { durationHour } from './duration';
import { CountableTimeInterval } from './interval';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationHour);
}

function decode(encoded: number) {
    return new Date(encoded * durationHour);
}

export const utcHour = new CountableTimeInterval(encode, decode);
