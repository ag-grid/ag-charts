import type { ScaleType } from 'ag-charts-core';
import {
    clamp,
    isContinuous,
    isFiniteNumber,
    isNegative,
    memo,
    transformIntegratedCategoryValue,
} from 'ag-charts-core';

import { accumulatedValue, range, trailingAccumulatedValue } from './aggregateFunctions';
import {
    type DataGroup,
    type DatumPropertyDefinition,
    type GroupValueProcessorDefinition,
    type ProcessedData,
    type ProcessedOutputDiff,
    type ProcessorFn,
    type ProcessorOutputPropertyDefinition,
    type PropertyValueProcessorDefinition,
    type ReducerOutputPropertyDefinition,
    datumKeys,
} from './dataModel';

const MAX_ANIMATABLE_NODES = 1000;

export function processedDataIsAnimatable(processedData: ProcessedData<any>) {
    return processedData.input.count <= MAX_ANIMATABLE_NODES;
}

function basicContinuousCheckDatumValidation(value: any) {
    return value != null && isContinuous(value);
}

function basicDiscreteCheckDatumValidation(value: any) {
    return value != null;
}

function getValidationFn(scaleType?: ScaleType) {
    switch (scaleType) {
        case 'number':
        case 'log':
        case 'time':
        case 'unit-time':
        case 'ordinal-time':
        case 'color':
            return basicContinuousCheckDatumValidation;
        default:
            return basicDiscreteCheckDatumValidation;
    }
}

function getValueType(scaleType?: ScaleType) {
    switch (scaleType) {
        case 'number':
        case 'log':
        case 'time':
        case 'color':
            return 'range';
        default:
            return 'category';
    }
}
export function keyProperty<K>(propName: K, scaleType?: ScaleType, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'key',
        valueType: getValueType(scaleType),
        validation: getValidationFn(scaleType),
        ...opts,
    };
    return result;
}

export function valueProperty<K>(propName: K, scaleType?: ScaleType, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'value',
        valueType: getValueType(scaleType),
        validation: getValidationFn(scaleType),
        ...opts,
    };
    return result;
}

export function rowCountProperty<K>(propName: K, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'value',
        valueType: 'range',
        missingValue: 1,
        processor: function rowCountResetFn() {
            return function rowCountGroupResetFn() {
                return 1;
            };
        },
        ...opts,
    };
    return result;
}

const noopProcessor: ProcessorFn = function (v: unknown) {
    return v;
};

function processorChain(...chain: ((() => ProcessorFn) | undefined)[]): () => ProcessorFn {
    const filteredChain = chain.filter((fn): fn is () => ProcessorFn => fn != null);
    if (filteredChain.length === 0) {
        return () => noopProcessor;
    }
    if (filteredChain.length === 1) {
        return filteredChain[0];
    }
    return function processorChainFn() {
        const processorInstances = filteredChain.map((fn) => fn());
        return function processorChainResultFn(value: any, index: number) {
            return processorInstances.reduce((r, p) => p(r, index), value);
        };
    };
}

export function rangedValueProperty<K>(
    propName: K,
    opts: Partial<DatumPropertyDefinition<K>> & { min?: number; max?: number } = {}
): DatumPropertyDefinition<K> {
    const { min = -Infinity, max = Infinity, processor, ...defOpts } = opts;
    return {
        type: 'value',
        property: propName,
        valueType: 'range',
        validation: basicContinuousCheckDatumValidation,
        processor: processorChain(processor, function clampFnBuilder() {
            return function clampFn(datum: any) {
                return isFiniteNumber(datum) ? clamp(min, datum, max) : datum;
            };
        }),
        ...defOpts,
    };
}

export function accumulativeValueProperty<K>(
    propName: K,
    scaleType?: ScaleType,
    opts: Partial<DatumPropertyDefinition<K>> & { onlyPositive?: boolean } = {}
) {
    const { onlyPositive, processor, ...defOpts } = opts;
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(propName, scaleType, defOpts),
        processor: processorChain(processor, accumulatedValue(onlyPositive)),
    };
    return result;
}

