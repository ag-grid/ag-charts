import type { DataChangeDescriptor } from './dataChangeDescriptor';
import { ContinuousDomain } from './dataDomain';
import type { AggregatePropertyDefinition, DataGroup } from './dataModel';

/**
 * Utility class for updating aggregations when data changes occur in groups.
 * Provides efficient incremental updates for supported aggregation types,
 * falling back to full recalculation for complex aggregations.
 */
export class AggregationUpdater {
    /**
     * Updates aggregations for affected groups when data changes occur.
     * Mutates group aggregations in-place for performance.
     *
     * @param groups - Array of DataGroup objects to update aggregations for
     * @param changes - Descriptor of data changes (removals, insertions, updates)
     * @param aggregateDefs - Array of aggregate property definitions
     * @param columns - Data columns from ProcessedData for value extraction
     * @param valueGroupIdxLookup - Function to get column indices for aggregate definition
     *
     * Operations performed:
     * 1. Identify groups that need aggregation updates (dirty groups)
     * 2. For each dirty group and each aggregation:
     *    - Use incremental updater if supported and available
     *    - Fall back to full recalculation for complex aggregations
     * 3. Update domain.aggValues for the aggregations
     */
    static updateAggregations(
        groups: DataGroup[],
        changes: DataChangeDescriptor,
        aggregateDefs: AggregatePropertyDefinition<any, any>[],
        columns: any[][],
        valueGroupIdxLookup: (def: AggregatePropertyDefinition<any, any>) => number[],
        keyExtractor: (datum: any, index: number) => any[] | undefined,
        aggregateDomains?: [number, number][]
    ): void {
        if (aggregateDefs.length === 0 || AggregationUpdater.hasNoChanges(changes)) {
            return;
        }

        const dirtyGroups = AggregationUpdater.collectDirtyGroups(groups, changes, keyExtractor);
        if (dirtyGroups.size === 0) {
            return;
        }

        for (const [aggIndex, def] of aggregateDefs.entries()) {
            const columnIndexes = valueGroupIdxLookup(def);
            for (const group of dirtyGroups) {
                group.aggregation ??= [];
                group.aggregation[aggIndex] = AggregationUpdater.calculateAggregationFull(
                    group,
                    def,
                    columnIndexes,
                    columns
                );
            }
        }

        if (aggregateDomains) {
            AggregationUpdater.rebuildAggregateDomains(groups, aggregateDefs, aggregateDomains);
        }
    }

    private static collectDirtyGroups(
        groups: DataGroup[],
        changes: DataChangeDescriptor,
        keyExtractor: (datum: any, index: number) => any[] | undefined
    ): Set<DataGroup> {
        const dirtyGroups = new Set<DataGroup>();
        const groupLookup = new Map<string, DataGroup>();

        for (const group of groups) {
            groupLookup.set(AggregationUpdater.keyId(group.keys), group);
        }

        const markGroup = (datum: any, index: number) => {
            const keys = keyExtractor(datum, index) ?? [];
            const group = groupLookup.get(AggregationUpdater.keyId(keys));
            if (group) {
                dirtyGroups.add(group);
            }
        };

        for (const removal of changes.removed) {
            markGroup(removal.datum, removal.index);
        }

        for (const update of changes.updated) {
            markGroup(update.oldDatum, update.index);
            markGroup(update.newDatum, update.index);
        }

        for (const insertion of changes.inserted) {
            markGroup(insertion.datum, insertion.index);
        }

        return dirtyGroups;
    }

    /**
     * Perform full recalculation for an aggregation.
     * This replicates the logic from DataModel.aggregateGroupedData for a single group/aggregation.
     * @private
     */
    private static calculateAggregationFull(
        group: DataGroup,
        def: AggregatePropertyDefinition<any, any>,
        indices: number[],
        columns: any[][]
    ): any {
        const groupKeys = group.keys;

        let groupAggValues = def.groupAggregateFunction?.() ?? [Infinity, -Infinity];
        const maxDatumIndex = Math.max(...indices.map((columnIndex) => group.datumIndices[columnIndex]?.length ?? 0));

        for (let datumIndex = 0; datumIndex < maxDatumIndex; datumIndex++) {
            const valuesToAgg = indices.map(
                (columnIndex) => columns[columnIndex][group.datumIndices[columnIndex]?.[datumIndex]]
            );
            const valuesAgg = def.aggregateFunction(valuesToAgg, groupKeys);
            if (valuesAgg) {
                groupAggValues =
                    def.groupAggregateFunction?.(valuesAgg, groupAggValues) ??
                    ContinuousDomain.extendDomain(valuesAgg, groupAggValues);
            }
        }

        const finalValues = def.finalFunction?.(groupAggValues) ?? groupAggValues;
        return finalValues;
    }

