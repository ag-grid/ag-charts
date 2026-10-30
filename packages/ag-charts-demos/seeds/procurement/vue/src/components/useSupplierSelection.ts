import { shallowRef, watch } from 'vue';

import type {
    AgChartClickEvent,
    AgSelectionChangeEvent,
    AgSelectionItem,
    AgSelectionItemIds,
} from 'ag-charts-community';
import type { AgCharts } from 'ag-charts-vue3';

import { mirrorSelection } from './chartSelection';

interface SupplierSelectionOptions<TDatum> {
    /** The workspace's supplier selection, shared with every chart on the tab and the scorecard. */
    selectedSupplierId: () => string | undefined;
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
    // The `AgCharts` component; its `chart` is the instance React's ref holds.
    const chartRef = shallowRef<InstanceType<typeof AgCharts> | null>(null);

    const onChartSelectionChange = ({ source, added }: AgSelectionChangeEvent<TDatum, unknown>) => {
        // Our own setSelection echoes back as an api-call; reacting to it would loop.
        if (source === 'api-call') return;
        const last = added.at(-1);
        if (last != null) {
            onSelectedSupplierChange(supplierIdOf(last));
            return;
        }
        const remaining = chartRef.value?.chart?.getSelection()[Symbol.iterator]().next();
        if (remaining?.done) onSelectedSupplierChange(undefined);
    };

    // A chart holding none of the selected items reports no selectionChange on a click-away, so clear here.
    const onChartClick = ({ event }: AgChartClickEvent) => {
        if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) return;
        onSelectedSupplierChange(undefined);
    };

    // `itemsFor` is read inside the source, so the items it reads (the chart's rows) are dependencies too.
    watch(
        [
            chartRef,
            () => {
                const supplierId = selectedSupplierId();
                return supplierId == null ? [] : itemsFor(supplierId);
            },
        ],
        ([component, wanted], _, onCleanup) => {
            const chart = component?.chart;
            if (chart == null) return;
            onCleanup(mirrorSelection(chart, wanted));
        },
        // After the chart has mounted, as React's effect runs after commit.
        { flush: 'post' }
    );

    return { chartRef, onChartSelectionChange, onChartClick };
}
