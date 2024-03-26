import { arraysEqual } from '../../util/array';
import { memo } from '../../util/memo';
import { clamp, isNegative } from '../../util/number';
import { isArray, isFiniteNumber } from '../../util/type-guards';
import { checkDatum, transformIntegratedCategoryValue } from '../../util/value';
import { ContinuousDomain } from './dataDomain';
import type {
    AggregatePropertyDefinition,
    DatumPropertyDefinition,
    GroupValueProcessorDefinition,
    ProcessedData,
    ProcessorOutputPropertyDefinition,
    PropertyId,
    PropertyValueProcessorDefinition,
    ReducerOutputPropertyDefinition,
} from './dataModel';

type KeyType = string | number | object;

export function createDatumId(keys: KeyType | KeyType[], ...extraKeys: (string | number)[]) {
    let result;
    if (isArray(keys)) {
        result = keys.map((key) => transformIntegratedCategoryValue(key)).join('___');
    } else {
        result = transformIntegratedCategoryValue(keys);
    }

    const primitiveType = typeof result === 'string' || typeof result === 'number' || result instanceof Date;
    if (primitiveType && extraKeys.length > 0) {
        result += `___${extraKeys.join('___')}`;
    }

    return result;
}

// no scope
// bar, box-plot, candlestick, range-bar, waterfall
export const SMALLEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'smallestKeyInterval'> = {
    type: 'reducer',
    property: 'smallestKeyInterval',
    initialValue: Infinity,
    reducer: () => {
        let prevX = NaN;
        return (smallestSoFar = Infinity, next) => {
            const nextX = next.keys[0];
            const interval = Math.abs(nextX - prevX);
            prevX = nextX;
            if (!isNaN(interval) && interval > 0 && interval < smallestSoFar) {
                return interval;
            }
            return smallestSoFar;
        };
    },
};