    private static rebuildAggregateDomains(
        groups: DataGroup[],
        aggregateDefs: AggregatePropertyDefinition<any, any>[],
        aggregateDomains: [number, number][]
    ): void {
        for (const [index] of aggregateDefs.entries()) {
            const domain = (aggregateDomains[index] = [Infinity, -Infinity]);

            for (const group of groups) {
                const value = group.aggregation?.[index];
                if (value == null) {
                    continue;
                }

                ContinuousDomain.extendDomain(value, domain);
            }
        }
    }

    private static keyId(keys: any[]): string {
        return keys
            .map((key) => {
                if (key != null && typeof key === 'object') {
                    try {
                        return JSON.stringify(key);
                    } catch {
                        return String(key);
                    }
                }
                return String(key);
            })
            .join('|');
    }

    /**
     * Check if the change descriptor has any actual changes.
     * @private
     */
    private static hasNoChanges(changes: DataChangeDescriptor): boolean {
        return changes.removed.length === 0 && changes.inserted.length === 0 && changes.updated.length === 0;
    }

    /**
     * Create incremental updater functions for common aggregation types.
     * These can be used to extend existing aggregate definitions with incremental support.
     */
    static createIncrementalUpdaters() {
        return {
            /**
             * Incremental updater for sum aggregations.
             * Subtracts removed values and adds new values to current sum.
             */
            sum: (current: [number, number], removed: number[], added: number[]): [number, number] => {
                const result: [number, number] = [...current];

                // Subtract removed values
                for (const value of removed) {
                    if (typeof value === 'number') {
                        if (value < 0) {
                            result[0] -= value;
                        } else if (value > 0) {
                            result[1] -= value;
                        }
                    }
                }

                // Add new values
                for (const value of added) {
                    if (typeof value === 'number') {
                        if (value < 0) {
                            result[0] += value;
                        } else if (value > 0) {
                            result[1] += value;
                        }
                    }
                }

                return result;
            },

            /**
             * Incremental updater for count aggregations.
             * Adjusts count based on removed and added items.
             */
            count: (current: [number, number], removed: any[], added: any[]): [number, number] => {
                const result: [number, number] = [...current];
                const netChange = added.length - removed.length;

                // Count aggregations typically use [0, count] format
                result[1] += netChange;
                return result;
            },

            /**
             * Incremental updater for average aggregations that track sum and count.
             * Note: This requires the aggregation to store intermediate state [sum, count, ...]
             */
            average: (
                current: [number, number, number],
                removed: number[],
                added: number[]
            ): [number, number, number] => {
                let [negativeSum, positiveSum, count] = current;

                // Process removed values
                for (const value of removed) {
                    if (typeof value === 'number') {
                        if (value < 0) {
                            negativeSum -= value;
                        } else if (value > 0) {
                            positiveSum -= value;
                        }
                        count--;
                    }
                }

                // Process added values
                for (const value of added) {
                    if (typeof value === 'number') {
                        if (value < 0) {
                            negativeSum += value;
                        } else if (value > 0) {
                            positiveSum += value;
                        }
                        count++;
                    }
                }

                return [negativeSum, positiveSum, count];
            },
        };
    }

    /**
     * Enhance existing aggregate definitions with incremental update support.
     * This is a utility function to add incremental capabilities to standard aggregations.
     */
    static enhanceWithIncrementalSupport<D, K extends keyof D & string>(
        aggregateDef: AggregatePropertyDefinition<D, K>,
        aggregationType: 'sum' | 'count' | 'average'
    ): AggregatePropertyDefinition<D, K> {
        const updaters = AggregationUpdater.createIncrementalUpdaters();

        return {
            ...aggregateDef,
            supportsIncremental: true,
            incrementalUpdater: updaters[aggregationType] as any,
        };
    }
}
