import { addValues, isFiniteNumber } from 'ag-charts-core';

import { ContinuousDomain } from './dataDomain';
import type { AggregatePropertyDefinition, DatumPropertyDefinition } from './dataModel';

/**
 * Adds two accumulator operands, promoting to bigint when either operand is. Columns are uniformly
 * typed, so a bigint column's number `0` seed promotes to `0n` on the first value and stays bigint.
 */
export function addAccumulated(acc: number | bigint, value: number | bigint): number | bigint {
    return addValues(acc, value);
}

export function sumValues(
    values: any[],
    accumulator: [number | bigint, number | bigint] = [0, 0]
): [number | bigint, number | bigint] {
    for (const value of values) {
        if (typeof value !== 'number' && typeof value !== 'bigint') {
            continue;
        }
        // Sum in bigint when a value is bigint so a large-magnitude total stays exact (addAccumulated
        // promotes the 0 seed). The opposite-sign side keeps its untouched Number seed — hence the mixed
        // accumulator type; downstream consumers recombine the two sides with addAccumulated.
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
    const result: AggregatePropertyDefinition<any, any, [number | bigint, number | bigint]> = {
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
): AggregatePropertyDefinition<any, any, [number | bigint, number | bigint]> {
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
    const result: AggregatePropertyDefinition<any, any, [number | bigint, number | bigint]> = {
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
        [number | bigint, number | bigint],
        [number | bigint, number | bigint, number]
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
            // Area is a density (value / key-width) → fractional, so narrow bigint sums and bigint keys to
            // Number for the division.
            const keyWidth = Number(keyRange[1]) - Number(keyRange[0]);
            return aggFn.aggregateFunction(values).map((v: number | bigint) => Number(v) / keyWidth) as [
                number,
                number,
            ];
        },
    };

    if (aggFn.groupAggregateFunction) {
        result.groupAggregateFunction = aggFn.groupAggregateFunction;
    }

    return result;
}

export function accumulatedValue(onlyPositive?: boolean): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value: number | bigint = 0;

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
        let value: number | bigint = 0;

        return (datum: any) => {
            if (typeof datum !== 'bigint' && !isFiniteNumber(datum)) {
                return datum;
            }
            // Promote the seed before capturing the trailing value so a bigint column's first
            // trailing entry is 0n, keeping the whole column uniformly bigint (AG-16608 AC #10).
            if (typeof datum === 'bigint' && typeof value !== 'bigint') {
                value = 0n;
            }

            const trailingValue = value;
            value = addAccumulated(value, datum);
            return trailingValue;
        };
    };
}
