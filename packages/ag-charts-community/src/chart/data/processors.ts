/* eslint-disable sonarjs/no-duplicate-string */
import { arraysEqual } from '../../util/array';
import { memo } from '../../util/memo';
import { isNegative } from '../../util/number';
import { isArray, isFiniteNumber } from '../../util/type-guards';
import { transformIntegratedCategoryValue } from '../../util/value';
import type {
    DatumPropertyDefinition,
    GroupValueProcessorDefinition,
    ProcessedData,
    ProcessorOutputPropertyDefinition,
    PropertyValueProcessorDefinition,
    ReducerOutputPropertyDefinition,
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

export const LARGEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'largestKeyInterval'> = {
    type: 'reducer',
    property: 'largestKeyInterval',
    initialValue: -Infinity,
    reducer: () => {
        let prevX = NaN;
        return (largestSoFar = -Infinity, next) => {
            const nextX = next.keys[0];
            const interval = Math.abs(nextX - prevX);
            prevX = nextX;
            if (!isNaN(interval) && interval > 0 && interval > largestSoFar) {
                return interval;
            }
            return largestSoFar;
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
            const value: number | number[] = values[valueIdx];
            // Note - Array.isArray(new Float64Array) is false, and this type is used for stack accumulators
            const valueExtent = typeof value === 'number' ? value : Math.max(...value);
            const valIdx = valueExtent < 0 ? 0 : 1;
            if (mode === 'sum') {
                valuesExtent[valIdx] += valueExtent;
            } else if (valIdx === 0) {
                valuesExtent[valIdx] = Math.min(valuesExtent[valIdx], valueExtent);
            } else {
                valuesExtent[valIdx] = Math.max(valuesExtent[valIdx], valueExtent);
            }
        }

        const extent = Math.max(Math.abs(valuesExtent[0]), valuesExtent[1]);
        for (const valueIdx of valueIndexes) {
            const value: number | number[] = values[valueIdx];
            values[valueIdx] =
                typeof value === 'number' ? normalise(value, extent) : value.map((v) => normalise(v, extent));
        }
    };
}

export function normaliseGroupTo(
    matchGroupIds: string[],
    normaliseTo: number,
    mode: 'sum' | 'range' = 'sum'
): GroupValueProcessorDefinition<any, any> {
    return {
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
        const result = normaliseTo[0] + ((val - start) / span) * normaliseSpan;

        if (span === 0) {
            return zeroDomain;
        } else if (result >= normaliseTo[1]) {
            return normaliseTo[1];
        } else if (result < normaliseTo[0]) {
            return normaliseTo[0];
        }
        return result;
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
    property: string,
    normaliseTo: [number, number],
    zeroDomain: number,
    rangeMin?: number,
    rangeMax?: number
): PropertyValueProcessorDefinition<any> {
    return {
        type: 'property-value-processor',
        property,
        adjust: memo({ normaliseTo, rangeMin, rangeMax, zeroDomain }, normalisePropertyFnBuilder),
    };
}

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
        const lastValues: any[] = [];
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

function groupStackAccFn() {
    return () => (values: any[], valueIndexes: number[]) => {
        // Datum scope.
        const acc = new Float64Array(32);
        let stackCount = 0;
        for (const valueIdx of valueIndexes) {
            const currentValue = values[valueIdx];
            acc[stackCount] = Number.isFinite(currentValue) ? currentValue : NaN;
            stackCount += 1;
            values[valueIdx] = acc.subarray(0, stackCount);
        }
    };
}

export function accumulateStack(matchGroupId: string): GroupValueProcessorDefinition<any, any> {
    return {
        type: 'group-value-processor',
        matchGroupIds: [matchGroupId],
        adjust: groupStackAccFn,
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

type KeyType = string | number | boolean | object;
export function createDatumId(keys: KeyType | KeyType[], ...extraKeys: (string | number | boolean)[]) {
    let result;
    if (isArray(keys)) {
        result = keys.map((key) => transformIntegratedCategoryValue(key)).join('___');
    } else {
        result = transformIntegratedCategoryValue(keys);
    }

    const primitiveType =
        typeof result === 'string' ||
        typeof result === 'number' ||
        typeof result === 'boolean' ||
        result instanceof Date;
    if (primitiveType && extraKeys.length > 0) {
        result += `___${extraKeys.join('___')}`;
    }

    return result;
}
