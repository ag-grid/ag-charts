import { durationDay } from './duration';
import { CountableTimeInterval } from './interval';

function encode(date: Date) {
    return Math.floor(date.getTime() / durationDay);
}

function decode(encoded: number) {
    const d = new Date(0);
    d.setUTCDate(d.getUTCDate() + encoded);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export const utcDay = new CountableTimeInterval(encode, decode);
export default utcDay;
