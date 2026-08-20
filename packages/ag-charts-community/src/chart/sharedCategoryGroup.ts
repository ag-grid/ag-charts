import type { DatumIndex } from './series/seriesTypes';

/** The subset of a series needed to group items by category. */
export interface CategoryGroupSeries {
    isEnabled(): boolean;
    getCategoryValue(datumIndex: DatumIndex): unknown;
    datumIndexForCategoryValue(categoryValue: unknown): DatumIndex | undefined;
}

/** The item each series contributes at a given category, keyed by series. */
export type CategoryGroup = ReadonlyMap<CategoryGroupSeries, DatumIndex>;

// `Series.onChangeHighlight` resolves the current and the previous highlight, so a single-entry cache
// would thrash between the two and recompute on every styled datum.
const CACHE_SIZE = 2;

/**
 * Groups the items sharing a datum's category across all series. Used by both `tooltip.mode: 'shared'`
 * and `highlight.mode: 'shared'`, so the two group on identical rules.
 *
 * `datumIndexForCategoryValue` is a linear scan per series, so groups are cached until the next chart
 * update - data and series-visibility changes both invalidate through `invalidate()`.
 */
export class SharedCategoryGroup {
    private readonly cache: { series: CategoryGroupSeries; datumIndex: DatumIndex; group: CategoryGroup }[] = [];

    public invalidate() {
        this.cache.length = 0;
    }

    public get(
        allSeries: readonly CategoryGroupSeries[],
        series: CategoryGroupSeries,
        datumIndex: DatumIndex
    ): CategoryGroup {
        const cached = this.cache.find((entry) => entry.series === series && entry.datumIndex === datumIndex);
        if (cached != null) return cached.group;

        const group = computeCategoryGroup(allSeries, series, datumIndex);
        this.cache.unshift({ series, datumIndex, group });
        this.cache.length = Math.min(this.cache.length, CACHE_SIZE);
        return group;
    }
}

function computeCategoryGroup(
    allSeries: readonly CategoryGroupSeries[],
    series: CategoryGroupSeries,
    datumIndex: DatumIndex
): CategoryGroup {
    const group = new Map<CategoryGroupSeries, DatumIndex>();

    // A series with no category concept - scatter, bubble, pie, maps - has no category value to group on,
    // and `datumIndexForCategoryValue` dereferences the value it is given.
    const categoryValue = series.getCategoryValue(datumIndex);
    if (categoryValue == null) return group;

    group.set(series, datumIndex);
    for (const otherSeries of allSeries) {
        if (otherSeries === series || !otherSeries.isEnabled()) continue;
        const otherDatumIndex = otherSeries.datumIndexForCategoryValue(categoryValue);
        if (otherDatumIndex != null) {
            group.set(otherSeries, otherDatumIndex);
        }
    }
    return group;
}