export function trailingAccumulatedValueProperty<K>(
    propName: K,
    scaleType?: ScaleType,
    opts: Partial<DatumPropertyDefinition<K>> = {}
) {
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(propName, scaleType, opts),
        processor: trailingAccumulatedValue(),
    };
    return result;
}

export function groupAccumulativeValueProperty<K>(
    propName: K,
    mode: 'normal' | 'trailing',
    opts: Partial<DatumPropertyDefinition<K>> & { rangeId?: string; groupId: string },
    scaleType?: ScaleType
) {
    return [
        valueProperty(propName, scaleType, opts),
        accumulateGroup(opts.groupId, mode, opts.separateNegative),
        ...(opts.rangeId == null ? [] : [range(opts.rangeId, opts.groupId)]),
    ];
}

export const SMALLEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'smallestKeyInterval'> = {
    type: 'reducer',
    property: 'smallestKeyInterval',
    initialValue: Infinity,
    reducer() {
        let prevX = Number.NaN;
        return function smallestKeyIntervalReducerFn(smallestSoFar, keys) {
            const key = keys[0];
            const nextX = typeof key === 'number' ? key : Number(key);
            if (!Number.isFinite(nextX)) return smallestSoFar;
            const prevX2 = prevX;
            prevX = nextX;
            if (!Number.isFinite(prevX)) return smallestSoFar;

            const interval = Math.abs(nextX - prevX2);
            const currentSmallest = smallestSoFar ?? Infinity;
            if (interval > 0 && interval < currentSmallest) {
                return interval;
            }
            return currentSmallest;
        };
    },
};

export const LARGEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'largestKeyInterval'> = {
    type: 'reducer',
    property: 'largestKeyInterval',
    initialValue: -Infinity,
    reducer() {
        let prevX = Number.NaN;
        return function largestKeyIntervalReducerFn(largestSoFar, keys) {
            const key = keys[0];
            const nextX = typeof key === 'number' ? key : Number(key);
            if (!Number.isFinite(nextX)) return largestSoFar;
            const prevX2 = prevX;
            prevX = nextX;
            if (!Number.isFinite(prevX)) return largestSoFar;

            const interval = Math.abs(nextX - prevX2);
            const currentLargest = largestSoFar ?? Infinity;
            if (interval > 0 && interval > currentLargest) {
                return interval;
            }
            return currentLargest;
        };
    },
};

