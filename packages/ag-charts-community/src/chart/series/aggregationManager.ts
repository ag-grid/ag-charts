import { EventEmitter } from 'ag-charts-core';

import { DeferredExecutor } from '../../util/deferredExecutor';

export interface AggregationManagerEvents {
    filtersChanged: void;
}

/**
 * Base interface for aggregation filters used by AggregationManager.
 */
export interface AggregationFilterBase {
    maxRange: number;
}

/**
 * Result type for partial aggregation with deferred computation.
 */
export interface PartialAggregationResult<TFilter> {
    immediate: TFilter[];
    computeRemaining?: () => TFilter[];
}

/**
 * Manages aggregation state and deferred computation for series.
 *
 * This class consolidates the common pattern used by Bar, OHLC, and RangeBar series
 * for managing multi-level aggregation with deferred computation of coarser levels.
 *
 * @example
 * ```typescript
 * private readonly aggregationManager = new AggregationManager<MyFilter>();
 *
 * private aggregateData(...) {
 *     return this.aggregationManager.aggregate({
 *         computePartial: () => computePartial(...),
 *         computeFull: () => computeFull(...),
 *         targetRange: this.estimateTargetRange(),
 *     });
 * }
 * ```
 */
export class AggregationManager<TFilter extends AggregationFilterBase> {
    private _filters: TFilter[] | undefined;
    private _dataLength: number = 0;
    private readonly executor = new DeferredExecutor<TFilter[]>();

    /**
     * Emits `filtersChanged` on every filter-set mutation: aggregation
     * rebuilds (immediate + deferred coarser levels), staleness-driven
     * discards (`markStale`), and on-demand level merges
     * (`ensureLevelForRange`). `BucketLookupFeature` subscribes here to
     * keep the per-bucket SELECTED roll-up cache in sync with the active
     * filter list.
     */
    readonly events = new EventEmitter<AggregationManagerEvents>();

    get filters(): TFilter[] | undefined {
        return this._filters;
    }

    /**
     * Perform aggregation with deferred computation of coarser levels.
     * Returns immediate filters suitable for current zoom level.
     *
     * @param options.computePartial - Function to compute partial aggregation (receives existing filters for reuse)
     * @param options.computeFull - Function to compute full aggregation (receives existing filters for reuse)
     * @param options.targetRange - Current pixel range for determining which level to compute immediately
     * @returns The computed filters (immediate level for partial, or all levels for full)
     */
    aggregate(options: {
        computePartial?: (existingFilters: TFilter[] | undefined) => PartialAggregationResult<TFilter> | undefined;
        computeFull: (existingFilters: TFilter[] | undefined) => TFilter[] | undefined;
        targetRange: number;
    }): TFilter[] | undefined {
        this.executor.cancel();

        if (options.targetRange > 1 && options.computePartial) {
            const partialResult = options.computePartial(this._filters);
            if (partialResult) {
                const { immediate, computeRemaining } = partialResult;

                if (computeRemaining) {
                    this.executor.schedule(computeRemaining, (remaining) => {
                        this.mergeFilters(remaining);
                        this.events.emit('filtersChanged', undefined);
                    });
                }

                this._filters = immediate;
                this.events.emit('filtersChanged', undefined);
                return immediate;
            }
        }

        this._filters = options.computeFull(this._filters);
        this.events.emit('filtersChanged', undefined);
        return this._filters;
    }

    /**
     * Ensure we have an aggregation level suitable for the given range.
     * Forces deferred computation if needed.
     */
    ensureLevelForRange(range: number): void {
        const hasLevel = this._filters?.some((f) => f.maxRange > range);

        if (!hasLevel && this.executor.isPending()) {
            // demand() runs the executor's onComplete, which already merged filters and emitted
            // filtersChanged.
            this.executor.demand();
        }
    }

    /**
     * Get the best filter for a given range.
     */
    getFilterForRange(range: number): TFilter | undefined {
        return this._filters?.find((f) => f.maxRange > range);
    }

    /**
     * Cancel any pending deferred computation.
     */
    cancel(): void {
        this.executor.cancel();
    }

    /**
     * Mark filters as stale or discard them based on data size change.
     * When data size changes significantly (>=2x), filters are discarded to prevent
     * incorrect array reuse.
     */
    markStale(dataLength: number): void {
        const ratio = this._dataLength > 0 ? dataLength / this._dataLength : 0;
        const filtersDiscarded = ratio >= 2 || ratio <= 0.5 || this._dataLength === 0;
        if (filtersDiscarded) {
            this._filters = undefined;
        } else if (this._filters) {
            for (const f of this._filters) {
                (f as TFilter & { stale?: boolean }).stale = true;
            }
        }

        this._dataLength = dataLength;
        this.executor.cancel();

        if (filtersDiscarded) {
            // Filters were dropped — notify subscribers so they can release closures over the
            // now-orphaned `indexData` TypedArrays.
            this.events.emit('filtersChanged', undefined);
        }
    }

    private mergeFilters(deferredFilters: TFilter[]): void {
        if (!this._filters || deferredFilters.length === 0) return;

        const allFilters = [...this._filters, ...deferredFilters];
        allFilters.sort((a, b) => a.maxRange - b.maxRange);
        this._filters = allFilters;
    }
}
