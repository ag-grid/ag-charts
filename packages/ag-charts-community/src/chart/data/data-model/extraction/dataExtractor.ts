import { Logger, first, isISO8601, isNumberObject, iterate } from 'ag-charts-core';

import { ContinuousDomain } from '../../dataDomain';
import {
    COLUMN_SORT_ORDERS,
    type ColumnValueType,
    DOMAIN_BANDS,
    DOMAIN_RANGES,
    type InternalDatumPropertyDefinition,
    KEY_SORT_ORDERS,
    REDUCER_BANDS,
    type ScopeId,
    type SortOrderEntry,
    type UngroupedData,
} from '../../dataModelTypes';
import type { DataSet } from '../../dataSet';
import type { DataModelContext } from '../dataModelContext';
import type { DomainManager } from '../domain/domainManager';
import type { SpecializedProcessValueFn } from '../domain/processValueFactory';
import { createArray } from '../utils/helpers';

/** Tracks ordering/uniqueness during key extraction */
interface KeyExtractionTracker {
    lastValue: number | undefined;
    sortOrder: 1 | -1 | 0; // 0 = undetermined, 1 = ascending, -1 = descending
    isUnique: boolean;
    isOrdered: boolean;
}

function createKeyTracker(): KeyExtractionTracker {
    return { lastValue: undefined, sortOrder: 0, isUnique: true, isOrdered: true };
}

function updateKeyTracker(tracker: KeyExtractionTracker, value: unknown): void {
    // Only track numeric values (including Date.valueOf())
    const numericValue = typeof value === 'number' ? value : (value as Date)?.valueOf?.();
    if (typeof numericValue !== 'number' || !Number.isFinite(numericValue)) return;

    if (tracker.lastValue === undefined) {
        tracker.lastValue = numericValue;
        return;
    }

    const diff = numericValue - tracker.lastValue;
    if (diff === 0) {
        tracker.isUnique = false;
    } else if (tracker.isOrdered) {
        const direction = diff > 0 ? 1 : -1;
        if (tracker.sortOrder === 0) {
            tracker.sortOrder = direction;
        } else if (tracker.sortOrder !== direction) {
            tracker.isOrdered = false;
        }
    }
    tracker.lastValue = numericValue;
}

function trackerToSortOrderEntry(tracker: KeyExtractionTracker): SortOrderEntry {
    return {
        sortOrder: tracker.isOrdered && tracker.sortOrder !== 0 ? tracker.sortOrder : undefined,
        isUnique: tracker.isUnique,
        isDirty: false,
    };
}

/** Accumulates the resolved {@link ColumnValueType} for a single column as its values are extracted. */
interface ColumnTypeTracker {
    type: ColumnValueType | undefined;
    /** Row index where `number` and `bigint` were first observed to mix; used for the one-shot warning. */
    mixedAtIndex: number | undefined;
    /** Row index where a date column was first observed to mix with a non-date, non-numeric value. */
    mixedDateAtIndex: number | undefined;
}

function valueColumnType(value: unknown): ColumnValueType | undefined {
    switch (typeof value) {
        case 'number':
            return 'number';
        case 'bigint':
            return 'bigint';
        case 'boolean':
            return 'boolean';
        case 'string':
            return isISO8601(value) ? 'date' : 'string';
        case 'object':
            if (value == null) return undefined;
            if (value instanceof Date) return 'date';
            return isNumberObject(value) ? 'number' : 'object';
        default:
            return undefined;
    }
}

function updateColumnTypeTracker(
    tracker: ColumnTypeTracker,
    value: unknown,
    datumIndex: number
): ColumnValueType | undefined {
    const observed = valueColumnType(value);
    if (observed == null) return undefined;

    if (tracker.type == null || tracker.type === observed) {
        tracker.type = observed;
    } else if (isDateColumnType(tracker.type) || isDateColumnType(observed)) {
        // A date column tolerates numeric epochs, but mixing in strings/booleans/objects is incompatible:
        // those values cannot be placed on a time axis, so flag the column for a one-shot warning.
        const otherType = isDateColumnType(tracker.type) ? observed : tracker.type;
        if (!isNumericColumnType(otherType)) {
            tracker.mixedDateAtIndex ??= datumIndex;
        }
        tracker.type = 'date';
    } else if (isNumericColumnType(tracker.type) && isNumericColumnType(observed)) {
        // Mixed number/bigint narrows bigints to Number (lossy beyond ±2^53); warned once at series level.
        tracker.mixedAtIndex ??= datumIndex;
        tracker.type = 'mixed-numeric';
    }

    return observed;
}

