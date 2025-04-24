import { day } from './day';
import { TimeInterval } from './interval';

function encode(date: Date) {
    return date.getTime();
}

function decode(encoded: number) {
    return new Date(encoded);
}

export const millisecond = new TimeInterval('millisecond', { milliseconds: 1, exact: true }, day, encode, decode);
