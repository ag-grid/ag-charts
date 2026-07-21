import { Logger, first } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { ContinuousDomain, DiscreteDomain } from '../../dataDomain';
import type { GroupedData, PropertySelectors, UngroupedData } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';
import { datumKeys } from '../utils/helpers';
import type { DataModelResolvers } from '../utils/resolvers';
import type { ScopeCacheManager } from '../utils/scopeCache';

/**
 * Aggregator handles aggregation of values within groups and post-processing of grouped data.
 *
 * AGGREGATION RESPONSIBILITIES:
 * - Applies aggregate functions to group values
 * - Calculates aggregate domains for visualization
 * - Supports both ungrouped and grouped data aggregation
 * - Handles group-level value processing
 *
 * UNGROUPED vs GROUPED AGGREGATION:
 * - Ungrouped: Each datum gets its own aggregation result
 * - Grouped: Multiple datums in a group share aggregation results
 */
export class Aggregator<D extends object, K extends keyof D & string> {
    private readonly scopeCacheManager: ScopeCacheManager<K>;
    private readonly resolvers: DataModelResolvers<D, K>;

    constructor(
        private readonly ctx: DataModelContext<D, K>,
        scopeCacheManager: ScopeCacheManager<K>,
        resolvers: DataModelResolvers<D, K>
    ) {
        this.scopeCacheManager = scopeCacheManager;
        this.resolvers = resolvers;
    }

    /**
     * Aggregates data for ungrouped datasets.
     * Each datum gets its own aggregation result.
     */
    aggregateUngroupedData(processedData: UngroupedData<any>) {
        const domainAggValues = this.ctx.aggregates.map((): [AgNumericValue, AgNumericValue] => [Infinity, -Infinity]);
        processedData.domain.aggValues = domainAggValues;

        const { columns, dataSources } = processedData;

        const onlyScope = first(dataSources.keys());
        const keys = processedData.keys.map((k) => k.get(onlyScope));
        const rawData = dataSources.get(onlyScope)?.data ?? [];
        // Check if any key definition allows null values
        const allowNull = this.ctx.keys.some((keyDef) => keyDef.allowNullKey === true);
        processedData.aggregation = rawData?.map((_, datumIndex) => {
            const aggregation: [AgNumericValue, AgNumericValue][] = [];

            for (const [index, def] of this.ctx.aggregates.entries()) {
                const indices = this.valueGroupIdxLookup(def);
                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                const valuesToAgg = indices.map((columnIndex) => columns[columnIndex][datumIndex] as D[K]);
                const k = datumKeys(keys, datumIndex, allowNull);
                const valuesAgg = k == null ? undefined : def.aggregateFunction(valuesToAgg, k);
                if (valuesAgg) {
                    groupAggValues =
                        def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                        ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
                }

                const finalValues = def.finalFunction?.(groupAggValues) ?? groupAggValues;

                aggregation[index] = finalValues;
                ContinuousDomain.extendDomain(finalValues, domainAggValues[index]);
            }

            return aggregation;
        });
    }

    /**
     * Aggregates data for grouped datasets.
     * Multiple datums in a group share aggregation results.
     */
    aggregateGroupedData(processedData: GroupedData<any>) {
        const domainAggValues = this.ctx.aggregates.map((): [AgNumericValue, AgNumericValue] => [Infinity, -Infinity]);
        processedData.domain.aggValues = domainAggValues;

        const { columns } = processedData;

        for (const [index, def] of this.ctx.aggregates.entries()) {
            const indices = this.valueGroupIdxLookup(def);

            for (let groupIndex = 0; groupIndex < processedData.groups.length; groupIndex++) {
                const group = processedData.groups[groupIndex];
                group.aggregation ??= [];

                const groupKeys = group.keys;

                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                const maxDatumIndex = Math.max(
                    ...indices.map((columnIndex) => group.datumIndices[columnIndex]?.length ?? 0)
                );
                for (let datumIndex = 0; datumIndex < maxDatumIndex; datumIndex++) {
                    const valuesToAgg = indices.map((columnIndex) => {
                        const relativeDatumIndex = group.datumIndices[columnIndex]?.[datumIndex];
                        if (relativeDatumIndex == null) {
                            return undefined as D[K];
                        }
                        const absoluteDatumIndex = this.resolvers.resolveAbsoluteIndex(groupIndex, relativeDatumIndex);
                        return columns[columnIndex][absoluteDatumIndex] as D[K];
                    });
                    const valuesAgg = def.aggregateFunction(valuesToAgg, groupKeys);
                    if (valuesAgg) {
                        groupAggValues =
                            def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                            ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
                    }
                }

                const finalValues = def.finalFunction?.(groupAggValues) ?? groupAggValues;

                group.aggregation[index] = finalValues;
                ContinuousDomain.extendDomain(finalValues, domainAggValues[index]);
            }
        }
    }

    /**
     * Post-processes groups after grouping is complete.
     * Applies group value processors to adjust group values and recompute domains.
     */
    postProcessGroups(processedData: GroupedData<any>) {
        const { groupProcessors } = this.ctx;

        const { columnScopes, columns, invalidData, columnValueType } = processedData;
        for (const processor of groupProcessors) {
            // Stacking is meaningless for date columns: reject and exclude them from accumulation.
            const valueIndexes = this.valueGroupIdxLookup(processor).filter((valueIndex) => {
                if (columnValueType?.[valueIndex] !== 'date') return true;
                this.rejectDateStackColumn(processedData, valueIndex);
                return false;
            });
            const adjustFn = processor.adjust()();

            for (let groupIndex = 0; groupIndex < processedData.groups.length; groupIndex++) {
                const dataGroup = processedData.groups[groupIndex];
                adjustFn(columns, valueIndexes, dataGroup, groupIndex);
            }

            for (const valueIndex of valueIndexes) {
                const valueDef = this.ctx.values[valueIndex];
                const isDiscrete = valueDef.valueType === 'category';

                const column = columns[valueIndex];
                const columnScope = first(columnScopes[valueIndex]);
                const invalidDatums = invalidData?.get(columnScope);
                const domain = isDiscrete ? new DiscreteDomain() : new ContinuousDomain();
                for (let datumIndex = 0; datumIndex < column.length; datumIndex += 1) {
                    if (invalidDatums?.[datumIndex] === true) continue;
                    domain.extend(column[datumIndex]);
                }

                processedData.domain.values[valueIndex] = domain.getDomain();
            }
        }
    }

    private rejectDateStackColumn(processedData: GroupedData<any>, valueIndex: number) {
        const valueDef = this.ctx.values[valueIndex];
        const columnScope = first(processedData.columnScopes[valueIndex]);
        Logger.default.warnOnce(
            `Series "${String(columnScope)}": column "${String(valueDef.property)}" is date-typed; ` +
                `stacking is not meaningful for date data. The series renders empty; ` +
                `other series in this chart are unaffected.`
        );

        const column = processedData.columns[valueIndex];
        for (let datumIndex = 0; datumIndex < column.length; datumIndex += 1) {
            column[datumIndex] = undefined;
        }
        processedData.domain.values[valueIndex] = [];
    }

    private valueGroupIdxLookup(selector: PropertySelectors) {
        return this.scopeCacheManager.valueGroupIdxLookup(selector);
    }
}