function isNumericColumnType(type: ColumnValueType): boolean {
    return type === 'number' || type === 'bigint' || type === 'mixed-numeric';
}

function isDateColumnType(type: ColumnValueType): boolean {
    return type === 'date';
}

// Explicit timezone iff the ISO string ends with `Z` or a trailing `±HH:MM` offset.
const ISO_8601_EXPLICIT_TZ = /(Z|[+-]\d{2}:\d{2})$/;

interface TimezoneTracker {
    explicit: { value: string; index: number } | undefined;
    implicit: { value: string; index: number } | undefined;
}

function updateTimezoneTracker(tracker: TimezoneTracker, value: unknown, datumIndex: number): void {
    if (typeof value !== 'string') return;
    if (ISO_8601_EXPLICIT_TZ.test(value)) {
        tracker.explicit ??= { value, index: datumIndex };
    } else {
        tracker.implicit ??= { value, index: datumIndex };
    }
}

/**
 * DataExtractor handles data extraction from DataSet sources.
 *
 * EXTRACTION RESPONSIBILITIES:
 * - Extracts key and value data from DataSet sources
 * - Processes data through property definitions
 * - Tracks data validity and invalid entries per scope
 * - Builds initial ungrouped data structure for further processing
 *
 * DATA VALIDITY TRACKING:
 * - Maintains invalid key/value flags per scope
 * - Enables partial data rendering when some entries are invalid
 * - Tracks partial valid data count for optimization decisions
 */
export class DataExtractor<D extends object, K extends keyof D & string> {
    constructor(
        private readonly ctx: DataModelContext<D, K>,
        private readonly domainManager: DomainManager<D, K>
    ) {}

    extractData(sources: Map<string, DataSet<unknown>>): UngroupedData<D> {
        const { dataDomain, getProcessValue, allScopesHaveSameDefs } =
            this.domainManager.initDataDomainProcessor('extend');

        const { keys: keyDefs, values: valueDefs } = this.ctx;

        const {
            invalidData,
            invalidKeys,
            invalidKeyCount,
            invalidDataCount,
            missingData,
            allKeyMappings,
            keySortOrders,
        } = this.extractKeys(keyDefs, sources, getProcessValue);

        const { columns, columnScopes, columnNeedValueOf, columnValueType, partialValidDataCount, maxDataLength } =
            this.extractValues(
                invalidData,
                invalidDataCount,
                missingData,
                valueDefs,
                sources,
                invalidKeys,
                getProcessValue
            );

        const propertyDomain = (def: InternalDatumPropertyDefinition<K>) => {
            const defDomain = dataDomain.get(def)!;
            const result = defDomain.getDomain();
            // Ignore starting values.
            if (ContinuousDomain.is(defDomain) && result[0] > result[1]) {
                return [];
            }
            return result;
        };

        return {
            type: 'ungrouped',
            input: { count: maxDataLength },
            scopes: new Set(sources.keys()),
            dataSources: sources,
            aggregation: undefined,
            keys: [...allKeyMappings.values()],
            columns,
            columnScopes,
            columnNeedValueOf,
            columnValueType,
            invalidKeys,
            invalidKeyCount,
            invalidData,
            invalidDataCount,
            missingData,
            domain: {
                keys: keyDefs.map(propertyDomain),
                values: valueDefs.map(propertyDomain),
            },
            defs: {
                allScopesHaveSameDefs,
                keys: keyDefs,
                values: valueDefs,
            },
            partialValidDataCount,
            time: 0,
            version: 0,
            [DOMAIN_RANGES]: new Map(),
            [KEY_SORT_ORDERS]: keySortOrders,
            [COLUMN_SORT_ORDERS]: new Map(),
            [DOMAIN_BANDS]: new Map(),
            [REDUCER_BANDS]: new Map(),
        } satisfies UngroupedData<D>;
    }