export const SORT_DOMAIN_GROUPS: ProcessorOutputPropertyDefinition<'sortedGroupDomain'> = {
    type: 'processor',
    property: 'sortedGroupDomain',
    calculate: function sortedGroupDomainFn({ domain: { groups } }) {
        return groups?.slice().sort((a, b) => {
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

function normaliseFnBuilder({ normaliseTo }: { normaliseTo: number }) {
    const normalise = function normaliseFn(val: null | number, extent: number) {
        if (extent === 0) return 0;
        const result = ((val ?? 0) * normaliseTo) / extent;
        if (result >= 0) {
            return Math.min(normaliseTo, result);
        }
        return Math.max(-normaliseTo, result);
    };

    return function normaliseResetFn() {
        return function normaliseGroupResetFn() {
            return function normaliseFn(
                columns: any[][],
                valueIndexes: number[],
                dataGroup: DataGroup,
                groupIndex: number
            ) {
                const extent = normaliseFindExtent(columns, valueIndexes, dataGroup, groupIndex);
                for (const valueIdx of valueIndexes) {
                    const datumIndices = dataGroup.datumIndices[valueIdx];
                    if (datumIndices == null) continue;

                    for (const relativeDatumIndex of datumIndices) {
                        // Convert relative datum index to absolute column index
                        // (relative index is offset from group start, absolute is for the entire column)
                        const datumIndex = groupIndex + relativeDatumIndex;
                        const column = columns[valueIdx];
                        const value: null | number = column[datumIndex];
                        if (value == null) {
                            column[datumIndex] = undefined;
                            continue;
                        }
                        column[datumIndex] = normalise(value, extent);
                    }
                }
            };
        };
    };
}

function normaliseFindExtent(columns: any[][], valueIndexes: number[], dataGroup: DataGroup, groupIndex: number) {
    const valuesExtent = [0, 0];
    for (const valueIdx of valueIndexes) {
        const column = columns[valueIdx];
        const datumIndices = dataGroup.datumIndices[valueIdx];
        if (datumIndices == null) continue;

        for (const relativeDatumIndex of datumIndices) {
            // Convert relative datum index to absolute column index
            // (relative index is offset from group start, absolute is for the entire column)
            const datumIndex = groupIndex + relativeDatumIndex;
            const value: null | number | (null | number)[] = column[datumIndex];
            if (value == null) continue;
            // Note - Array.isArray(new Float64Array) is false, and this type is used for stack accumulators
            const valueExtent = typeof value === 'number' ? value : Math.max(...value.map((v) => v ?? 0));
            const valIdx = valueExtent < 0 ? 0 : 1;
            if (valIdx === 0) {
                valuesExtent[valIdx] = Math.min(valuesExtent[valIdx], valueExtent);
            } else {
                valuesExtent[valIdx] = Math.max(valuesExtent[valIdx], valueExtent);
            }
        }
    }
    return Math.max(Math.abs(valuesExtent[0]), valuesExtent[1]);
}

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
    const normalise = function normaliseFn(val: number, start: number, span: number) {
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

    return function normalisePropertyResetFn() {
        return function normalisePropertyGroupResetFn() {
            return function normalisePropertyResultFn(pData: ProcessedData<any>, pIdx: number) {
                let [start, end] = pData.domain.values[pIdx];
                if (rangeMin != null) start = rangeMin;
                if (rangeMax != null) end = rangeMax;
                const span = end - start;

                pData.domain.values[pIdx] = [normaliseTo[0], normaliseTo[1]];

                const column = pData.columns[pIdx];
                for (let datumIndex = 0; datumIndex < column.length; datumIndex += 1) {
                    column[datumIndex] = normalise(column[datumIndex], start, span);
                }
            };
        };
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

const ANIMATION_VALIDATION_UNIQUE_KEYS = 0b01;
const ANIMATION_VALIDATION_ORDERED_KEYS = 0b10;
function animationValidationProcessKey(
    count: number,
    def: DatumPropertyDefinition<unknown>,
    keyValues: any[],
    column: any[]
) {
    let validation = ANIMATION_VALIDATION_UNIQUE_KEYS | ANIMATION_VALIDATION_ORDERED_KEYS;

    if (def.valueType === 'category') {
        if (keyValues.length < count) validation &= ~ANIMATION_VALIDATION_UNIQUE_KEYS;

        return validation;
    }

    let lastValue = column[0]?.valueOf();
    for (let d = 1; validation !== 0 && d < column.length; d++) {
        const keyValue = column[d]?.valueOf();
        if (!Number.isFinite(keyValue) || lastValue > keyValue) validation &= ~ANIMATION_VALIDATION_ORDERED_KEYS;
        if (Number.isFinite(keyValue) && lastValue === keyValue) validation &= ~ANIMATION_VALIDATION_UNIQUE_KEYS;
        lastValue = keyValue;
    }

    return validation;
}

export function animationValidation(valueKeyIds?: string[]): ProcessorOutputPropertyDefinition {
    return {
        type: 'processor',
        property: 'animationValidation',
        calculate(result: ProcessedData<any>) {
            if (!processedDataIsAnimatable(result)) return;

            const { keys: keysDefs, values: valuesDef } = result.defs;
            const {
                input,
                domain: { keys: domainKeys, values: domainValues },
                keys,
                columns,
                invalidKeyCount,
            } = result;

            let validation = ANIMATION_VALIDATION_UNIQUE_KEYS | ANIMATION_VALIDATION_ORDERED_KEYS;

            if (input.count !== 0) {
                for (let i = 0; validation !== 0 && i < keysDefs.length; i++) {
                    for (const scope of keysDefs[i].scopes) {
                        const column = keys[i].get(scope)!;
                        const missingKeys = invalidKeyCount?.get(scope) ?? 0;
                        const count = column.length - missingKeys;
                        validation &= animationValidationProcessKey(count, keysDefs[i], domainKeys[i], column);
                    }
                }

                for (let i = 0; validation !== 0 && i < valuesDef.length; i++) {
                    const value = valuesDef[i];

                    if (!valueKeyIds?.includes(value.id as string)) continue;

                    validation &= animationValidationProcessKey(
                        0 /* Count not used */,
                        value,
                        domainValues[i],
                        columns[i]
                    );
                }
            }

            return {
                uniqueKeys: (validation & ANIMATION_VALIDATION_UNIQUE_KEYS) !== 0,
                orderedKeys: (validation & ANIMATION_VALIDATION_ORDERED_KEYS) !== 0,
            };
        },
    };
}

function buildGroupAccFn({ mode, separateNegative }: { mode: 'normal' | 'trailing'; separateNegative?: boolean }) {
    return function buildGroupAccFnResetFn() {
        return function buildGroupAccFnGroupResetFn() {
            return function buildGroupAccFnResultFn(
                columns: any[][],
                valueIndexes: number[],
                dataGroup: DataGroup,
                groupIndex: number
            ) {
                // Datum scope.
                const acc = [0, 0];
                for (const valueIdx of valueIndexes) {
                    const datumIndices = dataGroup.datumIndices[valueIdx];
                    if (datumIndices == null) continue;

                    const stackNegative = acc[0];
                    const stackPositive = acc[1];

                    const column = columns[valueIdx];
                    let didAccumulate = false;
                    for (const relativeDatumIndex of datumIndices) {
                        // Convert relative datum index to absolute column index
                        // (relative index is offset from group start, absolute is for the entire column)
                        const datumIndex = groupIndex + relativeDatumIndex;
                        const currentVal = column[datumIndex];
                        if (!isFiniteNumber(currentVal)) continue;

                        const useNegative = separateNegative && isNegative(currentVal);
                        const accValue = useNegative ? stackNegative : stackPositive;
                        if (mode === 'normal') {
                            column[datumIndex] = accValue + currentVal;
                        } else {
                            column[datumIndex] = accValue;
                        }

                        if (!didAccumulate) {
                            const accIndex = useNegative ? 0 : 1;
                            acc[accIndex] = accValue + currentVal;

                            didAccumulate = true;
                        }
                    }
                }
            };
        };
    };
}

export function accumulateGroup(
    matchGroupId: string,
    mode: 'normal' | 'trailing',
    separateNegative = false
): GroupValueProcessorDefinition<any, any> {
    const adjust = memo({ mode, separateNegative }, buildGroupAccFn);

    return {
        type: 'group-value-processor',
        matchGroupIds: [matchGroupId],
        adjust,
        supportsReprocessing: true,
    };
}

function valueIdentifier(value: DatumPropertyDefinition<string | number | symbol>) {
    return value.id ?? value.property;
}

function valueIndices(id: string, previousData: ProcessedData<any>, processedData: ProcessedData<any>) {
    const properties = new Map<string | number | symbol, number>();
    const previousValues = previousData.defs.values;
    for (let previousIndex = 0; previousIndex < previousValues.length; previousIndex += 1) {
        const previousValue = previousValues[previousIndex];
        if (previousValue.scopes?.includes(id) === false) continue;

        const valueId = valueIdentifier(previousValue);

        // Incompatible
        if (properties.has(valueId)) return;

        properties.set(valueId, previousIndex);
    }

    const indices: Array<{ previousIndex: number; nextIndex: number }> = [];
    const nextValues = processedData.defs.values;
    for (let nextIndex = 0; nextIndex < nextValues.length; nextIndex += 1) {
        const nextValue = nextValues[nextIndex];
        if (nextValue.scopes?.includes(id) === false) continue;

        const valueId = valueIdentifier(nextValue);

        const previousIndex = properties.get(valueId);

        // Incompatible
        if (previousIndex == null) return;

        properties.delete(valueId);

        indices.push({ previousIndex, nextIndex });
    }

    // Incompatible
    if (properties.size !== 0) return;

    return indices;
}

function columnsEqual(
    previousColumns: any[][],
    nextColumns: any[][],
    indices: Array<{ previousIndex: number; nextIndex: number }>,
    previousDatumIndex: number,
    nextDatumIndex: number
) {
    for (const { previousIndex, nextIndex } of indices) {
        const previousColumn = previousColumns[previousIndex];
        const nextColumn = nextColumns[nextIndex];

        const previousValue = previousColumn[previousDatumIndex];
        const nextValue = nextColumn[nextDatumIndex];

        if (previousValue !== nextValue) {
            return false;
        }
    }

    return true;
}

export function diff(
    id: string,
    previousData: ProcessedData<any>,
    updateMovedData: boolean = true
): ProcessorOutputPropertyDefinition<'diff'> {
    return {
        type: 'processor',
        property: 'diff',
        calculate(processedData, previousValue): Record<string, ProcessedOutputDiff> | undefined {
            if (!processedDataIsAnimatable(processedData)) return;

            const moved = new Map<string, number>();
            const added = new Map<string, number>();
            const updated = new Map<string, number>();
            const removed = new Map<string, number>();

            const previousKeys = previousData.keys.map((keyMap) => keyMap.get(id));
            const keys = processedData.keys.map((keyMap) => keyMap.get(id));

            const previousColumns = previousData.columns;
            const columns = processedData.columns;

            const indices = valueIndices(id, previousData, processedData);
            if (indices == null) return previousValue;

            const length = Math.max(previousData.input.count, processedData.input.count);

            for (let i = 0; i < length; i++) {
                const hasPreviousDatum = i < previousData.input.count;
                const hasDatum = i < processedData.input.count;

                const prevKeys = hasPreviousDatum ? datumKeys(previousKeys, i) : undefined;
                const prevId = prevKeys == null ? '' : createDatumId(...prevKeys);
                const dKeys = hasDatum ? datumKeys(keys, i) : undefined;
                const datumId = dKeys == null ? '' : createDatumId(...dKeys);

                if (hasDatum && hasPreviousDatum && prevId === datumId) {
                    if (!columnsEqual(previousColumns, columns, indices, i, i)) {
                        updated.set(datumId, i);
                    }
                    continue;
                }

                const removedIndex = removed.get(datumId);
                if (removedIndex != null) {
                    if (updateMovedData || !columnsEqual(previousColumns, columns, indices, removedIndex, i)) {
                        updated.set(datumId, i);
                        moved.set(datumId, i);
                    }
                    removed.delete(datumId);
                } else if (hasDatum) {
                    added.set(datumId, i);
                }

                const addedIndex = added.get(prevId);
                if (addedIndex != null) {
                    if (updateMovedData || !columnsEqual(previousColumns, columns, indices, addedIndex, i)) {
                        updated.set(prevId, i);
                        moved.set(prevId, i);
                    }
                    added.delete(prevId);
                } else if (hasPreviousDatum) {
                    updated.delete(prevId);
                    removed.set(prevId, i);
                }
            }

            const changed = added.size > 0 || updated.size > 0 || removed.size > 0;
            const value = {
                changed,
                added: new Set(added.keys()),
                updated: new Set(updated.keys()),
                removed: new Set(removed.keys()),
                moved: new Set(moved.keys()),
            };
            return {
                ...previousValue,
                [id]: value,
            };
        },
    };
}

type KeyType = string | number | boolean | undefined;
// FIXME: ReturnType should be `string | number | boolean`
export function createDatumId(...keys: KeyType[]): any {
    if (keys.length === 1) {
        const key = transformIntegratedCategoryValue(keys[0]);
        const isPrimitive = typeof key === 'boolean' || typeof key === 'number' || typeof key === 'string';
        // Avoid toString if not necessary
        if (isPrimitive) return key;
    }
    return keys.map((key) => transformIntegratedCategoryValue(key)).join('___');
}
