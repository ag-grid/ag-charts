import { isDate, isNumber, isString } from 'ag-charts-core';

type Value = number | string | Date | undefined;
export type GroupingValue = {
    value: Value;
    groupPercentage: number;
};
export type PointType = Value | GroupingValue;

export function getGroupingValue(d: PointType | undefined): GroupingValue {
    if (isNumber(d) || isString(d) || isDate(d)) {
        return { value: d, groupPercentage: 0 };
    }
    return d ?? { value: undefined, groupPercentage: 0 };
}