    private extractKeys(
        keyDefs: InternalDatumPropertyDefinition<K>[],
        sources: Map<string, DataSet<unknown>>,
        getProcessValue: (def: InternalDatumPropertyDefinition<K>) => SpecializedProcessValueFn
    ) {
        const invalidKeys = new Map<ScopeId, boolean[]>();
        const invalidData = new Map<ScopeId, boolean[]>();
        const invalidKeyCount = new Map<ScopeId, number>();
        const invalidDataCount = new Map<ScopeId, number>();
        const missingData = new Map<ScopeId, boolean[]>();
        const allKeys = new Map<(typeof keyDefs)[number], Map<ScopeId, unknown[]>>();
        const keySortOrders = new Map<number, SortOrderEntry>();

        let keyDefKeys: Map<ScopeId, unknown[]>;
        let scopeDataProcessed: Map<unknown[], ScopeId>;
        const keyProcessors = keyDefs.map((def) => getProcessValue(def));

        const cloneScope = (source: unknown[], target: ScopeId) => {
            const sourceScope = scopeDataProcessed.get(source)!;
            keyDefKeys.set(target, keyDefKeys.get(sourceScope)!);
            if (invalidKeys.has(sourceScope)) {
                invalidKeys.set(target, invalidKeys.get(sourceScope)!);
                invalidData.set(target, invalidData.get(sourceScope)!);
                invalidDataCount.set(target, invalidDataCount.get(sourceScope)!);
            }
        };

        for (const [keyDefIndex, keyDef] of keyDefs.entries()) {
            const { invalidValue, scopes: keyScopes } = keyDef;
            const processKeyValue = keyProcessors[keyDefIndex];

            keyDefKeys = new Map<ScopeId, unknown[]>();
            scopeDataProcessed = new Map<unknown[], ScopeId>();

            allKeys.set(keyDef, keyDefKeys);

            // Track ordering/uniqueness for this key definition
            const tracker = createKeyTracker();
            const typeTracker: ColumnTypeTracker = {
                type: undefined,
                mixedAtIndex: undefined,
                mixedDateAtIndex: undefined,
            };
            const tzTracker: TimezoneTracker = { explicit: undefined, implicit: undefined };

            for (const scope of keyScopes ?? []) {
                const data = sources.get(scope)?.data ?? [];
                if (scopeDataProcessed.has(data)) {
                    cloneScope(data, scope);
                    continue;
                }

                const keys: unknown[] = [];
                keyDefKeys.set(scope, keys);
                scopeDataProcessed.set(data, scope);

                let invalidScopeKeys;
                let invalidScopeData;
                let invalidScopeKeysCount = 0;
                let missingScopeData;
                for (let datumIndex = 0; datumIndex < data.length; datumIndex++) {
                    if (data[datumIndex] == null || typeof data[datumIndex] !== 'object') {
                        // Count non-object items as invalid data
                        invalidScopeKeys ??= createArray(data.length, false);
                        invalidScopeData ??= createArray(data.length, false);
                        invalidScopeKeysCount += 1;
                        invalidScopeKeys[datumIndex] = true;
                        invalidScopeData[datumIndex] = true;
                        keys.push(invalidValue);
                        continue;
                    }

                    const result = processKeyValue(data[datumIndex], datumIndex, scope);

                    if (result.valid) {
                        keys.push(result.value);
                        // Track ordering/uniqueness for valid keys
                        updateKeyTracker(tracker, result.value);
                        if (updateColumnTypeTracker(typeTracker, result.value, datumIndex) === 'date') {
                            updateTimezoneTracker(tzTracker, result.value, datumIndex);
                        }
                        continue;
                    }

                    if (result.missing) {
                        missingScopeData ??= createArray(data.length, false);
                    }

                    keys.push(invalidValue);

                    invalidScopeKeys ??= createArray(data.length, false);
                    invalidScopeData ??= createArray(data.length, false);

                    invalidScopeKeysCount += 1;
                    invalidScopeKeys[datumIndex] = true;
                    invalidScopeData[datumIndex] = true;
                }

                if (invalidScopeKeys && invalidScopeData) {
                    invalidKeys.set(scope, invalidScopeKeys);
                    invalidData.set(scope, invalidScopeData);
                    invalidKeyCount.set(scope, invalidScopeKeysCount);
                    invalidDataCount.set(scope, invalidScopeKeysCount);
                }

                if (missingScopeData) {
                    missingData.set(scope, missingScopeData);
                }
            }

            // Store the computed sort order entry for this key definition
            keySortOrders.set(keyDefIndex, trackerToSortOrderEntry(tracker));
            this.warnMixedTimezoneColumn(keyDef.property, typeTracker.type, tzTracker);
        }
        return {
            invalidData,
            invalidKeys,
            invalidKeyCount,
            invalidDataCount,
            missingData,
            allKeyMappings: allKeys,
            keySortOrders,
        };
    }

