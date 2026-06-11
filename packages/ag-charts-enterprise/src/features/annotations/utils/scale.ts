import { isDate, isNumericValue, isString } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

type ValueType = AgNumericValue | string | Date | undefined;
export type GroupingValueType = { value: ValueType; groupPercentage: number };
export type PointType = ValueType | GroupingValueType;

export function getGrouping(d: PointType | undefined): GroupingValueType {
    // isNumericValue: a raw bigint coordinate must take the scalar branch, not fall through
    // to be misread as a grouping object.
    if (isNumericValue(d) || isString(d) || isDate(d)) {
        return { value: d, groupPercentage: 0 };
    }
    return d ?? { value: undefined, groupPercentage: 0 };
}

export function getGroupingValue(d: PointType | undefined): ValueType {
    return getGrouping(d)?.value;
}
