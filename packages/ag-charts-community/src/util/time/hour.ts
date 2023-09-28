import { durationHour, durationMinute } from './duration';
import { CountableTimeInterval } from './interval';

const offset = new Date().getTimezoneOffset() * durationMinute;

function encode(date: Date) {
    return Math.floor((date.getTime() - offset) / durationHour);
}

function decode(encoded: number) {
    return new Date(offset + encoded * durationHour);
}

export const hour = new CountableTimeInterval(encode, decode);
export default hour;
