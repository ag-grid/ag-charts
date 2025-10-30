import type {
    GroupedData,
    ProcessedData,
    ProcessedDataDef,
    PropertyDefinition,
    ScopeProvider,
    SortOrderEntry,
    UngroupedData,
} from '../../dataModelTypes';
import { COLUMN_SORT_ORDERS, DOMAIN_RANGES, KEY_SORT_ORDERS } from '../../dataModelTypes';
import { RangeLookup } from '../../rangeLookup';
import { type SortOrder, valuesSortOrder } from '../../sortOrder';
import type { DataModelContext } from '../dataModelContext';

/**
 * DataModelResolvers handles lookups and resolution of processed data.
 *
 * RESOLVER RESPONSIBILITIES:
 * - Resolves property definitions by ID within a scope
 * - Looks up keys, columns, and values from processed data
 * - Manages domain and sort order resolution
 * - Provides range lookups for data access
 *
 * SCOPE-AWARE RESOLUTION:
 * - All lookups are scoped to specific data sources
 * - Uses internal scope cache for fast property definition lookup
 * - Throws clear errors when definitions are not found
 */
export class DataModelResolvers<D extends object, K extends keyof D & string> {
    constructor(private readonly ctx: DataModelContext<D, K>) {}

    resolveMissingDataCount(scope: ScopeProvider): number {
        let missingDataCount = 0;
        for (const value of this.ctx.values) {
            missingDataCount = Math.max(missingDataCount, value.missing.get(scope.id) ?? 0);
        }
        return missingDataCount;
    }

    resolveProcessedDataDefById(scope: ScopeProvider, searchId: string): ProcessedDataDef | never {
        const def = this.ctx.scopeCache.get(scope.id)?.get(searchId);

        if (!def) {
            throw new Error(`AG Charts - didn't find property definition for [${searchId}, ${scope.id}]`);
        }

        return { index: def.index, def };
    }

    resolveProcessedDataIndexById(scope: ScopeProvider, searchId: string): number {
        return this.resolveProcessedDataDefById(scope, searchId).index;
    }

    resolveKeysById<T = string>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): T[] {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        const keys = processedData.keys[index];
        if (keys == null) {
            throw new Error(`AG Charts - didn't find keys for [${searchId}, ${scope.id}]`);
        }
        return keys.get(scope.id) as T[];
    }

    hasColumnById(scope: ScopeProvider, searchId: string) {
        return this.ctx.scopeCache.get(scope.id)?.get(searchId) != null;
    }

    resolveColumnById<T = any>(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): T[] {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        const column = processedData.columns?.[index];
        if (column == null) {
            throw new Error(`AG Charts - didn't find column for [${searchId}, ${scope.id}]`);
        }
        return column;
    }

    resolveColumnNeedsValueOf(
        scope: ScopeProvider,
        searchId: string,
        processedData: UngroupedData<any> | GroupedData<any>
    ): boolean {
        const index = this.resolveProcessedDataIndexById(scope, searchId);
        return processedData.columnNeedValueOf?.[index] ?? true;
    }

    /**
     * Converts a relative datum index to an absolute column index.
     *
     * INDEXING STRATEGY:
     * - Relative index: Offset from the start of a group (stored in datumIndices)
     * - Absolute index: Position in the full column array
     * - Conversion: absoluteIndex = groupIndex + relativeIndex
     *
     * When groupsUnique=true, relativeIndex is always 0, making this a simple
     * identity mapping. This optimization reduces memory usage significantly
     * for large datasets with unique keys.
     *
     * @param groupIndex index of the group in ProcessedData.groups
     * @param relativeDatumIndex relative index stored in group.datumIndices
     * @returns absolute index for accessing columns
     */
    resolveAbsoluteIndex(groupIndex: number, relativeDatumIndex: number): number {
        return groupIndex + relativeDatumIndex;
    }

    getDomain(
        scope: ScopeProvider,
        searchId: string,
        type: PropertyDefinition<any>['type'],
        processedData: ProcessedData<K>
    ): any[] | [number, number] | [] {
        const domains = this.getDomainsByType(type ?? 'value', processedData);
        return domains?.[this.resolveProcessedDataIndexById(scope, searchId)] ?? [];
    }

    getDomainBetweenRange(
        scope: ScopeProvider,
        searchIds: string[],
        [i0, i1]: [number, number],
        processedData: ProcessedData<K>
    ): [number, number] {
        const columnIndices = searchIds.map((searchId) => this.resolveProcessedDataIndexById(scope, searchId));
        const cacheKey = columnIndices.join(':');
        const domainRanges = processedData[DOMAIN_RANGES];
        let rangeLookup = domainRanges.get(cacheKey);
        if (rangeLookup == null) {
            const values = columnIndices.map((columnIndex) => processedData.columns[columnIndex]);
            rangeLookup = new RangeLookup(values);
            domainRanges.set(cacheKey, rangeLookup);
        }
        return rangeLookup.rangeBetween(i0, i1);
    }

    private getSortOrder(
        values: any[],
        index: number,
        sortOrders: Map<number, SortOrderEntry>,
        needsValueOf: boolean
    ): SortOrder {
        let sortOrder = sortOrders.get(index);
        if (sortOrder == null) {
            sortOrder = { sortOrder: valuesSortOrder(values, needsValueOf) };
            sortOrders.set(index, sortOrder);
        }
        return sortOrder.sortOrder;
    }

    getKeySortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<K>): SortOrder {
        const columnIndex = this.resolveProcessedDataIndexById(scope, searchId);
        const keys = processedData.keys[columnIndex]?.get(scope.id);
        // Key columns typically contain dates/objects, so default to true for needsValueOf
        return keys ? this.getSortOrder(keys, columnIndex, processedData[KEY_SORT_ORDERS], true) : undefined;
    }

    getColumnSortOrder(scope: ScopeProvider, searchId: string, processedData: ProcessedData<K>): SortOrder {
        const columnIndex = this.resolveProcessedDataIndexById(scope, searchId);
        // Use columnNeedValueOf metadata to determine if valueOf() is needed
        const needsValueOf = processedData.columnNeedValueOf?.[columnIndex] ?? true;
        return this.getSortOrder(
            processedData.columns[columnIndex],
            columnIndex,
            processedData[COLUMN_SORT_ORDERS],
            needsValueOf
        );
    }

    private getDomainsByType(type: PropertyDefinition<any>['type'], processedData: ProcessedData<K>) {
        switch (type) {
            case 'key':
                return processedData.domain.keys;
            case 'value':
                return processedData.domain.values;
            case 'aggregate':
                return processedData.domain.aggValues;
            case 'group-value-processor':
                return processedData.domain.groups;
            default:
                return null;
        }
    }
}
