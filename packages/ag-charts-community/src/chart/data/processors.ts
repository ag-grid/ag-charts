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
    ScopeProvider,
} from './dataModel';

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

function normaliseFnBuilder({ normaliseTo, mode }: { normaliseTo: number; mode: 'sum' | 'range' }) {
    const normalise = (val: number, extent: number) => {
        const result = (val * normaliseTo) / extent;
        if (result >= 0) {
            return Math.min(normaliseTo, result);
        }
        return Math.max(-normaliseTo, result);
    };

    return () => () => (values: any[], valueIndexes: number[]) => {
        const valuesExtent = [0, 0];
        for (const valueIdx of valueIndexes) {
            const value = values[valueIdx];
            const valIdx = value < 0 ? 0 : 1;
            if (mode === 'sum') {
                valuesExtent[valIdx] += value;
            } else if (valIdx === 0) {
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

export function normaliseGroupTo(
    scope: ScopeProvider,
    matchGroupIds: string[],
    normaliseTo: number,
    mode: 'sum' | 'range' = 'sum'
): GroupValueProcessorDefinition<any, any> {
    return {
        scopes: [scope.id],
        type: 'group-value-processor',
        matchGroupIds,
        adjust: memo({ normaliseTo, mode }, normaliseFnBuilder),
    };
}

function normalisePropertyFnBuilder({
    normaliseTo,
    zeroDomain,
    rangeMin,
    rangeMax,
}: {
    normaliseTo: [number, number];
    zeroDomain: number;
    rangeMin?: number;
    rangeMax?: number;
}) {
    const normaliseSpan = normaliseTo[1] - normaliseTo[0];
    const normalise = (val: number, start: number, span: number) => {
        if (span === 0) {
            return zeroDomain;
        }

        const result = normaliseTo[0] + ((val - start) / span) * normaliseSpan;
        return clamp(normaliseTo[0], result, normaliseTo[1]);
    };

    return () => (pData: ProcessedData<any>, pIdx: number) => {
        let [start, end] = pData.domain.values[pIdx];
        if (rangeMin != null) start = rangeMin;
        if (rangeMax != null) end = rangeMax;
        const span = end - start;

        pData.domain.values[pIdx] = [normaliseTo[0], normaliseTo[1]];

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

export function normalisePropertyTo(
    scope: ScopeProvider,
    property: PropertyId<any>,
    normaliseTo: [number, number],
    zeroDomain: number,
    rangeMin?: number,
    rangeMax?: number
): PropertyValueProcessorDefinition<any> {
    return {
        scopes: [scope.id],
        type: 'property-value-processor',
        property,
        adjust: memo({ normaliseTo, rangeMin, rangeMax, zeroDomain }, normalisePropertyFnBuilder),
    };
}

export function animationValidation(scope: ScopeProvider, valueKeyIds?: string[]): ProcessorOutputPropertyDefinition {
    return {
        type: 'processor',
        scopes: [scope.id],
        property: 'animationValidation',
        calculate(result: ProcessedData<any>) {
            const { keys, values } = result.defs;
            const { input, data } = result;
            let uniqueKeys = true;
            let orderedKeys = true;

            const valueKeys: [number, DatumPropertyDefinition<unknown>][] = [];
            for (let k = 0; k < values.length; k++) {
                if (!values[k].scopes?.includes(scope.id)) continue;
                if (!valueKeyIds?.includes(values[k].id as string)) continue;

                valueKeys.push([k, values[k]]);
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

function buildGroupAccFn({ mode, separateNegative }: { mode: 'normal' | 'trailing'; separateNegative?: boolean }) {
    return () => () => (values: any[], valueIndexes: number[]) => {
        // Datum scope.
        const acc = [0, 0];
        for (const valueIdx of valueIndexes) {
            const currentVal = values[valueIdx];
            const accIndex = isNegative(currentVal) && separateNegative ? 0 : 1;
            if (!isFiniteNumber(currentVal)) continue;

            if (mode === 'normal') acc[accIndex] += currentVal;
            values[valueIdx] = acc[accIndex];
            if (mode === 'trailing') acc[accIndex] += currentVal;
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

export function accumulateGroup(
    scope: ScopeProvider,
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
        scopes: [scope.id],
        type: 'group-value-processor',
        matchGroupIds: [matchGroupId],
        adjust,
    };
}

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

type KeyType = string | number | object;
export function createDatumId(keys: KeyType | KeyType[]) {
    if (isArray(keys)) {
        return keys.map((key) => transformIntegratedCategoryValue(key)).join('___');
    }
    return transformIntegratedCategoryValue(keys);
}

function basicContinuousCheckDatumValidation(v: any) {
    return checkDatum(v, true) != null;
}

function basicDiscreteCheckDatumValidation(v: any) {
    return checkDatum(v, false) != null;
}

export function keyProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        scopes: [scope.id],
        property: propName,
        type: 'key',
        valueType: continuous ? 'range' : 'category',
        validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation,
        ...opts,
    };
    return result;
}

export function valueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        scopes: [scope.id],
        property: propName,
        type: 'value',
        valueType: continuous ? 'range' : 'category',
        validation: continuous ? basicContinuousCheckDatumValidation : basicDiscreteCheckDatumValidation,
        ...opts,
    };
    return result;
}

export function rangedValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    opts: Partial<DatumPropertyDefinition<K>> & { min?: number; max?: number } = {}
): DatumPropertyDefinition<K> {
    const { min = -Infinity, max = Infinity, ...defOpts } = opts;
    return {
        scopes: [scope.id],
        type: 'value',
        property: propName,
        valueType: 'range',
        validation: basicContinuousCheckDatumValidation,
        processor: () => (datum) => (isFiniteNumber(datum) ? clamp(min, datum, max) : datum),
        ...defOpts,
    };
}

export function accumulativeValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> & { onlyPositive?: boolean } = {}
) {
    const { onlyPositive, ...defOpts } = opts;
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(scope, propName, continuous, defOpts),
        processor: accumulatedValue(onlyPositive),
    };
    return result;
}

export function trailingAccumulatedValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(scope, propName, continuous, opts),
        processor: trailingAccumulatedValue(),
    };
    return result;
}

export function groupAccumulativeValueProperty<K>(
    scope: ScopeProvider,
    propName: K,
    continuous: boolean,
    mode: 'normal' | 'trailing' | 'window' | 'window-trailing',
    sum: 'current' | 'last' = 'current',
    opts: Partial<DatumPropertyDefinition<K>> & { rangeId?: string; groupId: string }
) {
    return [
        valueProperty(scope, propName, continuous, opts),
        accumulateGroup(scope, opts.groupId, mode, sum, opts.separateNegative),
        ...(opts.rangeId != null ? [range(scope, opts.rangeId, opts.groupId)] : []),
    ];
}

function sumValues(values: any[], accumulator: [number, number] = [0, 0]) {
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

export function sum(scope: ScopeProvider, id: string, matchGroupId: string) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        scopes: [scope.id],
        matchGroupIds: [matchGroupId],
        type: 'aggregate',
        aggregateFunction: (values) => sumValues(values),
    };

    return result;
}

export function groupSum(
    scope: ScopeProvider,
    id: string,
    matchGroupId?: string
): AggregatePropertyDefinition<any, any> {
    return {
        id,
        scopes: [scope.id],
        type: 'aggregate',
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
        aggregateFunction: (values) => sumValues(values),
        groupAggregateFunction: (next, acc = [0, 0]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            return acc;
        },
    };
}

export function range(scope: ScopeProvider, id: string, matchGroupId: string) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        scopes: [scope.id],
        matchGroupIds: [matchGroupId],
        type: 'aggregate',
        aggregateFunction: (values) => ContinuousDomain.extendDomain(values),
    };

    return result;
}

