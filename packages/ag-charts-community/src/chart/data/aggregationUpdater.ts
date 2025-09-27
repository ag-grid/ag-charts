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
        valueGroupIdxLookup: (def: AggregatePropertyDefinition<any, any>) => number[]
    ): void {
        // Early return if no changes or no aggregations
        if (AggregationUpdater.hasNoChanges(changes) || aggregateDefs.length === 0) {
            return;
        }

        // Track which groups are dirty (need recalculation)
        const dirtyGroups = new Set<DataGroup>();

        // Mark all groups as dirty for now (optimized implementation would track specifically affected groups)
        // TODO: In a more optimized implementation, we would only mark groups that:
        // - Had data removed from them
        // - Had data added to them
        // - Had data updated within them
        for (const group of groups) {
            dirtyGroups.add(group);
        }

        // Update aggregations for each dirty group
        for (const group of dirtyGroups) {
            AggregationUpdater.updateGroupAggregations(group, aggregateDefs, columns, valueGroupIdxLookup);
        }
    }

    /**
     * Update aggregations for a single group.
     * @private
     */
    private static updateGroupAggregations(
        group: DataGroup,
        aggregateDefs: AggregatePropertyDefinition<any, any>[],
        columns: any[][],
        valueGroupIdxLookup: (def: AggregatePropertyDefinition<any, any>) => number[]
    ): void {
        group.aggregation ??= [];

        for (const [index, def] of aggregateDefs.entries()) {
            const indices = valueGroupIdxLookup(def);

            if (def.supportsIncremental && def.incrementalUpdater && group.aggregation[index] != null) {
                // Use incremental update if supported and we have existing data
                group.aggregation[index] = AggregationUpdater.updateAggregationIncremental(
                    group,
                    def,
                    indices,
                    columns,
                    group.aggregation[index]
                );
            } else {
                // Fall back to full recalculation
                group.aggregation[index] = AggregationUpdater.calculateAggregationFull(group, def, indices, columns);
            }
        }
    }

    /**
     * Perform incremental update for an aggregation using the incrementalUpdater function.
     * @private
     */
    private static updateAggregationIncremental(
        group: DataGroup,
        def: AggregatePropertyDefinition<any, any>,
        indices: number[],
        columns: any[][],
        _currentAggregation: any
    ): any {
        if (!def.incrementalUpdater) {
            throw new Error('Incremental updater not available');
        }

        // For now, we don't track specific removed/added values within a group,
        // so we fall back to full recalculation
        // TODO: In a more sophisticated implementation, we would track:
        // - Values that were removed from this group
        // - Values that were added to this group
        // - Use these with the incrementalUpdater function

        // For this initial implementation, fall back to full calculation
        return AggregationUpdater.calculateAggregationFull(group, def, indices, columns);
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