    private markScopeDatumInvalid(
        scopes: string[],
        data: unknown[],
        datumIndex: number,
        invalidData: Map<ScopeId, boolean[]>,
        invalidDataCount: Map<ScopeId, number>
    ) {
        for (const scope of scopes) {
            if (!invalidData.has(scope)) {
                invalidData.set(scope, createArray(data.length, false));
                invalidDataCount.set(scope, 0);
            }
            const scopeInvalidData = invalidData.get(scope)!;
            if (!scopeInvalidData[datumIndex]) {
                scopeInvalidData[datumIndex] = true;
                invalidDataCount.set(scope, invalidDataCount.get(scope)! + 1);
            }
        }
    }

    private markScopeDatumMissing(
        scopes: string[],
        data: unknown[],
        datumIndex: number,
        missingData: Map<ScopeId, boolean[]>
    ) {
        for (const scope of scopes) {
            if (!missingData.has(scope)) {
                missingData.set(scope, createArray(data.length, false));
            }
            const scopeMissingData = missingData.get(scope)!;
            if (!scopeMissingData[datumIndex]) {
                scopeMissingData[datumIndex] = true;
            }
        }
    }

    private extractValues(
        invalidData: Map<ScopeId, boolean[]>,
        invalidDataCount: Map<ScopeId, number>,
        missingData: Map<ScopeId, boolean[]>,
        valueDefs: InternalDatumPropertyDefinition<K>[],
        sources: Map<string, DataSet<unknown>>,
        scopeInvalidKeys: Map<ScopeId, boolean[]>,
        getProcessValue: (def: InternalDatumPropertyDefinition<K>) => SpecializedProcessValueFn
    ) {
        let partialValidDataCount = 0;

        const columns: unknown[][] = [];
        const allColumnScopes: Set<ScopeId>[] = [];
        const columnNeedValueOf: boolean[] = [];
        const columnValueType: (ColumnValueType | undefined)[] = [];
        let maxDataLength = 0;
        const valueProcessors = valueDefs.map((def) => getProcessValue(def));

        for (const [valueDefIndex, def] of valueDefs.entries()) {
            const { invalidValue } = def;
            const processValueForDef = valueProcessors[valueDefIndex];

            const valueSources = new Set(def.scopes.map((s) => sources.get(s)));
            if (valueSources.size > 1) {
                throw new Error(`AG Charts - more than one data source for: ${JSON.stringify(def)}`);
            }
            const columnScopes = new Set(def.scopes);
            const columnScope = first(def.scopes);
            const columnSource = sources.get(columnScope)?.data ?? [];
            const column = new Array<unknown>();
            const invalidKeys = scopeInvalidKeys.get(columnScope);
            let needsValueOf = false;
            const typeTracker: ColumnTypeTracker = {
                type: undefined,
                mixedAtIndex: undefined,
                mixedDateAtIndex: undefined,
            };
            const tzTracker: TimezoneTracker = { explicit: undefined, implicit: undefined };
            for (let datumIndex = 0; datumIndex < columnSource.length; datumIndex++) {
                if (columnSource[datumIndex] == null || typeof columnSource[datumIndex] !== 'object') {
                    // Count non-object items as invalid data
                    this.markScopeDatumInvalid(def.scopes, columnSource, datumIndex, invalidData, invalidDataCount);
                    column[datumIndex] = invalidValue;
                    continue;
                }

                const valueDatum = columnSource[datumIndex];
                const invalidKey = invalidKeys == null ? false : invalidKeys[datumIndex];

                const result = processValueForDef(valueDatum, datumIndex, def.scopes);
                let value = result.value;

                if (invalidKey || !result.valid) {
                    this.markScopeDatumInvalid(def.scopes, columnSource, datumIndex, invalidData, invalidDataCount);
                } else if (result.missing) {
                    this.markScopeDatumMissing(def.scopes, columnSource, datumIndex, missingData);
                } else if (updateColumnTypeTracker(typeTracker, result.value, datumIndex) === 'date') {
                    updateTimezoneTracker(tzTracker, result.value, datumIndex);
                }

                if (invalidKey) {
                    value = invalidValue;
                } else if (!result.valid) {
                    partialValidDataCount += 1;

                    value = invalidValue;
                }

                // Detect if this column contains Date objects or other objects needing valueOf()
                if (!needsValueOf && value != null && typeof value === 'object') {
                    needsValueOf = true;
                }

                column[datumIndex] = value;
            }

            if (typeTracker.type === 'mixed-numeric' && typeTracker.mixedAtIndex != null) {
                this.warnMixedNumericColumn(columnScope, def.property, typeTracker.mixedAtIndex);
            }
            if (typeTracker.mixedDateAtIndex != null) {
                this.warnMixedDateColumn(columnScope, def.property, typeTracker.mixedDateAtIndex);
            }
            this.warnMixedTimezoneColumn(def.property, typeTracker.type, tzTracker);

            columns.push(column);
            allColumnScopes.push(columnScopes);
            columnNeedValueOf.push(needsValueOf);
            // Leave unobserved columns undefined rather than guessing 'number', so type assertions don't false-positive.
            columnValueType.push(typeTracker.type);
            maxDataLength = Math.max(maxDataLength, column.length);
        }

        return {
            columns,
            columnScopes: allColumnScopes,
            columnNeedValueOf,
            columnValueType,
            partialValidDataCount,
            maxDataLength,
        };
    }

