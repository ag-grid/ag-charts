import type { DataModel } from '../data/dataModel';

/**
 * Minimal `DataModel` stub for driving the `aggregate*DataFromDataModel` entry points directly.
 * Key lookups resolve to `keys`; value lookups resolve via `columns` by column id; the domain
 * reports ascending sort order. The aggregation behaviours under test (high-volume downsampling,
 * ULP collapse) are not deterministically observable through rendered pixels, so these tests
 * drive the real aggregation entry points against stubbed column data instead.
 *
 * This is the single place to update if the `DataModel` resolver surface changes shape.
 */
export function stubAggregationDataModel(
    keys: unknown[],
    columns: Record<string, unknown[]>,
    domain: unknown[]
): DataModel<any, any, any> {
    return {
        hasColumnById: (_scope: unknown, id: string) => id in columns,
        resolveKeysById: () => keys,
        resolveColumnById: (_scope: unknown, id: string) => {
            const column = columns[id];
            if (column == null) throw new Error(`stubAggregationDataModel: no column stubbed for id "${id}"`);
            return column;
        },
        getDomain: () => ({ domain, sortMetadata: { sortOrder: 1 as const } }),
        resolveColumnNeedsValueOf: () => false,
    } as unknown as DataModel<any, any, any>;
}