// no scope
// histogram
export const SORT_DOMAIN_GROUPS: ProcessorOutputPropertyDefinition<'sortedGroupDomain'> = {
    type: 'processor',
    property: 'sortedGroupDomain',
    calculate: ({ domain: { groups } }) =>
        groups?.slice().sort((a, b) => {
            for (let i = 0; i < a.length; i++) {
                const result = a[i] - b[i];
                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        }),
};

// no scope
// area, bar, histogram, line-donut- pie, box-plot, bullet, candlestick, radial-bar, radial-column, range-area, range-bar
export function diff(
    previousData: ProcessedData<any>,
    updateMovedData: boolean = true
): ProcessorOutputPropertyDefinition<'diff'> {
    return {
        type: 'processor',
        property: 'diff',
        calculate: (processedData) => {
            const moved = new Map<string, any>();
            const added = new Map<string, any>();
            const updated = new Map<string, any>();
            const removed = new Map<string, any>();

            const length = Math.max(previousData.data.length, processedData.data.length);

            for (let i = 0; i < length; i++) {
                const prev = previousData.data[i];
                const datum = processedData.data[i];

                const prevId = prev ? createDatumId(prev.keys) : '';
                const datumId = datum ? createDatumId(datum.keys) : '';

                if (datum && prev && prevId === datumId) {
                    if (!arraysEqual(prev.values, datum.values)) {
                        updated.set(datumId, datum);
                    }
                    continue;
                }

                if (removed.has(datumId)) {
                    if (updateMovedData || !arraysEqual(removed.get(datumId).values, datum.values)) {
                        updated.set(datumId, datum);
                        moved.set(datumId, datum);
                    }
                    removed.delete(datumId);
                } else if (datum) {
                    added.set(datumId, datum);
                }

                if (added.has(prevId)) {
                    if (updateMovedData || !arraysEqual(added.get(prevId).values, prev.values)) {
                        updated.set(prevId, prev);
                        moved.set(prevId, prev);
                    }
                    added.delete(prevId);
                } else if (prev) {
                    updated.delete(prevId);
                    removed.set(prevId, prev);
                }
            }

            const changed = added.size > 0 || updated.size > 0 || removed.size > 0;
            return { changed, added, updated, removed, moved };
        },
    };
}

// scoped
// area, bar, radial-bar, radial-column
export function normaliseGroupTo(
    matchGroupIds: string[],
    normaliseTo: number
): GroupValueProcessorDefinition<any, any> {
    return {
        type: 'group-value-processor',
        matchGroupIds,
        adjust: memo({ normaliseTo }, normaliseFnBuilder),
    };
}

// scoped
// donut, pie
export function normalisePropertyToRatio(
    property: PropertyId<any>,
    zeroDomain: number,
    rangeMin?: number,
    rangeMax?: number
): PropertyValueProcessorDefinition<any> {
    return {
        type: 'property-value-processor',
        property,
        adjust: memo({ rangeMin, rangeMax, zeroDomain }, normalisePropertyFnBuilder),
    };
}

// scoped
// area, bar, line, donut, pie, box-plot, bullet, candlestick, radar, radial-bar, radial-column, range-area, range-bar, waterfall
export function animationValidation(valueKeyIds?: string[]): ProcessorOutputPropertyDefinition {
    return {
        type: 'processor',
        property: 'animationValidation',
        calculate(result: ProcessedData<any>) {
            const { keys, values } = result.defs;
            const { input, data } = result;
            let uniqueKeys = true;
            let orderedKeys = true;

            const valueKeys: [number, DatumPropertyDefinition<unknown>][] = [];
            for (let k = 0; k < values.length; k++) {
                if (valueKeyIds?.includes(values[k].id as string)) {
                    valueKeys.push([k, values[k]]);
                }
            }

            const processKey = (idx: number, def: DatumPropertyDefinition<unknown>, type: 'keys' | 'values') => {
                if (def.valueType === 'category') {
                    const keyValues = result.domain[type][idx];
                    uniqueKeys &&= keyValues.length === input.count;
                    return;
                }

                let lastValue = data[0]?.[type][idx];
                for (let d = 1; (uniqueKeys || orderedKeys) && d < data.length; d++) {
                    const keyValue = data[d][type][idx];
                    orderedKeys &&= lastValue <= keyValue;
                    uniqueKeys &&= lastValue !== keyValue;
                    lastValue = keyValue;
                }
            };

            for (let k = 0; (uniqueKeys || orderedKeys) && k < keys.length; k++) {
                processKey(k, keys[k], 'keys');
            }

            for (let k = 0; (uniqueKeys || orderedKeys) && k < valueKeys.length; k++) {
                const [idx, key] = valueKeys[k];
                processKey(idx, key, 'values');
            }

            return { uniqueKeys, orderedKeys };
        },
    };
}

// scoped
// area, bar, bubble, histogram, line, scatter, donut, pie, box-plot, bullet, candlestick, radial-bar, radial-column, range-area, range-bar, waterfall
export function keyProperty<K>(propName: K, continuous: boolean, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'key',
        valueType: continuous ? 'range' : 'category',
        validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation,
        ...opts,
    };
    return result;
}

// scoped
// area, bar, bubble, histogram, line, scatter, donut, pie, error-bar, box-plot, bullet, candlestick, heatmap, map*, radar, radial-bar, radial-column, range-area, range-bar, waterfall
export function valueProperty<K>(propName: K, continuous: boolean, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'value',
        valueType: continuous ? 'range' : 'category',
        validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation,
        ...opts,
    };
    return result;
}

// scoped
// donut, pie
export function rangedValueProperty<K>(
    propName: K,
    opts: Partial<DatumPropertyDefinition<K>> & { min?: number; max?: number } = {}
): DatumPropertyDefinition<K> {
    const { min = -Infinity, max = Infinity, ...defOpts } = opts;
    return {
        type: 'value',
        property: propName,
        valueType: 'range',
        validation: basicContinuousCheckDatumValidation,
        processor: () => (datum) => (isFiniteNumber(datum) ? clamp(min, datum, max) : datum),
        ...defOpts,
    };
}

// scoped
// donut, pie, waterfall
export function accumulativeValueProperty<K>(
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> & { onlyPositive?: boolean } = {}
): DatumPropertyDefinition<K> {
    const { onlyPositive, ...defOpts } = opts;
    return valueProperty(propName, continuous, { ...defOpts, processor: accumulatedValue(onlyPositive) });
}

