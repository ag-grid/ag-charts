import { CountableTimeInterval } from "./interval";

function floor(date: Date) {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
}
function offset(date: Date, months: number) {
    date.setMonth(date.getMonth() + months);
}
function count(start: Date, end: Date): number {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}
function field(date: Date): number {
    return date.getMonth();
}

export const month = new CountableTimeInterval(floor, offset, count, field);
export default month;
