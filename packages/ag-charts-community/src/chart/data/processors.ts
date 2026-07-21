import {
    Logger,
    type ScaleType,
    absValue,
    clamp,
    isContinuous,
    isFiniteNumber,
    isFiniteNumericValue,
    isISO8601,
    isNegative,
    maxValue,
    memo,
    minValue,
    narrowToNumber,
    subtractValues,
    timeValueToNumber,
    transformIntegratedCategoryValue,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { accumulatedValue, addAccumulated, range, trailingAccumulatedValue } from './aggregateFunctions';
import {
    type DataGroup,
    type DatumPropertyDefinition,
    type GroupValueProcessorDefinition,
    KEY_SORT_ORDERS,
    NULL_KEY_STRING,
    type ProcessedData,
    type ProcessedOutputDiff,
    type ProcessorFn,
    type ProcessorOutputPropertyDefinition,
    type PropertyValueProcessorDefinition,
    type ReducerOutputPropertyDefinition,
    UNDEFINED_KEY_STRING,
    datumKeys,
} from './dataModel';

export const MAX_ANIMATABLE_NODES = 1000;

function combineIntervalBandResults(
    bandResults: unknown[],
    fallback: AgNumericValue,
    combine: (a: AgNumericValue, b: AgNumericValue) => AgNumericValue
): AgNumericValue {
    let combined: AgNumericValue | undefined;
    for (const result of bandResults) {
        if (!isFiniteNumericValue(result)) continue;
        combined = combined == null ? result : combine(combined, result);
    }
    return combined ?? fallback;
}

export function processedDataIsAnimatable(processedData: ProcessedData<any>) {
    return processedData.input.count <= MAX_ANIMATABLE_NODES;
}

function basicContinuousCheckDatumValidation(value: any) {
    return value != null && isContinuous(value);
}

const TIME_AXIS_ACCEPTED_FORMATS =
    "Date, epoch number/bigint, or strict ISO 8601 string (e.g. '2024-01-15', '2024-01-15T10:30:00Z')";

// Separate from basicContinuousCheckDatumValidation so only time scales accept ISO 8601 strings.
function basicTimeCheckDatumValidation(value: any, _datum?: any, index?: number) {
    if (value == null) return false;
    if (isContinuous(value) || isISO8601(value)) return true;
    if (typeof value === 'string') {
        Logger.default.warnOnce(
            `unsupported value [${value}] at row ${index ?? '?'} on a time axis; expected ${TIME_AXIS_ACCEPTED_FORMATS}. The value is ignored.`
        );
    }
    return false;
}

function basicDiscreteCheckDatumValidation(value: any) {
    return value != null;
}

function basicDiscreteCheckDatumValidationAllowNull(_value: any) {
    return true; // Allow both null and undefined when allowNullKey is set
}

function getValidationFn(scaleType?: ScaleType, allowNullKey?: boolean) {
    switch (scaleType) {
        case 'time':
        case 'unit-time':
        case 'ordinal-time':
            return basicTimeCheckDatumValidation;
        case 'number':
        case 'log':
        case 'color':
            return basicContinuousCheckDatumValidation;
        default:
            return allowNullKey ? basicDiscreteCheckDatumValidationAllowNull : basicDiscreteCheckDatumValidation;
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

function isTimeScaleType(scaleType?: ScaleType): boolean {
    return scaleType === 'time' || scaleType === 'unit-time' || scaleType === 'ordinal-time';
}

export function keyProperty<K>(propName: K, scaleType?: ScaleType, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const allowNullKey = opts.allowNullKey ?? false;
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'key',
        valueType: getValueType(scaleType),
        timeDomain: isTimeScaleType(scaleType),
        validation: opts.validation ?? getValidationFn(scaleType, allowNullKey),
        ...opts,
    };
    return result;
}

export function valueProperty<K>(propName: K, scaleType?: ScaleType, opts: Partial<DatumPropertyDefinition<K>> = {}) {
    const allowNullKey = opts.allowNullKey ?? false;
    const result: DatumPropertyDefinition<K> = {
        property: propName,
        type: 'value',
        valueType: getValueType(scaleType),
        timeDomain: isTimeScaleType(scaleType),
        validation: opts.validation ?? getValidationFn(scaleType, allowNullKey),
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

// Bigint kept exact; ISO 8601 string parses to epoch ms; anything else coerces to Number (NaN/Infinity skipped).
function finiteKey(key: unknown): AgNumericValue | undefined {
    if (typeof key === 'bigint') return key;
    if (isISO8601(key)) return timeValueToNumber(key);
    const n = Number(key);
    return Number.isFinite(n) ? n : undefined;
}

// Subtract before narrowing: coercing each key first collapses gaps below the Number ULP at large magnitudes.
function keyInterval(curr: AgNumericValue, prev: AgNumericValue): AgNumericValue {
    return absValue(subtractValues(curr, prev));
}

export const SMALLEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'smallestKeyInterval'> = {
    type: 'reducer',
    property: 'smallestKeyInterval',
    initialValue: Infinity,
    reducer() {
        let prevKey: AgNumericValue | undefined;
        return function smallestKeyIntervalReducerFn(smallestSoFar, keys) {
            const key = finiteKey(keys[0]);
            const currentSmallest = smallestSoFar ?? Infinity;
            if (key == null) return currentSmallest;
            const interval = prevKey == null ? undefined : keyInterval(key, prevKey);
            prevKey = key;
            if (interval != null && interval > 0 && interval < currentSmallest) {
                return interval;
            }
            return currentSmallest;
        };
    },
    supportsBanding: true,
    combineResults(bandResults) {
        return combineIntervalBandResults(bandResults, Infinity, minValue);
    },
    needsOverlap: true,
};

export const LARGEST_KEY_INTERVAL: ReducerOutputPropertyDefinition<'largestKeyInterval'> = {
    type: 'reducer',
    property: 'largestKeyInterval',
    initialValue: -Infinity,
    reducer() {
        let prevKey: AgNumericValue | undefined;
        return function largestKeyIntervalReducerFn(largestSoFar, keys) {
            const key = finiteKey(keys[0]);
            const currentLargest = largestSoFar ?? -Infinity;
            if (key == null) return currentLargest;
            const interval = prevKey == null ? undefined : keyInterval(key, prevKey);
            prevKey = key;
            if (interval != null && interval > 0 && interval > currentLargest) {
                return interval;
            }
            return currentLargest;
        };
    },
    supportsBanding: true,
    combineResults(bandResults) {
        return combineIntervalBandResults(bandResults, -Infinity, maxValue);
    },
    needsOverlap: true,
};

// Compares two domain-group key values (a and b share a type — columns are uniform). bigint is compared
// directly: subtraction yields a bigint that Array.sort ToNumber-coerces (throws). number/Date subtract.
function compareGroupKeys(a: any, b: any): number {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
    return a - b;
}

export const SORT_DOMAIN_GROUPS: ProcessorOutputPropertyDefinition<'sortedGroupDomain'> = {
    type: 'processor',
    property: 'sortedGroupDomain',
    calculate: function sortedGroupDomainFn({ domain: { groups } }) {
        return groups?.slice().sort((a, b) => {
            for (let i = 0; i < a.length; i++) {
                const result = compareGroupKeys(a[i], b[i]);
                if (result !== 0) {
                    return result;
                }
            }
            return 0;
        });
    },
};

function normaliseFnBuilder({ normaliseTo }: { normaliseTo: number }) {
    const normalise = (val: AgNumericValue | null, extent: number) => {
        if (extent === 0) return 0;
        // Narrow bigint to Number: normalisation yields a fraction, and the column becomes Number after this pass.
        const result = (Number(val ?? 0) * normaliseTo) / extent;
        if (result >= 0) {
            return Math.min(normaliseTo, result);
        }
        return Math.max(-normaliseTo, result);
    };

    return () => () => (columns: any[][], valueIndexes: number[], dataGroup: DataGroup, groupIndex: number) => {
        const extent = normaliseFindExtent(columns, valueIndexes, dataGroup, groupIndex);
        for (const valueIdx of valueIndexes) {
            const datumIndices = dataGroup.datumIndices[valueIdx];
            if (datumIndices == null) continue;

            for (const relativeDatumIndex of datumIndices) {
                // Convert relative datum index to absolute column index
                // (relative index is offset from group start, absolute is for the entire column)
                const datumIndex = groupIndex + relativeDatumIndex;
                const column = columns[valueIdx];
                const value: AgNumericValue | null = column[datumIndex];
                if (value == null) {
                    column[datumIndex] = undefined;
                    continue;
                }
                column[datumIndex] = normalise(value, extent);
            }
        }
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
            const value: AgNumericValue | null | (AgNumericValue | null)[] = column[datumIndex];
            if (value == null) continue;
            // Note - Array.isArray(new Float64Array) is false, and this type is used for stack accumulators.
            let valueExtent: number;
            if (typeof value === 'number') {
                valueExtent = value;
            } else if (typeof value === 'bigint') {
                valueExtent = Number(value);
            } else {
                valueExtent = Math.max(...value.map((v) => Number(v ?? 0)));
            }
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
        return function normalisePropertyResultFn(pData: ProcessedData<any>, pIdx: number) {
            let [start, end] = pData.domain.values[pIdx];
            if (rangeMin != null) start = rangeMin;
            if (rangeMax != null) end = rangeMax;
            // Normalisation maps to an angle/ratio with Number factors, so narrow bigint
            // endpoints/values to Number — a bigint would otherwise throw when mixed.
            const startValue = narrowToNumber(start);
            const span = narrowToNumber(end) - startValue;

            pData.domain.values[pIdx] = [normaliseTo[0], normaliseTo[1]];

            const column = pData.columns[pIdx];
            for (let datumIndex = 0; datumIndex < column.length; datumIndex += 1) {
                column[datumIndex] = normalise(narrowToNumber(column[datumIndex]), startValue, span);
            }
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

function buildFilterValidation([id, yKey, yFilterKey]: [id: string, yKey: string, yFilterKey: string]) {
    return function calculate(result: ProcessedData<any>, previousValue: any) {
        if (previousValue === true) return true;

        const yKeyIndex = result.defs.values.findIndex((d) => d.scopes.includes(id) && d.id === yKey);
        const yFilterKeyIndex = result.defs.values.findIndex((d) => d.scopes.includes(id) && d.id === yFilterKey);

        const yValues = result.columns[yKeyIndex];
        const yFilterValues = result.columns[yFilterKeyIndex];

        if (yValues.length !== yFilterValues.length) return true;

        for (let i = 0; i < yValues.length; i++) {
            // absValue preserves bigint; Math.abs throws on bigint (ToNumber) for mixed-numeric columns.
            if (absValue(yFilterValues[i]) > absValue(yValues[i])) return true;
        }

        return false;
    };
}

export function filterValidation(id: string, yKey: string, yFilterKey: string): ProcessorOutputPropertyDefinition {
    const calculate = memo([id, yKey, yFilterKey], buildFilterValidation);

    return {
        type: 'processor',
        property: 'filteredValueExceedUnfiltered',
        calculate,
    };
}

const ANIMATION_VALIDATION_UNIQUE_KEYS = 0b01;
const ANIMATION_VALIDATION_ORDERED_KEYS = 0b10;

function animationValidationProcessValue(def: DatumPropertyDefinition<unknown>, domainValues: any[], column: any[]) {
    let validation = ANIMATION_VALIDATION_UNIQUE_KEYS | ANIMATION_VALIDATION_ORDERED_KEYS;

    if (def.valueType === 'category') {
        // For category values, check if domain has fewer values than column (duplicates exist)
        if (domainValues.length < column.length) validation &= ~ANIMATION_VALIDATION_UNIQUE_KEYS;
        return validation;
    }

    // For continuous values, scan the column. finiteKey() resolves bigint (exact), ISO 8601 strings (epoch ms)
    // and Date alike, so an ISO-string value isn't misread as unordered the way raw valueOf() + isContinuous() is.
    let lastValue = column[0] == null ? undefined : finiteKey(column[0]);
    for (let d = 1; validation !== 0 && d < column.length; d++) {
        const keyValue = column[d] == null ? undefined : finiteKey(column[d]);
        if (keyValue === undefined || (lastValue !== undefined && lastValue > keyValue)) {
            validation &= ~ANIMATION_VALIDATION_ORDERED_KEYS;
        }
        if (keyValue !== undefined && lastValue === keyValue) validation &= ~ANIMATION_VALIDATION_UNIQUE_KEYS;
        lastValue = keyValue;
    }

    return validation;
}

function buildAnimationValidationFn(valueKeyIds?: string[]) {
    return function calculate(result: ProcessedData<any>, _previousValue: any) {
        if (!processedDataIsAnimatable(result)) return;

        const { keys: keysDefs, values: valuesDef } = result.defs;
        const {
            input,
            domain: { values: domainValues },
            columns,
        } = result;

        let uniqueKeys = true;
        let orderedKeys = true;

        if (input.count !== 0) {
            // Use pre-computed KEY_SORT_ORDERS metadata for keys (computed during extraction)
            const keySortOrders = result[KEY_SORT_ORDERS];
            for (let i = 0; (uniqueKeys || orderedKeys) && i < keysDefs.length; i++) {
                const def = keysDefs[i];
                const entry = keySortOrders.get(i);

                if (def.valueType === 'category') {
                    // For category keys, check uniqueness via domain size vs data size
                    // (categories don't have a meaningful sort order)
                    const domainSize = result.domain.keys[i]?.length ?? 0;
                    const dataSize = result.keys[i]?.values().next().value?.length ?? 0;
                    if (domainSize < dataSize) uniqueKeys = false;
                } else if (entry) {
                    // Use pre-computed metadata for continuous keys - no scanning needed!
                    if (entry.isUnique === false) uniqueKeys = false;
                    if (entry.sortOrder !== 1) orderedKeys = false;
                }
            }

            // Process value keys if specified (these don't have pre-computed metadata)
            if (valueKeyIds && valueKeyIds.length > 0) {
                let validation = ANIMATION_VALIDATION_UNIQUE_KEYS | ANIMATION_VALIDATION_ORDERED_KEYS;
                for (let i = 0; validation !== 0 && i < valuesDef.length; i++) {
                    const value = valuesDef[i];
                    if (!valueKeyIds.includes(value.id as string)) continue;
                    validation &= animationValidationProcessValue(value, domainValues[i], columns[i]);
                }
                if ((validation & ANIMATION_VALIDATION_UNIQUE_KEYS) === 0) uniqueKeys = false;
                if ((validation & ANIMATION_VALIDATION_ORDERED_KEYS) === 0) orderedKeys = false;
            }
        }

        return { uniqueKeys, orderedKeys };
    };
}

function incrementalCalculateAnimationValidation() {
    return {
        uniqueKeys: true,
        orderedKeys: false,
    };
}

export function animationValidation(valueKeyIds?: string[]): ProcessorOutputPropertyDefinition {
    const calculate = memo(valueKeyIds, buildAnimationValidationFn);

    return {
        type: 'processor',
        property: 'animationValidation',
        calculate,
        incrementalCalculate: incrementalCalculateAnimationValidation,
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
                // Number `0` seeds promote to bigint via addAccumulated so stacked totals stay exact.
                const acc: [AgNumericValue, AgNumericValue] = [0, 0];
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
                        const isBigInt = typeof currentVal === 'bigint';
                        if (!isBigInt && !isFiniteNumber(currentVal)) continue;

                        const useNegative = separateNegative && (isBigInt ? currentVal < 0n : isNegative(currentVal));
                        const accValue = useNegative ? stackNegative : stackPositive;
                        if (mode === 'normal') {
                            column[datumIndex] = addAccumulated(accValue, currentVal);
                        } else {
                            column[datumIndex] = accValue;
                        }

                        if (!didAccumulate) {
                            const accIndex = useNegative ? 0 : 1;
                            acc[accIndex] = addAccumulated(accValue, currentVal);

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
            if (!processedDataIsAnimatable(processedData)) {
                // Skip expensive O(n) comparison but still signal that data may have changed.
                return {
                    ...previousValue,
                    [id]: {
                        changed: true,
                        added: new Set<string>(),
                        updated: new Set<string>(),
                        removed: new Set<string>(),
                        moved: new Set<string>(),
                    },
                };
            }

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

            // Check if any key definition allows null values
            const allowNull = processedData.defs.keys.some((def) => def.allowNullKey === true);

            for (let i = 0; i < length; i++) {
                const hasPreviousDatum = i < previousData.input.count;
                const hasDatum = i < processedData.input.count;

                const prevKeys = hasPreviousDatum ? datumKeys(previousKeys, i, allowNull) : undefined;
                const prevId = prevKeys == null ? '' : createDatumId(...prevKeys);
                const dKeys = hasDatum ? datumKeys(keys, i, allowNull) : undefined;
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

type KeyType = string | number | bigint | boolean | null | undefined;

export function createDatumId(key: number): number;
export function createDatumId(key: boolean): boolean;
export function createDatumId(...keys: KeyType[]): string;
export function createDatumId(...keys: KeyType[]): string | number | boolean {
    if (keys.length === 1) {
        const key = transformIntegratedCategoryValue(keys[0]);
        // Handle null and undefined distinctly to avoid collision with strings "null" and "undefined"
        // and to treat them as separate categories
        if (key === null) return NULL_KEY_STRING;
        if (key === undefined) return UNDEFINED_KEY_STRING;
        const isPrimitive = typeof key === 'boolean' || typeof key === 'number' || typeof key === 'string';
        // Avoid toString if not necessary
        if (isPrimitive) return key;
    }
    return keys
        .map((key) => {
            const transformed = transformIntegratedCategoryValue(key);
            if (transformed === null) return NULL_KEY_STRING;
            if (transformed === undefined) return UNDEFINED_KEY_STRING;
            return transformed;
        })
        .join('___');
}
