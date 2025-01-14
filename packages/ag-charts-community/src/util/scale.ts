import { isDate, isNumber, isString } from 'ag-charts-core';

type Value = number | string | Date | undefined;
export type ValueType<D = Value> = D;
export type GroupingValueType<D = Value> = {
    value: ValueType<D>;
    groupPercentage: number | undefined;
};
export type PointType<D = Value> = ValueType<D> | GroupingValueType<D>;

export function getGroupingValue(d: PointType | undefined): GroupingValueType {
    if (isNumber(d) || isString(d) || isDate(d)) {
        return { value: d, groupPercentage: undefined };
    }
    return d ?? { value: undefined, groupPercentage: undefined };
}
