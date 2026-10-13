import { first } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { ContinuousDomain, DiscreteDomain } from '../../dataDomain';
import type { DataGroup, GroupedData, PropertySelectors, UngroupedData } from '../../dataModelTypes';
import type { DataModelContext } from '../dataModelContext';
import { datumKeys } from '../utils/helpers';
import type { DataModelResolvers } from '../utils/resolvers';
import type { ScopeCacheManager } from '../utils/scopeCache';

function maxDatumCount(datumIndices: DataGroup['datumIndices'], indices: number[]) {
    let max = 0;
    for (let i = 0; i < indices.length; i++) {
        const length = datumIndices[indices[i]]?.length ?? 0;
        if (length > max) max = length;
    }
    return max;
}

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
        // Per-aggregate scratch, written afresh for every datum: only `groupAggValues` and `aggregation` are retained.
        const scratch = this.ctx.aggregates.map((def) => {
            const indices = this.valueGroupIdxLookup(def);
            return {
                indices,
                valuesToAgg: new Array<D[K]>(indices.length),
                out: [0, 0] as [AgNumericValue, AgNumericValue],
            };
        });
        processedData.aggregation = rawData?.map((_, datumIndex) => {
            const aggregation: [AgNumericValue, AgNumericValue][] = [];
            // Independent of the aggregate definition, so built once per datum rather than once per aggregate.
            const k = datumKeys(keys, datumIndex, allowNull);

            for (const [index, def] of this.ctx.aggregates.entries()) {
                const { indices, valuesToAgg, out } = scratch[index];
                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                for (let i = 0; i < indices.length; i++) {
                    valuesToAgg[i] = columns[indices[i]][datumIndex] as D[K];
                }
                const valuesAgg = k == null ? undefined : def.aggregateFunction(valuesToAgg, k, out);
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
            // Scratch shared by every datum of every group: aggregate functions fill `out` in place, and only
            // `groupAggValues` (distinct per group) is stored on the group and domain.
            const valuesToAgg = new Array<D[K]>(indices.length);
            const out: [AgNumericValue, AgNumericValue] = [0, 0];

            for (let groupIndex = 0; groupIndex < processedData.groups.length; groupIndex++) {
                const group = processedData.groups[groupIndex];
                group.aggregation ??= [];

                const groupKeys = group.keys;
                const { datumIndices } = group;

                let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
                const maxDatumIndex = maxDatumCount(datumIndices, indices);
                for (let datumIndex = 0; datumIndex < maxDatumIndex; datumIndex++) {
                    this.fillGroupDatumValues(valuesToAgg, columns, group, groupIndex, datumIndex, indices);
                    const valuesAgg = def.aggregateFunction(valuesToAgg, groupKeys, out);
                    if (valuesAgg != null) {
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

    private fillGroupDatumValues(
        valuesToAgg: D[K][],
        columns: D[K][][],
        group: DataGroup,
        groupIndex: number,
        datumIndex: number,
        indices: number[]
    ) {
        const { datumIndices } = group;
        for (let i = 0; i < indices.length; i++) {
            const columnIndex = indices[i];
            const relativeDatumIndex = datumIndices[columnIndex]?.[datumIndex];
            if (relativeDatumIndex == null) {
                valuesToAgg[i] = undefined as D[K];
                continue;
            }
            const absoluteDatumIndex = this.resolvers.resolveAbsoluteIndex(groupIndex, relativeDatumIndex);
            valuesToAgg[i] = columns[columnIndex][absoluteDatumIndex];
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
        this.ctx.logger.warnOnce(
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
