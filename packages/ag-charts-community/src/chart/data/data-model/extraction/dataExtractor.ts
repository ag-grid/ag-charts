import {
    ensureEpochColumn,
    first,
    isISO8601,
    isNumberObject,
    iterate,
    seedEpochColumnIdentity,
    seedNumericColumnIdentity,
    timeValueToNumber,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { ContinuousDomain, type IDataDomain } from '../../dataDomain';
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
    lastValue: AgNumericValue | undefined;
    sortOrder: 1 | -1 | 0; // 0 = undetermined, 1 = ascending, -1 = descending
    isUnique: boolean;
    isOrdered: boolean;
}

function createKeyTracker(): KeyExtractionTracker {
    return { lastValue: undefined, sortOrder: 0, isUnique: true, isOrdered: true };
}

function updateKeyTracker(tracker: KeyExtractionTracker, value: unknown): void {
    // Resolve to a comparable value: bigint stays exact, ISO 8601 strings parse to epoch ms, Date narrows
    // via valueOf(). Without this, bigint/ISO keys are skipped and the series is wrongly flagged unordered.
    let current: AgNumericValue | undefined;
    if (typeof value === 'number') {
        current = Number.isFinite(value) ? value : undefined;
    } else if (typeof value === 'bigint') {
        current = value;
    } else if (isISO8601(value)) {
        const epoch = timeValueToNumber(value);
        current = Number.isFinite(epoch) ? epoch : undefined;
    } else {
        const viaValueOf = (value as Date)?.valueOf?.();
        current = typeof viaValueOf === 'number' && Number.isFinite(viaValueOf) ? viaValueOf : undefined;
    }
    if (current === undefined) return;

    const { lastValue } = tracker;
    if (lastValue === undefined) {
        tracker.lastValue = current;
        return;
    }

    // A column is uniformly typed here, so `===` is exact; the relational `>` for direction stays type-safe
    // (and never throws as `bigint - number` subtraction would) if a malformed mixed column slips through.
    if (current === lastValue) {
        tracker.isUnique = false;
    } else if (tracker.isOrdered) {
        const direction = current > lastValue ? 1 : -1;
        if (tracker.sortOrder === 0) {
            tracker.sortOrder = direction;
        } else if (tracker.sortOrder !== direction) {
            tracker.isOrdered = false;
        }
    }
    tracker.lastValue = current;
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
    /** Whether any column value was a string. A string-free column needs no epoch-ms parse, so its
     *  epoch cache can be seeded as identity to spare downstream consumers a redundant string scan. */
    sawString: boolean;
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

// Only number/bigint/boolean map 1:1 from typeof to column type; string and object are ambiguous and must reclassify.
function settledPrimitiveUnchanged(settled: ColumnValueType | undefined, value: unknown): boolean {
    return (settled === 'number' || settled === 'bigint' || settled === 'boolean') && typeof value === settled;
}

function updateColumnTypeTracker(
    tracker: ColumnTypeTracker,
    value: unknown,
    datumIndex: number
): ColumnValueType | undefined {
    const settled = tracker.type;
    if (settledPrimitiveUnchanged(settled, value)) {
        return settled;
    }

    const observed = valueColumnType(value);
    if (observed == null) return undefined;

    // A string is tagged 'string' (non-ISO) or 'date' (ISO); Date objects are also 'date', so only the
    // date case needs a typeof to disambiguate. Gating on `observed` keeps the numeric path scan-free.
    if (observed === 'string' || (observed === 'date' && typeof value === 'string')) {
        tracker.sawString = true;
    }

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
        // Mixed number/bigint narrows bigints to Number (lossy beyond ±(2^53 - 1)); warned once at series level.
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

/** True when at least one ISO 8601 string was observed in a date-typed column. */
function sawIsoStrings(tracker: TimezoneTracker): boolean {
    return tracker.explicit != null || tracker.implicit != null;
}

/**
 * Extend a continuous domain from the epoch-ms representation of an ISO-string column.
 * Rows the streaming pass rejected hold `def.invalidValue`, which must be non-numeric
 * (typically `undefined`) so that `extend` ignores it here.
 */
function extendDomainFromEpochColumn(domain: IDataDomain | undefined, column: unknown[]): void {
    // Discrete domains coerce ISO strings per value themselves (the domain keeps Date identity).
    if (!ContinuousDomain.is(domain)) return;
    const epochs = ensureEpochColumn(column);
    for (let i = 0; i < epochs.length; i++) {
        domain.extend(epochs[i]);
    }
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
            keyHasIsoStrings,
        } = this.extractKeys(keyDefs, sources, getProcessValue);

        const {
            columns,
            columnScopes,
            columnNeedValueOf,
            columnValueType,
            columnHasIsoStrings,
            partialValidDataCount,
            maxDataLength,
        } = this.extractValues(
            invalidData,
            invalidDataCount,
            missingData,
            valueDefs,
            sources,
            invalidKeys,
            getProcessValue
        );

        // Continuous domains skip ISO 8601 strings during streaming extension; extend them now from
        // the parse-once epoch columns.
        for (const [valueDefIndex, def] of valueDefs.entries()) {
            if (columnHasIsoStrings[valueDefIndex]) {
                extendDomainFromEpochColumn(dataDomain.get(def), columns[valueDefIndex]);
            }
        }
        for (const [keyDefIndex, def] of keyDefs.entries()) {
            if (!keyHasIsoStrings[keyDefIndex]) continue;
            const domain = dataDomain.get(def);
            for (const keys of new Set(allKeyMappings.get(def)?.values())) {
                extendDomainFromEpochColumn(domain, keys);
            }
        }

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
        const keyHasIsoStrings: boolean[] = [];

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
                sawString: false,
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
                        if (
                            !settledPrimitiveUnchanged(typeTracker.type, result.value) &&
                            updateColumnTypeTracker(typeTracker, result.value, datumIndex) === 'date'
                        ) {
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
            this.warnMixedTimezoneColumn(keyDef.property, typeTracker.type, tzTracker, keyDef.timeDomain === true);
            keyHasIsoStrings.push(typeTracker.type === 'date' && sawIsoStrings(tzTracker));
            // A string-free key column needs no epoch-ms parse: seed each scope's array as its own
            // identity so downstream consumers skip the redundant string scan (see extractValues).
            if (!typeTracker.sawString) {
                for (const keys of keyDefKeys.values()) {
                    seedEpochColumnIdentity(keys);
                }
            }
        }
        return {
            invalidData,
            invalidKeys,
            invalidKeyCount,
            invalidDataCount,
            missingData,
            allKeyMappings: allKeys,
            keySortOrders,
            keyHasIsoStrings,
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
        const columnHasIsoStrings: boolean[] = [];
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
                sawString: false,
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
                } else if (
                    !settledPrimitiveUnchanged(typeTracker.type, result.value) &&
                    updateColumnTypeTracker(typeTracker, result.value, datumIndex) === 'date'
                ) {
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
            this.warnMixedTimezoneColumn(def.property, typeTracker.type, tzTracker, def.timeDomain === true);

            columns.push(column);
            allColumnScopes.push(columnScopes);
            columnNeedValueOf.push(needsValueOf);
            // Leave unobserved columns undefined rather than guessing 'number', so type assertions don't false-positive.
            columnValueType.push(typeTracker.type);
            columnHasIsoStrings.push(typeTracker.type === 'date' && sawIsoStrings(tzTracker));
            // A string-free column is its own epoch representation: seed the cache so the domain and
            // aggregation paths skip the per-call string scan (ISO-string columns are seeded lazily
            // when extendDomainFromEpochColumn parses them below).
            if (!typeTracker.sawString) {
                seedEpochColumnIdentity(column);
            }
            // A pure (non-bigint) numeric column is its own narrowed representation: seed the
            // bigint-narrowing caches so the aggregation path skips its per-call bigint scan.
            if (typeTracker.type === 'number') {
                seedNumericColumnIdentity(column);
            }
            maxDataLength = Math.max(maxDataLength, column.length);
        }

        return {
            columns,
            columnScopes: allColumnScopes,
            columnNeedValueOf,
            columnValueType,
            columnHasIsoStrings,
            partialValidDataCount,
            maxDataLength,
        };
    }

    private warnMixedNumericColumn(seriesId: ScopeId, key: K, atIndex: number) {
        this.ctx.logger.warnOnce(
            `Series "${seriesId}": column "${String(key)}" mixes 'number' and 'bigint' values ` +
                `(first detected at row ${atIndex}); the bigints are narrowed to Number and may lose precision ` +
                `beyond ±(2^53 - 1) (Number.MAX_SAFE_INTEGER). Use one numeric type per column.`
        );
    }

    private warnMixedDateColumn(seriesId: ScopeId, key: K, atIndex: number) {
        this.ctx.logger.warnOnce(
            `Series "${seriesId}": column "${String(key)}" mixes date/time values with non-date values ` +
                `(first detected at row ${atIndex}). Each column must be uniformly typed; the non-date values ` +
                `cannot be placed on a time axis and may render at invalid positions.`
        );
    }

    private warnMixedTimezoneColumn(
        key: K,
        columnType: ColumnValueType | undefined,
        tracker: TimezoneTracker,
        isTimeDomain: boolean
    ) {
        const { explicit, implicit } = tracker;
        // Only a time-domain column interprets ISO strings as instants; on a category axis the same strings are
        // opaque labels, so mixed offsets are not ambiguous and must not warn (value-sniffing alone tags them 'date').
        if (!isTimeDomain || columnType !== 'date' || explicit == null || implicit == null) return;
        this.ctx.logger.warnOnce(
            `Time axis: column "${String(key)}" contains both timezone-explicit values (e.g. "${explicit.value}", row ${explicit.index}) and timezone-implicit values (e.g. "${implicit.value}", row ${implicit.index}). Ambiguous timezone semantics may produce unexpected positions — points without an explicit offset are interpreted as local time. Use explicit offsets (Z or ±HH:MM) for cross-environment determinism.`
        );
    }

    warnDataMissingProperties(sources: Map<string, DataSet<unknown>>) {
        if (sources.size === 0) return;

        for (const def of iterate(this.ctx.keys, this.ctx.values)) {
            for (const [scope, missCount] of def.missing) {
                if (missCount < (sources.get(scope)?.data.length ?? Infinity)) continue;
                const scopeHint = scope == null ? '' : ` for ${scope}`;
                const message = `the key '${def.property}' was not found in any data element${scopeHint}.`;
                this.ctx.logger.warnOnce(message);
                this.ctx.validationSink?.recordIssue({ severity: 'warning', message });
            }
        }
    }
}
