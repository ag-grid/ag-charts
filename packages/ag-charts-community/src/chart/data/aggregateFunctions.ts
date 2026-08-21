import { addValues, isFiniteNumber, subtractValues } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { ContinuousDomain } from './dataDomain';
import type { AggregatePropertyDefinition, DatumPropertyDefinition } from './dataModel';

/** Adds two operands, promoting to bigint when either is, so a bigint column's `0` seed stays exact. */
export function addAccumulated(acc: AgNumericValue, value: AgNumericValue): AgNumericValue {
    return addValues(acc, value);
}

export function sumValues(
    values: any[],
    accumulator: [AgNumericValue, AgNumericValue] = [0, 0]
): [AgNumericValue, AgNumericValue] {
    for (const value of values) {
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            continue;
        }
        // addAccumulated keeps bigint totals exact; the unused-sign side retains its Number seed (mixed accumulator type).
        if (value < 0) {
            accumulator[0] = addAccumulated(accumulator[0], value);
        }
        if (value > 0) {
            accumulator[1] = addAccumulated(accumulator[1], value);
        }
    }
    return accumulator;
}

export function sum(id: string, matchGroupId: string) {
    const result: AggregatePropertyDefinition<any, any, [AgNumericValue, AgNumericValue]> = {
        id,
        matchGroupIds: [matchGroupId],
        type: 'aggregate',
        aggregateFunction: (values) => sumValues(values),
    };

    return result;
}

export function groupSum(
    id: string,
    opts?: { matchGroupId?: string; visible?: boolean }
): AggregatePropertyDefinition<any, any, [AgNumericValue, AgNumericValue]> {
    const visible = opts?.visible ?? true;
    return {
        id,
        type: 'aggregate',
        matchGroupIds: opts?.matchGroupId ? [opts?.matchGroupId] : undefined,
        aggregateFunction: (values) => sumValues(values),
        groupAggregateFunction: (next, acc = [0, 0]) => {
            if (visible) {
                acc[0] = addAccumulated(acc[0], next?.[0] ?? 0);
                acc[1] = addAccumulated(acc[1], next?.[1] ?? 0);
            }
            return acc;
        },
    };
}

export function range(id: string, matchGroupId: string) {
    const result: AggregatePropertyDefinition<any, any, [AgNumericValue, AgNumericValue]> = {
        id,
        matchGroupIds: [matchGroupId],
        type: 'aggregate',
        aggregateFunction: (values) => ContinuousDomain.extendDomain(values),
    };

    return result;
}

export function groupCount(
    id: string,
    opts?: { visible?: boolean }
): AggregatePropertyDefinition<any, any, [number, number]> {
    const visible = opts?.visible ?? true;
    return {
        id,
        type: 'aggregate',
        aggregateFunction: () => [0, 1],
        groupAggregateFunction: (next, acc = [0, 0]) => {
            if (visible) {
                acc[0] += next?.[0] ?? 0;
                acc[1] += next?.[1] ?? 0;
            }
            return acc;
        },
    };
}

export function groupAverage(id: string, opts?: { matchGroupId?: string; visible?: boolean }) {
    const visible = opts?.visible ?? true;
    const def: AggregatePropertyDefinition<
        any,
        any,
        [AgNumericValue, AgNumericValue],
        [AgNumericValue, AgNumericValue, number]
    > = {
        id,
        matchGroupIds: opts?.matchGroupId ? [opts?.matchGroupId] : undefined,
        type: 'aggregate',
        aggregateFunction: (values) => sumValues(values),
        groupAggregateFunction: (next, acc = [0, 0, -1]) => {
            if (visible) {
                acc[0] = addAccumulated(acc[0], next?.[0] ?? 0);
                acc[2]++;
                acc[1] = addAccumulated(acc[1], next?.[1] ?? 0);
            }
            return acc;
        },
        finalFunction: (acc = [0, 0, 0]) => {
            // A mean is fractional, so narrow the bigint sums to Number for the division.
            const result = Number(acc[0]) + Number(acc[1]);
            if (result >= 0) {
                return [0, result / acc[2]];
            }
            return [result / acc[2], 0];
        },
    };

    return def;
}

export function area(id: string, aggFn: AggregatePropertyDefinition<any, any, any>, matchGroupId?: string) {
    const result: AggregatePropertyDefinition<any, any, [number, number]> = {
        id,
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
        type: 'aggregate',
        aggregateFunction: (values, keyRange = []) => {
            // Subtract bigint key edges before narrowing: narrowing first collapses the width to 0 beyond a double's ULP.
            const keyWidth = Number(subtractValues(keyRange[1], keyRange[0]));
            return aggFn.aggregateFunction(values).map((v: AgNumericValue) => Number(v) / keyWidth) as [number, number];
        },
    };

    if (aggFn.groupAggregateFunction) {
        result.groupAggregateFunction = aggFn.groupAggregateFunction;
    }

    return result;
}

export function accumulatedValue(onlyPositive?: boolean): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value: AgNumericValue = 0;

        return (datum: any) => {
            if (typeof datum === 'bigint') {
                value = addAccumulated(value, onlyPositive && datum < 0n ? 0n : datum);
                return value;
            }
            if (!isFiniteNumber(datum)) {
                return datum;
            }

            value = addAccumulated(value, onlyPositive ? Math.max(0, datum) : datum);
            return value;
        };
    };
}

export function trailingAccumulatedValue(): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value: AgNumericValue = 0;

        return (datum: any) => {
            if (typeof datum !== 'bigint' && !isFiniteNumber(datum)) {
                return datum;
            }
            // Promote the seed before capturing the trailing value so a bigint column stays uniformly bigint.
            if (typeof datum === 'bigint' && typeof value !== 'bigint') {
                value = 0n;
            }

            const trailingValue = value;
            value = addAccumulated(value, datum);
            return trailingValue;
        };
    };
}