// scoped
// waterfall
export function trailingAccumulatedValueProperty<K>(
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(propName, continuous, opts),
        processor: trailingAccumulatedValue(),
    };
    return result;
}

// scoped
// area, bar, error-bar, radial-bar, radial-column
export function groupAccumulativeValueProperty<K>(
    propName: K,
    continuous: boolean,
    mode: 'normal' | 'trailing' | 'window' | 'window-trailing',
    sum: 'current' | 'last' = 'current',
    opts: Partial<DatumPropertyDefinition<K>> & { rangeId?: string; groupId: string }
) {
    return [
        valueProperty(propName, continuous, opts),
        accumulateGroup(opts.groupId, mode, sum, opts.separateNegative),
        ...(opts.rangeId != null ? [range(opts.rangeId, opts.groupId)] : []),
    ];
}

// scoped
// histogram
export function groupCount(id: string): AggregatePropertyDefinition<any, any> {
    return {
        id,
        type: 'aggregate',
        aggregateFunction: () => [0, 1],
        groupAggregateFunction: (next, acc = [0, 0]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            return acc;
        },
    };
}

// scoped
// histogram
export function groupAverage(id: string) {
    const def: AggregatePropertyDefinition<any, any, [number, number], [number, number, number]> = {
        id,
        type: 'aggregate',
        aggregateFunction: sumValues,
        groupAggregateFunction: (next, acc = [0, 0, -1]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            acc[2]++;
            return acc;
        },
        finalFunction: (acc = [0, 0, 0]) => {
            const result = acc[0] + acc[1];
            if (result >= 0) {
                return [0, result / acc[2]];
            }
            return [result / acc[2], 0];
        },
    };

    return def;
}

// scoped
// histogram
export function area(id: string, aggFn: AggregatePropertyDefinition<any, any>) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        type: 'aggregate',
        aggregateFunction: (values, keyRange = []) => {
            const keyWidth = keyRange[1] - keyRange[0];
            return aggFn.aggregateFunction(values).map((v) => v / keyWidth) as [number, number];
        },
    };

    if (aggFn.groupAggregateFunction) {
        result.groupAggregateFunction = aggFn.groupAggregateFunction;
    }

    return result;
}

// scoped
// histogram
export function groupSum(id: string): AggregatePropertyDefinition<any, any> {
    return {
        id,
        type: 'aggregate',
        aggregateFunction: sumValues,
        groupAggregateFunction: (next, acc = [0, 0]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            return acc;
        },
    };
}

function basicContinuousCheckDatumValidation(v: any) {
    return checkDatum(v, true);
}

function basicDiscreteCheckDatumValidation(v: any) {
    return checkDatum(v, false);
}

function sumValues(values: any[]) {
    const accumulator: [number, number] = [0, 0];
    for (const value of values) {
        if (typeof value !== 'number') {
            continue;
        }
        if (value < 0) {
            accumulator[0] += value;
        }
        if (value > 0) {
            accumulator[1] += value;
        }
    }
    return accumulator;
}

function range(id: string, matchGroupId: string): AggregatePropertyDefinition<any, any> {
    return {
        id,
        type: 'aggregate',
        matchGroupIds: [matchGroupId],
        aggregateFunction: (values) => ContinuousDomain.extendDomain(values),
    };
}

function accumulatedValue(onlyPositive?: boolean): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value = 0;

        return (datum: any) => {
            if (!isFiniteNumber(datum)) {
                return datum;
            }

            value += onlyPositive ? Math.max(0, datum) : datum;
            return value;
        };
    };
}

function trailingAccumulatedValue(): DatumPropertyDefinition<any>['processor'] {
    return () => {
        let value = 0;

        return (datum: any) => {
            if (!isFiniteNumber(datum)) {
                return datum;
            }

            const trailingValue = value;
            value += datum;
            return trailingValue;
        };
    };
}

