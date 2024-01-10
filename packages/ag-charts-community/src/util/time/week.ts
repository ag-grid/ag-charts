import { durationMinute, durationWeek } from './duration';
import { CountableTimeInterval } from './interval';

// Set date to n-th day of the week.
function weekday(weekStart: number): CountableTimeInterval {
    const dayShift = (7 + weekStart - 4) % 7;

    function encode(date: Date) {
        const tzOffsetMs = date.getTimezoneOffset() * durationMinute;

        return Math.floor((date.getTime() - tzOffsetMs) / durationWeek - dayShift / 7);
    }

    function decode(encoded: number) {
        const d = new Date(1970, 0, 1);
        d.setDate(d.getDate() + encoded * 7 + dayShift);

        return d;
    }

    return new CountableTimeInterval(encode, decode);
}

export const sunday = weekday(0);
export const monday = weekday(1);
export const tuesday = weekday(2);
export const wednesday = weekday(3);
export const thursday = weekday(4);
export const friday = weekday(5);
export const saturday = weekday(6);

export default sunday;
