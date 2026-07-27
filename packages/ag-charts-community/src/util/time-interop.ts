import { type RequireOptional, ambientLog } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

interface TimeIntervalBackwardsCompat extends RequireOptional<AgTimeInterval> {
    every(count: number): TimeIntervalBackwardsCompat;
}

function createTimeInterval(
    unit: AgTimeIntervalUnit,
    step: number,
    epoch: Date | undefined,
    utc: boolean | undefined
): TimeIntervalBackwardsCompat {
    return {
        unit,
        step,
        epoch,
        utc,
        every(count: number) {
            return createTimeInterval(this.unit, (this.step ?? 1) * count, this.epoch, this.utc);
        },
    };
}

const cachedInstances: Partial<Record<string, TimeIntervalBackwardsCompat>> = {};

function getTimeInterval(unit: AgTimeIntervalUnit, step = 1, epoch?: Date, utc = false): TimeIntervalBackwardsCompat {
    ambientLog.warnOnce('time import is deprecated, use object notation instead');

    const key = `${unit}:${step}:${epoch?.getTime() ?? 0}:${utc}`;
    let instance = cachedInstances[key];
    if (instance == null) {
        instance = createTimeInterval(unit, step, epoch, utc);
        cachedInstances[key] = instance;
    }
    return instance;
}

export const time = {
    get millisecond() {
        return getTimeInterval('millisecond');
    },
    get second() {
        return getTimeInterval('second');
    },
    get minute() {
        return getTimeInterval('minute');
    },
    get hour() {
        return getTimeInterval('hour');
    },
    get day() {
        return getTimeInterval('day');
    },
    get monday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 5));
    },
    get tuesday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 6));
    },
    get wednesday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 7));
    },
    get thursday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 1));
    },
    get friday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 2));
    },
    get saturday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 3));
    },
    get sunday() {
        return getTimeInterval('day', 7, new Date(1970, 0, 4));
    },
    get month() {
        return getTimeInterval('month');
    },
    get year() {
        return getTimeInterval('year');
    },
    get utcMillisecond() {
        return getTimeInterval('millisecond', 1, undefined, true);
    },
    get utcSecond() {
        return getTimeInterval('second', 1, undefined, true);
    },
    get utcMinute() {
        return getTimeInterval('minute', 1, undefined, true);
    },
    get utcHour() {
        return getTimeInterval('hour', 1, undefined, true);
    },
    get utcDay() {
        return getTimeInterval('day', 1, undefined, true);
    },
    get utcMonth() {
        return getTimeInterval('month', 1, undefined, true);
    },
    get utcYear() {
        return getTimeInterval('year', 1, undefined, true);
    },
};
