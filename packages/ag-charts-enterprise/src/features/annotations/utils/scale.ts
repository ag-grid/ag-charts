import { isDate, isNumber, isString } from 'ag-charts-core';

type ValueType = number | string | Date | undefined;
export type GroupingValueType = { value: ValueType; groupPercentage: number };
export type PointType = ValueType | GroupingValueType;

export function getGrouping(d: PointType | undefined): GroupingValueType {
    if (isNumber(d) || isString(d) || isDate(d)) {
        return { value: d, groupPercentage: 0 };
    }
    return d ?? { value: undefined, groupPercentage: 0 };
}

export function getGroupingValue(d: PointType | undefined): ValueType {
    return getGrouping(d)?.value;
}
