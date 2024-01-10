import { durationDay, durationMinute } from './duration';
import { CountableTimeInterval } from './interval';

function encode(date: Date) {
    const tzOffsetMs = date.getTimezoneOffset() * durationMinute;

    return Math.floor((date.getTime() - tzOffsetMs) / durationDay);
}

function decode(encoded: number) {
    const d = new Date(1970, 0, 1);
    d.setDate(d.getDate() + encoded);

    return d;
}

export const day = new CountableTimeInterval(encode, decode);
export default day;