    private warnMixedNumericColumn(seriesId: ScopeId, key: K, atIndex: number) {
        Logger.warnOnce(
            `Series "${seriesId}": column "${String(key)}" mixes 'number' and 'bigint' values ` +
                `(first detected at row ${atIndex}); the bigints are narrowed to Number and may lose precision ` +
                `beyond ±2^53. Use one numeric type per column.`
        );
    }

    private warnMixedDateColumn(seriesId: ScopeId, key: K, atIndex: number) {
        Logger.warnOnce(
            `Series "${seriesId}": column "${String(key)}" mixes date/time values with non-date values ` +
                `(first detected at row ${atIndex}). Each column must be uniformly typed; the non-date values ` +
                `cannot be placed on a time axis and may render at invalid positions.`
        );
    }

    private warnMixedTimezoneColumn(key: K, columnType: ColumnValueType | undefined, tracker: TimezoneTracker) {
        const { explicit, implicit } = tracker;
        // Only date-tagged columns interpret ISO strings as instants; mixed offsets in a category column are not ambiguous.
        if (columnType !== 'date' || explicit == null || implicit == null) return;
        Logger.warnOnce(
            `Time axis: column "${String(key)}" contains both timezone-explicit values (e.g. "${explicit.value}", row ${explicit.index}) and timezone-implicit values (e.g. "${implicit.value}", row ${implicit.index}). Ambiguous timezone semantics may produce unexpected positions — points without an explicit offset are interpreted as local time. Use explicit offsets (Z or ±HH:MM) for cross-environment determinism.`
        );
    }

    warnDataMissingProperties(sources: Map<string, DataSet<unknown>>) {
        if (sources.size === 0) return;

        for (const def of iterate(this.ctx.keys, this.ctx.values)) {
            for (const [scope, missCount] of def.missing) {
                if (missCount < (sources.get(scope)?.data.length ?? Infinity)) continue;
                const scopeHint = scope == null ? '' : ` for ${scope}`;
                Logger.warnOnce(`the key '${def.property}' was not found in any data element${scopeHint}.`);
            }
        }
    }
}
