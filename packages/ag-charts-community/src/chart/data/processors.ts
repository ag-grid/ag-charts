import type { ScaleType } from '../../scale/scale';
import { memo } from '../../util/memo';
import { clamp, isNegative } from '../../util/number';
import { isArray, isFiniteNumber } from '../../util/type-guards';
import { isContinuous, transformIntegratedCategoryValue } from '../../util/value';
import { accumulatedValue, range, trailingAccumulatedValue } from './aggregateFunctions';
import {
    type DatumPropertyDefinition,
    type GroupValueProcessorDefinition,
    type ProcessedData,
    type ProcessedOutputDiff,
    type ProcessorOutputPropertyDefinition,
    type PropertyValueProcessorDefinition,
    type ReducerOutputPropertyDefinition,
    datumKeys,
} from './dataModel';

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
        case 'ordinal-time':
        case 'time':
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

export function accumulativeValueProperty<K>(
    propName: K,
    scaleType?: ScaleType,
    opts: Partial<DatumPropertyDefinition<K>> & { onlyPositive?: boolean } = {}
) {
    const { onlyPositive, ...defOpts } = opts;
    const result: DatumPropertyDefinition<K> = {
        ...valueProperty(propName, scaleType, defOpts),
        processor: accumulatedValue(onlyPositive),
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
    mode: 'normal' | 'trailing' | 'window' | 'window-trailing',
    sum: 'current' | 'last',
    opts: Partial<DatumPropertyDefinition<K>> & { rangeId?: string; groupId: string },
    scaleType?: ScaleType
) {
    return [
        valueProperty(propName, scaleType, opts),
        accumulateGroup(opts.groupId, mode, sum, opts),
        ...(opts.rangeId != null ? [range(opts.rangeId, opts.groupId)] : []),
    ];
}

export function groupStackValueProperty<K>(
    propName: K,
    scaleType: ScaleType | undefined,
    opts: Partial<DatumPropertyDefinition<K>> & { rangeId?: string; groupId: string }
) {
    return [valueProperty(propName, scaleType, opts), accumulateStack(opts.groupId)];
}

export const SMALLEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'smallestKeyInterval'> = {
    type: 'reducer',
    property: 'smallestKeyInterval',
    initialValue: Infinity,
    reducer: () => {
        let prevX = NaN;
        // eslint-disable-next-line sonarjs/default-param-last
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
        // eslint-disable-next-line sonarjs/default-param-last
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

function normaliseFnBuilder({
    normaliseTo,
    mode,
    invalidValue,
}: {
    normaliseTo: number;
    mode: 'sum' | 'range';
    invalidValue: any;
}) {
    const normalise = (val: null | number, extent: number | undefined) => {
        if (extent == null) return invalidValue;
        if (extent === 0) return 0;
        const result = ((val ?? 0) * normaliseTo) / extent;
        if (result >= 0) {
            return Math.min(normaliseTo, result);
        }
        return Math.max(-normaliseTo, result);
    };

    return () => () => (columns: any[][], valueIndexes: number[], datumIndex: number) => {
        const extent = normaliseFindExtent(mode, columns, valueIndexes, datumIndex);
        for (const valueIdx of valueIndexes) {
            const column = columns[valueIdx];
            const value: null | number | number[] = column[datumIndex];
            if (value == null) continue;

            column[datumIndex] =
                // eslint-disable-next-line sonarjs/no-nested-functions
                typeof value === 'number' ? normalise(value, extent) : value.map((v) => normalise(v, extent));
        }
    };
}

function normaliseFindExtent(mode: 'sum' | 'range', columns: any[][], valueIndexes: number[], datumIndex: number) {
    let valuesExtent: [number, number] | undefined;
    for (const valueIdx of valueIndexes) {
        const column = columns[valueIdx];
        const value: null | any[] = column[datumIndex];
        if (value == null) continue;
        // Note - Array.isArray(new Float64Array) is false, and this type is used for stack accumulators
        const valueExtent = typeof value === 'number' ? value : value[value.length - 1];
        if (!Number.isFinite(valueExtent)) continue;

        valuesExtent ??= [0, 0];
        const valIdx = valueExtent < 0 ? 0 : 1;
        if (mode === 'sum') {
            valuesExtent[valIdx] += valueExtent;
        } else if (valIdx === 0) {
            valuesExtent[valIdx] = Math.min(valuesExtent[valIdx], valueExtent);
        } else {
            valuesExtent[valIdx] = Math.max(valuesExtent[valIdx], valueExtent);
        }
    }

    if (valuesExtent == null) return;

    return Math.max(Math.abs(valuesExtent[0]), valuesExtent[1]);
}

export function normaliseGroupTo(
    matchGroupIds: string[],
    normaliseTo: number,
    mode: 'sum' | 'range' = 'sum',
    { invalidValue = null }: { invalidValue?: any } = {}
): GroupValueProcessorDefinition<any, any> {
    return {
        type: 'group-value-processor',
        matchGroupIds,
        adjust: memo({ normaliseTo, mode, invalidValue }, normaliseFnBuilder),
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

        const { rawData } = pData;
        const column = pData.columns[pIdx];
        for (let datumIndex = 0; datumIndex < rawData.length; datumIndex += 1) {
            column[datumIndex] = normalise(column[datumIndex], start, span);
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

const ANIMATION_VALIDATION_UNIQUE_KEYS = 0b01;
const ANIMATION_VALIDATION_ORDERED_KEYS = 0b10;
const animationValidationProcessKey = (
    count: number,
    def: DatumPropertyDefinition<unknown>,
    keyValues: any[],
    column: any[]
) => {
    let validation = ANIMATION_VALIDATION_UNIQUE_KEYS | ANIMATION_VALIDATION_ORDERED_KEYS;

    if (def.valueType === 'category') {
        if (keyValues.length !== count) validation &= ~ANIMATION_VALIDATION_UNIQUE_KEYS;

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
};

export function animationValidation(valueKeyIds?: string[]): ProcessorOutputPropertyDefinition {
    return {
        type: 'processor',
        property: 'animationValidation',
        calculate(result: ProcessedData<any>) {
            const { keys: keysDefs, values: valuesDef } = result.defs;
            const {
                input: { count },
                domain: { keys: domainKeys, values: domainValues },
                rawData,
                keys,
                columns,
            } = result;

            let validation = ANIMATION_VALIDATION_UNIQUE_KEYS | ANIMATION_VALIDATION_ORDERED_KEYS;

            if (rawData.length !== 0) {
                for (let i = 0; validation !== 0 && i < keysDefs.length; i++) {
                    validation &= animationValidationProcessKey(count, keysDefs[i], domainKeys[i], keys[i]);
                }

                for (let i = 0; validation !== 0 && i < valuesDef.length; i++) {
                    const value = valuesDef[i];

                    if (!valueKeyIds?.includes(value.id as string) === true) continue;

                    validation &= animationValidationProcessKey(count, value, domainValues[i], columns[i]);
                }
            }

            return {
                uniqueKeys: (validation & ANIMATION_VALIDATION_UNIQUE_KEYS) !== 0,
                orderedKeys: (validation & ANIMATION_VALIDATION_ORDERED_KEYS) !== 0,
            };
        },
    };
}

function buildGroupAccFn({
    mode,
    separateNegative,
    invalidValue,
}: {
    mode: 'normal' | 'trailing';
    separateNegative?: boolean;
    invalidValue: number;
}) {
    return () => () => (columns: any[][], valueIndexes: number[], datumIndex: number) => {
        // Datum scope.
        const acc = [0, 0];

        for (const valueIdx of valueIndexes) {
            const column = columns[valueIdx];
            let currentVal = column[datumIndex];
            if (!Number.isFinite(currentVal)) currentVal = invalidValue;

            const accIndex = !Number.isFinite(currentVal) || (isNegative(currentVal) && separateNegative) ? 0 : 1;
            const nextAcc = acc[accIndex] + currentVal;

            if (Number.isFinite(nextAcc)) {
                column[datumIndex] = mode === 'normal' ? nextAcc : acc[accIndex];
                acc[accIndex] = nextAcc;
            } else {
                column[datumIndex] = invalidValue;
            }
        }
    };
}

function buildGroupWindowAccFn({
    mode,
    sum,
    invalidValue,
}: {
    mode: 'normal' | 'trailing';
    sum: 'current' | 'last';
    invalidValue: number;
}) {
    return () => {
        // Entire data-set scope.
        const lastValues: any[] = [];
        let firstRow = true;
        return () => {
            // Group scope.
            return (columns: any[][], valueIndexes: number[], datumIndex: number) => {
                // Datum scope.
                let acc = 0;
                for (const valueIdx of valueIndexes) {
                    const column = columns[valueIdx];

                    let currentVal = column[datumIndex];
                    if (!Number.isFinite(currentVal)) currentVal = invalidValue;

                    let sumValue: number;
                    if (sum === 'current') {
                        sumValue = currentVal;
                    } else if (!firstRow) {
                        sumValue = lastValues[valueIdx];
                    } else if (Number.isFinite(currentVal)) {
                        sumValue = 0;
                    } else {
                        sumValue = invalidValue;
                    }
                    lastValues[valueIdx] = currentVal;

                    const nextAcc = acc + sumValue;
                    if (Number.isFinite(nextAcc)) {
                        column[datumIndex] = mode === 'normal' ? nextAcc : acc;
                        acc = nextAcc;
                    } else {
                        column[datumIndex] = invalidValue;
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
    { separateNegative = false, invalidValue = 0 } = {}
): GroupValueProcessorDefinition<any, any> {
    let adjust;
    if (mode.startsWith('window')) {
        const modeParam = mode.endsWith('-trailing') ? 'trailing' : 'normal';
        adjust = memo({ mode: modeParam, sum, invalidValue }, buildGroupWindowAccFn);
    } else {
        adjust = memo({ mode: mode as 'normal' | 'trailing', separateNegative, invalidValue }, buildGroupAccFn);
    }

    return {
        type: 'group-value-processor',
        matchGroupIds: [matchGroupId],
        adjust,
    };
}

function groupStackAccFn() {
    return () => (columns: any[][], valueIndexes: number[], datumIndex: number) => {
        // Datum scope.
        const acc = new Float64Array(32);
        let stackCount = 0;
        for (const valueIdx of valueIndexes) {
            const column = columns[valueIdx];
            const currentValue = column[datumIndex];
            acc[stackCount] = Number.isFinite(currentValue) ? currentValue : NaN;
            stackCount += 1;
            column[datumIndex] = acc.subarray(0, stackCount);
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

function valueIndices(id: string, previousData: ProcessedData<any>, processedData: ProcessedData<any>) {
    const prevIndices = [];
    const previousValues = previousData.defs.values;
    for (let i = 0; i < previousValues.length; i += 1) {
        const value = previousValues[i];
        if (value.scopes?.includes(id) === false) continue;

        prevIndices.push(i);
    }

    const nextIndices = [];
    let previousIndicesIndex = 0;
    const nextValues = processedData.defs.values;
    for (let i = 0; i < nextValues.length; i += 1) {
        const value = nextValues[i];
        if (value.scopes?.includes(id) === false) continue;

        if (previousIndicesIndex >= prevIndices.length) return;

        const previousIndex = prevIndices[previousIndicesIndex];
        const previousValue = previousValues[previousIndex];

        // Incompatible
        if (value.property !== previousValue.property) return;

        nextIndices.push(i);
        previousIndicesIndex += 1;
    }

    // Incompatible
    if (prevIndices.length !== nextIndices.length) return;

    return { prevIndices, nextIndices };
}

function columnsEqual(
    previousColumns: any[][],
    nextColumns: any[][],
    previousIndices: number[] | undefined,
    nextIndices: number[] | undefined,
    previousDatumIndex: number,
    nextDatumIndex: number
) {
    if (previousIndices == null || nextIndices == null) {
        return false;
    }

    for (let indicesIndex = 0; indicesIndex < previousIndices.length; indicesIndex += 1) {
        const previousIndex = previousIndices[indicesIndex];
        const nextIndex = nextIndices[indicesIndex];

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
        calculate(processedData): ProcessedOutputDiff | undefined {
            const moved = new Map<string, number>();
            const added = new Map<string, number>();
            const updated = new Map<string, number>();
            const removed = new Map<string, number>();

            const previousKeys = previousData.keys;
            const keys = processedData.keys;

            const previousColumns = previousData.columns;
            const columns = processedData.columns;

            const indices = valueIndices(id, previousData, processedData);
            if (indices == null) return;

            const { prevIndices, nextIndices } = indices;

            const length = Math.max(previousData.rawData.length, processedData.rawData.length);

            for (let i = 0; i < length; i++) {
                const hasPreviousDatum = i < previousData.rawData.length;
                const hasDatum = i < processedData.rawData.length;

                const prevKeys = hasPreviousDatum ? datumKeys(previousKeys, i) : undefined;
                const prevId = prevKeys != null ? createDatumId(prevKeys) : '';
                const dKeys = hasDatum ? datumKeys(keys, i) : undefined;
                const datumId = dKeys != null ? createDatumId(dKeys) : '';

                if (hasDatum && hasPreviousDatum && prevId === datumId) {
                    if (!columnsEqual(previousColumns, columns, prevIndices, nextIndices, i, i)) {
                        updated.set(datumId, i);
                    }
                    continue;
                }

                const removedIndex = removed.get(datumId);
                if (removedIndex != null) {
                    if (
                        updateMovedData ||
                        !columnsEqual(previousColumns, columns, prevIndices, nextIndices, removedIndex, i)
                    ) {
                        updated.set(datumId, i);
                        moved.set(datumId, i);
                    }
                    removed.delete(datumId);
                } else if (hasDatum) {
                    added.set(datumId, i);
                }

                const addedIndex = added.get(prevId);
                if (addedIndex != null) {
                    if (
                        updateMovedData ||
                        !columnsEqual(previousColumns, columns, prevIndices, nextIndices, addedIndex, i)
                    ) {
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
            return {
                changed,
                added: new Set(added.keys()),
                updated: new Set(updated.keys()),
                removed: new Set(removed.keys()),
                moved: new Set(moved.keys()),
            };
        },
    };
}

type KeyType = string | number | boolean | object;
export function createDatumId(keys: KeyType | KeyType[], ...extraKeys: (string | number | boolean)[]): any {
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
