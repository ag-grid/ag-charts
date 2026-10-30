import type {
    AgChartClickEvent,
    AgChartInstance,
    AgSelectionChangeEvent,
    AgSelectionItem,
    AgSelectionItemIds,
} from 'ag-charts-community';

import { mirrorSelection } from './chartSelection';

interface SupplierSelectionOptions<TDatum> {
    /** The chart the selection is mirrored into (the React `chartRef`). */
    chart: () => AgChartInstance | undefined;
    /** The user selected a supplier on this chart, or cleared the selection. */
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
    /** The supplier a selected item belongs to, if any. */
    supplierIdOf: (item: AgSelectionItem<TDatum>) => string | undefined;
}

export interface SupplierSelection<TDatum> {
    /** The chart's `selectionChange` listener. */
    onChartSelectionChange: (event: AgSelectionChangeEvent<TDatum, unknown>) => void;
    /** The chart's `click` listener. */
    onChartClick: (event: AgChartClickEvent) => void;
    /**
     * The hook's effect: brings the chart's selection into line with the workspace's. Runs again only
     * when `selectedSupplierId` or `itemsFor` changes, as the effect's dependency array has it.
     *
     * @param selectedSupplierId The workspace's supplier selection, shared with every chart on the tab and the scorecard.
     * @param itemsFor The chart items that stand for one supplier; empty when this chart does not draw it.
     */
    sync(selectedSupplierId: string | undefined, itemsFor: (supplierId: string) => AgSelectionItemIds[]): void;
    /** The effect's cleanup on unmount. */
    destroy(): void;
}

/**
 * The `useSupplierSelection` hook: mirrors a chart's own data selection to and from the workspace's
 * single selected supplier.
 *
 * A supplier may be several items on one chart, so a click is read from what the chart holds
 * afterwards rather than from its added and removed items: a plain click on another item of the
 * selected supplier removes the rest, but leaves the supplier selected.
 */
export function createSupplierSelection<TDatum>({
    chart,
    onSelectedSupplierChange,
    supplierIdOf,
}: SupplierSelectionOptions<TDatum>): SupplierSelection<TDatum> {
    let deps: [string | undefined, (supplierId: string) => AgSelectionItemIds[]] | undefined;
    let cancel: (() => void) | undefined;

    return {
        onChartSelectionChange({ source, added }) {
            // Our own setSelection echoes back as an api-call; reacting to it would loop.
            if (source === 'api-call') return;
            const last = added.at(-1);
            if (last != null) {
                onSelectedSupplierChange(supplierIdOf(last));
                return;
            }
            const remaining = chart()?.getSelection()[Symbol.iterator]().next();
            if (remaining?.done) onSelectedSupplierChange(undefined);
        },
        // A chart holding none of the selected items reports no selectionChange on a click-away, so clear here.
        onChartClick({ event }) {
            if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) return;
            onSelectedSupplierChange(undefined);
        },
        sync(selectedSupplierId, itemsFor) {
            if (deps != null && deps[0] === selectedSupplierId && deps[1] === itemsFor) return;
            deps = [selectedSupplierId, itemsFor];
            cancel?.();
            cancel = undefined;
            const instance = chart();
            if (instance == null) return;
            cancel = mirrorSelection(instance, selectedSupplierId == null ? [] : itemsFor(selectedSupplierId));
        },
        destroy() {
            cancel?.();
            cancel = undefined;
        },
    };
}
