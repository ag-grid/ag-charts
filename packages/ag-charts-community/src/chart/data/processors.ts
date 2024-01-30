import { arraysEqual } from '../../util/array';
import { memo } from '../../util/memo';
import { isNegative } from '../../util/number';
import { isFiniteNumber } from '../../util/type-guards';
import { transformIntegratedCategoryValue } from '../../util/value';
import type {
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

export const AGG_VALUES_EXTENT: ProcessorOutputPropertyDefinition<'aggValuesExtent'> = {
    type: 'processor',
    property: 'aggValuesExtent',
    calculate: (processedData) => {
        const result: [number, number] = [...(processedData.domain.aggValues?.[0] ?? [0, 0])];

        for (const [min, max] of processedData.domain.aggValues?.slice(1) ?? []) {
            if (min < result[0]) {
                result[0] = min;
            }
            if (max > result[1]) {
                result[1] = max;
            }
        }

        return result;
    },
};

export const SORT_DOMAIN_GROUPS: ProcessorOutputPropertyDefinition<'sortedGroupDomain'> = {
    type: 'processor',
    property: 'sortedGroupDomain',
    calculate: ({ domain: { groups } }) => {
        if (groups == null) return undefined;

        return [...groups].sort((a, b) => {
            for (let i = 0; i < a.length; i++) {
                const result = a[i] - b[i];
                if (result !== 0) {
                    return result;
                }
            }

            return 0;
        });
    },
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
        const result = normaliseTo[0] + ((val - start) / span) * normaliseSpan;

        if (span === 0) return zeroDomain;
        if (result >= normaliseTo[1]) return normaliseTo[1];
        if (result < normaliseTo[0]) return normaliseTo[0];
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

export function animationValidation(
    scope: ScopeProvider,
    valueKeyIds: string[] = []
): ProcessorOutputPropertyDefinition {
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
                if (!values[k].scopes?.some((s) => s === scope.id)) continue;
                if (!valueKeyIds.some((v) => values[k].id === v)) continue;

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

                    if (mode === 'normal') acc += sumValue;
                    values[valueIdx] = acc;
                    if (mode === 'trailing') acc += sumValue;
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
    updateMovedDatums: boolean = true
): ProcessorOutputPropertyDefinition<'diff'> {
    return {
        type: 'processor',
        property: 'diff',
        calculate: (processedData) => {
            const diff = {
                changed: false,
                moved: [] as any[],
                added: [] as any[],
                updated: [] as any[],
                removed: [] as any[],
                addedIndices: [] as number[],
                updatedIndices: [] as number[],
                removedIndices: [] as number[],
            };

            const moved = new Map<string, any>();
            const added = new Map<string, any>();
            const updated = new Map<string, any>();
            const removed = new Map<string, any>();
            const addedIndices = new Map<string, number>();
            const updatedIndices = new Map<string, number>();
            const removedIndices = new Map<string, number>();

            for (let i = 0; i < Math.max(previousData.data.length, processedData.data.length); i++) {
                const prev = previousData.data[i];
                const datum = processedData.data[i];

                const prevId = prev ? createDatumId(prev.keys) : '';
                const datumId = datum ? createDatumId(datum.keys) : '';

                if (prevId === datumId) {
                    if (!arraysEqual(prev.values, datum.values)) {
                        updated.set(datumId, datum);
                        updatedIndices.set(datumId, i);
                    }
                    continue;
                }

                if (removed.has(datumId)) {
                    if (updateMovedDatums || !arraysEqual(removed.get(datumId).values, datum.values)) {
                        updated.set(datumId, datum);
                        updatedIndices.set(datumId, i);

                        moved.set(datumId, datum);
                    }
                    removed.delete(datumId);
                    removedIndices.delete(datumId);
                } else if (datum) {
                    added.set(datumId, datum);
                    addedIndices.set(datumId, i);
                }

                if (added.has(prevId)) {
                    if (updateMovedDatums || !arraysEqual(added.get(prevId).values, prev.values)) {
                        updated.set(prevId, prev);
                        updatedIndices.set(prevId, i);

                        moved.set(prevId, prev);
                    }
                    added.delete(prevId);
                    addedIndices.delete(prevId);
                } else if (prev) {
                    updated.delete(prevId);
                    updatedIndices.delete(prevId);
                    removed.set(prevId, prev);
                    removedIndices.set(prevId, i);
                }
            }

            diff.added = Array.from(added.keys());
            diff.updated = Array.from(updated.keys());
            diff.removed = Array.from(removed.keys());
            diff.moved = Array.from(moved.keys());
            diff.addedIndices = Array.from(addedIndices.values());
            diff.updatedIndices = Array.from(updatedIndices.values());
            diff.removedIndices = Array.from(removedIndices.values());

            diff.changed = diff.added.length > 0 || diff.updated.length > 0 || diff.removed.length > 0;

            return diff;
        },
    };
}

export function createDatumId(keys: any | any[]) {
    if (!Array.isArray(keys)) return transformIntegratedCategoryValue(keys);
    return keys.map((key) => `${transformIntegratedCategoryValue(key)}`).join('___');
}
