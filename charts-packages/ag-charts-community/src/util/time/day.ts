import { CountableTimeInterval } from "./interval";
import { durationDay, durationMinute } from "./duration";

function floor(date: Date) {
    date.setHours(0, 0, 0, 0);
}
function offset(date: Date, days: number) {
    date.setDate(date.getDate() + days);
}
function count(start: Date, end: Date): number {
    const tzMinuteDelta = end.getTimezoneOffset() - start.getTimezoneOffset();
    return (end.getTime() - start.getTime() - tzMinuteDelta * durationMinute) / durationDay;
}
function field(date: Date): number {
    return date.getDate() - 1;
}

export const day = new CountableTimeInterval(floor, offset, count, field);
export default day;
