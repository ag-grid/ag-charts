import type { AgChartInstance, AgSelectionChangeEvent, AgSelectionItemIds } from 'ag-charts-community';

import { mirrorSelection } from './chartSelection';

interface ShipmentSelectionOptions<TDatum> {
    /** The chart the selection is mirrored into (the React `chartRef`). */
    chart: () => AgChartInstance | undefined;
    /** The user changed the selection on this chart: which shipments it added and removed. */
    onSelectionChange: (added: string[], removed: string[]) => void;
    /** The shipment a selected datum belongs to, if any. */
    shipmentIdOf: (datum: TDatum) => string | undefined;
}

export interface ShipmentSelection<TDatum> {
    /** The chart's `selectionChange` listener. */
    onChartSelectionChange: (event: AgSelectionChangeEvent<TDatum, unknown>) => void;
    /**
     * The hook's effect: brings the chart's selection into line with the workspace's. Runs again only
     * when `selectedShipmentIds` or `itemsFor` changes identity, as the effect's dependency array has it.
     *
     * @param selectedShipmentIds The workspace's shipment selection, shared with the other chart, the worklist and the clear button.
     * @param itemsFor The chart item that stands for one shipment; empty when this chart does not draw it.
     */
    sync(selectedShipmentIds: string[], itemsFor: (shipmentId: string) => AgSelectionItemIds[]): void;
    /** The effect's cleanup on unmount. */
    destroy(): void;
}

/**
 * The `useShipmentSelection` hook: mirrors a chart's own data selection to and from the workspace's
 * shared shipment selection.
 *
 * A shipment is selected as the one item `itemsFor` returns, so the chart's added and removed items are
 * the shipments the user added and removed. Another selectable mark for it only selects it: the sync
 * replaces that mark with the shipment's item, so a Ctrl/Cmd-click on the mark cannot deselect it.
 */
export function createShipmentSelection<TDatum>({
    chart,
    onSelectionChange,
    shipmentIdOf,
}: ShipmentSelectionOptions<TDatum>): ShipmentSelection<TDatum> {
    let deps: [string[], (shipmentId: string) => AgSelectionItemIds[]] | undefined;
    let cancel: (() => void) | undefined;

    return {
        onChartSelectionChange({ source, added, removed }) {
            // Our own setSelection echoes back as an api-call; reacting to it would loop.
            if (source === 'api-call') return;
            const shipmentIds = (items: typeof added) => items.flatMap(({ datum }) => shipmentIdOf(datum) ?? []);
            onSelectionChange(shipmentIds(added), shipmentIds(removed));
        },
        sync(selectedShipmentIds, itemsFor) {
            if (deps?.[0] === selectedShipmentIds && deps[1] === itemsFor) return;
            deps = [selectedShipmentIds, itemsFor];
            cancel?.();
            cancel = undefined;
            const instance = chart();
            if (instance == null) return;
            cancel = mirrorSelection(instance, selectedShipmentIds.flatMap(itemsFor));
        },
        destroy() {
            cancel?.();
            cancel = undefined;
        },
    };
}
