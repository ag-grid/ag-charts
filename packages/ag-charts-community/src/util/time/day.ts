import { durationDay } from './duration';
import { CountableTimeInterval } from './interval';

function encode(date: Date) {
    const tzOffsetMs = date.getTimezoneOffset() * 60_000;

    return Math.floor((date.getTime() - tzOffsetMs) / durationDay);
}

function decode(encoded: number) {
    const d = new Date(1970, 0, 1);
    d.setDate(d.getDate() + encoded);

    return d;
}

export const day = new CountableTimeInterval(encode, decode);
export default day;
