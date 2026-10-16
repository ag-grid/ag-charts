import { useCallback, useEffect, useRef } from 'react';

import type {
    AgChartClickEvent,
    AgChartInstance,
    AgSelectionChangeEvent,
    AgSelectionItem,
    AgSelectionItemIds,
} from 'ag-charts-community';

import { mirrorSelection } from './chartSelection';

interface SupplierSelectionOptions<TDatum> {
    /** The workspace's supplier selection, shared with every chart on the tab and the scorecard. */
    selectedSupplierId?: string;
    /** The user selected a supplier on this chart, or cleared the selection. */
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
    /** The supplier a selected item belongs to, if any. */
    supplierIdOf: (item: AgSelectionItem<TDatum>) => string | undefined;
    /** The chart items that stand for one supplier; empty when this chart does not draw it. */
    itemsFor: (supplierId: string) => AgSelectionItemIds[];
}

/**
 * Mirrors a chart's own data selection to and from the workspace's single selected supplier.
 *
 * A supplier may be several items on one chart, so a click is read from what the chart holds
 * afterwards rather than from its added and removed items: a plain click on another item of the
 * selected supplier removes the rest, but leaves the supplier selected.
 */
export function useSupplierSelection<TDatum>({
    selectedSupplierId,
    onSelectedSupplierChange,
    supplierIdOf,
    itemsFor,
}: SupplierSelectionOptions<TDatum>) {
    const chartRef = useRef<AgChartInstance | null>(null);

    const onChartSelectionChange = useCallback(
        ({ source, added }: AgSelectionChangeEvent<TDatum, unknown>) => {
            // Our own setSelection echoes back as an api-call; reacting to it would loop.
            if (source === 'api-call') return;
            const last = added.at(-1);
            if (last != null) {
                onSelectedSupplierChange(supplierIdOf(last));
                return;
            }
            const remaining = chartRef.current?.getSelection()[Symbol.iterator]().next();
            if (remaining?.done) onSelectedSupplierChange(undefined);
        },
        [onSelectedSupplierChange, supplierIdOf]
    );

    // A chart holding none of the selected items reports no selectionChange on a click-away, so clear here.
    const onChartClick = useCallback(
        ({ event }: AgChartClickEvent) => {
            if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) return;
            onSelectedSupplierChange(undefined);
        },
        [onSelectedSupplierChange]
    );

    useEffect(() => {
        const chart = chartRef.current;
        if (chart == null) return;
        return mirrorSelection(chart, selectedSupplierId == null ? [] : itemsFor(selectedSupplierId));
    }, [selectedSupplierId, itemsFor]);

    return { chartRef, onChartSelectionChange, onChartClick };
}