export function groupCount(scope: ScopeProvider, id: string): AggregatePropertyDefinition<any, any> {
    return {
        id,
        scopes: [scope.id],
        type: 'aggregate',
        aggregateFunction: () => [0, 1],
        groupAggregateFunction: (next, acc = [0, 0]) => {
            acc[0] += next?.[0] ?? 0;
            acc[1] += next?.[1] ?? 0;
            return acc;
        },
    };
}

export function groupAverage(scope: ScopeProvider, id: string, matchGroupId?: string) {
    const def: AggregatePropertyDefinition<any, any, [number, number], [number, number, number]> = {
        id,
        scopes: [scope.id],
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
        type: 'aggregate',
        aggregateFunction: (values) => sumValues(values),
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

export function area(
    scope: ScopeProvider,
    id: string,
    aggFn: AggregatePropertyDefinition<any, any>,
    matchGroupId?: string
) {
    const result: AggregatePropertyDefinition<any, any> = {
        id,
        scopes: [scope.id],
        matchGroupIds: matchGroupId ? [matchGroupId] : undefined,
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

export function accumulatedValue(onlyPositive?: boolean): DatumPropertyDefinition<any>['processor'] {
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

export function trailingAccumulatedValue(): DatumPropertyDefinition<any>['processor'] {
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