function buildGroupAccFn({ mode, separateNegative }: { mode: 'normal' | 'trailing'; separateNegative?: boolean }) {
    return () => () => (values: any[], valueIndexes: number[]) => {
        // Datum scope.
        const acc = [0, 0];
        for (const valueIdx of valueIndexes) {
            const currentVal = values[valueIdx];
            const accIndex = isNegative(currentVal) && separateNegative ? 0 : 1;
            if (!isFiniteNumber(currentVal)) continue;

            if (mode === 'normal') {
                acc[accIndex] += currentVal;
            }

            values[valueIdx] = acc[accIndex];

            if (mode === 'trailing') {
                acc[accIndex] += currentVal;
            }
        }
    };
}

function buildGroupWindowAccFn({ mode, sum }: { mode: 'normal' | 'trailing'; sum: 'current' | 'last' }) {
    return () => {
        // Entire data-set scope.
        const lastValues: any = {};
        let firstRow = true;
        return () => {
            // Group scope.
            return (values: any[], valueIndexes: number[]) => {
                // Datum scope.
                let acc = 0;
                for (const valueIdx of valueIndexes) {
                    const currentVal = values[valueIdx];
                    const lastValue = firstRow && sum === 'current' ? 0 : lastValues[valueIdx];
                    lastValues[valueIdx] = currentVal;

                    const sumValue = sum === 'current' ? currentVal : lastValue;
                    if (!isFiniteNumber(currentVal) || !isFiniteNumber(lastValue)) {
                        values[valueIdx] = acc;
                        continue;
                    }

                    if (mode === 'normal') {
                        acc += sumValue;
                    }
                    values[valueIdx] = acc;
                    if (mode === 'trailing') {
                        acc += sumValue;
                    }
                }

                firstRow = false;
            };
        };
    };
}

function normalisePropertyFnBuilder({
    zeroDomain,
    rangeMin,
    rangeMax,
}: {
    zeroDomain: number;
    rangeMin?: number;
    rangeMax?: number;
}) {
    const normalise = (val: number, start: number, span: number) =>
        span === 0 ? zeroDomain : clamp(0, (val - start) / span, 1);

    return () => (pData: ProcessedData<any>, pIdx: number) => {
        let [start, end] = pData.domain.values[pIdx];
        if (rangeMin != null) start = rangeMin;
        if (rangeMax != null) end = rangeMax;
        const span = end - start;

        pData.domain.values[pIdx] = [0, 1];

        for (const group of pData.data) {
            let groupValues = group.values;
            if (pData.type === 'ungrouped') {
                groupValues = [groupValues];
            }
            for (const values of groupValues) {
                values[pIdx] = normalise(values[pIdx], start, span);
            }
        }
    };
}

function normaliseFnBuilder({ normaliseTo }: { normaliseTo: number }) {
    const normalise = (value: number, extent: number) =>
        clamp(-normaliseTo, (value * normaliseTo) / extent, normaliseTo);

    return () => () => (values: any[], valueIndexes: number[]) => {
        const valuesExtent = [0, 0];
        for (const valueIdx of valueIndexes) {
            const value = values[valueIdx];
            const valIdx = value < 0 ? 0 : 1;
            if (valIdx === 0) {
                valuesExtent[valIdx] = Math.min(valuesExtent[valIdx], value);
            } else {
                valuesExtent[valIdx] = Math.max(valuesExtent[valIdx], value);
            }
        }

        const extent = Math.max(Math.abs(valuesExtent[0]), valuesExtent[1]);
        for (const valueIdx of valueIndexes) {
            values[valueIdx] = normalise(values[valueIdx], extent);
        }
    };
}

function accumulateGroup(
    matchGroupId: string,
    mode: 'normal' | 'trailing' | 'window' | 'window-trailing',
    sum: 'current' | 'last',
    separateNegative = false
): GroupValueProcessorDefinition<any, any> {
    let adjust;
    if (mode.startsWith('window')) {
        const modeParam = mode.endsWith('-trailing') ? 'trailing' : 'normal';
        adjust = memo({ mode: modeParam, sum }, buildGroupWindowAccFn);
    } else {
        adjust = memo({ mode: mode as 'normal' | 'trailing', separateNegative }, buildGroupAccFn);
    }

    return {
        type: 'group-value-processor',
        matchGroupIds: [matchGroupId],
        adjust,
    };
}
