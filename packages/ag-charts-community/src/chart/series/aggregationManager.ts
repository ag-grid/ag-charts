import { DeferredExecutor } from '../../util/deferredExecutor';

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
    private readonly executor = new DeferredExecutor<TFilter[]>();

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
                    });
                }

                this._filters = immediate;
                return immediate;
            }
        }

        this._filters = options.computeFull(this._filters);
        return this._filters;
    }

    /**
     * Ensure we have an aggregation level suitable for the given range.
     * Forces deferred computation if needed.
     */
    ensureLevelForRange(range: number): void {
        const hasLevel = this._filters?.some((f) => f.maxRange > range);

        if (!hasLevel && this.executor.isPending()) {
            const remaining = this.executor.demand();
            if (remaining) {
                this.mergeFilters(remaining);
            }
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
     * Mark all filters as stale (for invalidation on data refresh).
     */
    markStale(): void {
        if (this._filters) {
            for (const f of this._filters) {
                (f as TFilter & { stale?: boolean }).stale = true;
            }
        }
        this.executor.cancel();
    }

    private mergeFilters(deferredFilters: TFilter[]): void {
        if (!this._filters || deferredFilters.length === 0) return;

        const allFilters = [...this._filters, ...deferredFilters];
        allFilters.sort((a, b) => a.maxRange - b.maxRange);
        this._filters = allFilters;
    }
}
