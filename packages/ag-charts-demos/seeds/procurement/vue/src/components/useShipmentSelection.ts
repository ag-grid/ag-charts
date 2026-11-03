import { shallowRef, watch } from 'vue';

import type { AgSelectionChangeEvent, AgSelectionItemIds } from 'ag-charts-community';
import type { AgCharts } from 'ag-charts-vue3';

import { mirrorSelection } from './chartSelection';

interface ShipmentSelectionOptions<TDatum> {
    /** The workspace's shipment selection, shared with the other chart, the worklist and the clear button. */
    selectedShipmentIds: () => string[];
    /** The user changed the selection on this chart: which shipments it added and removed. */
    onSelectionChange: (added: string[], removed: string[]) => void;
    /** The shipment a selected datum belongs to, if any. */
    shipmentIdOf: (datum: TDatum) => string | undefined;
    /** The chart item that stands for one shipment; empty when this chart does not draw it. */
    itemsFor: (shipmentId: string) => AgSelectionItemIds[];
}

/**
 * Mirrors a chart's own data selection to and from the workspace's shared shipment selection.
 *
 * A shipment is selected as the one item `itemsFor` returns, so the chart's added and removed items are
 * the shipments the user added and removed. Another selectable mark for it only selects it: the sync
 * replaces that mark with the shipment's item, so a Ctrl/Cmd-click on the mark cannot deselect it.
 */
export function useShipmentSelection<TDatum>({
    selectedShipmentIds,
    onSelectionChange,
    shipmentIdOf,
    itemsFor,
}: ShipmentSelectionOptions<TDatum>) {
    // The `AgCharts` component; its `chart` is the instance React's ref holds.
    const chartRef = shallowRef<InstanceType<typeof AgCharts> | null>(null);

    const onChartSelectionChange = ({ source, added, removed }: AgSelectionChangeEvent<TDatum, unknown>) => {
        // Our own setSelection echoes back as an api-call; reacting to it would loop.
        if (source === 'api-call') return;
        const shipmentIds = (items: typeof added) => items.flatMap(({ datum }) => shipmentIdOf(datum) ?? []);
        onSelectionChange(shipmentIds(added), shipmentIds(removed));
    };

    // `itemsFor` is read inside the source, so the items it reads (the chart's rows) are dependencies too.
    watch(
        [chartRef, () => selectedShipmentIds().flatMap(itemsFor)],
        ([component, wanted], _, onCleanup) => {
            const chart = component?.chart;
            if (chart == null) return;
            onCleanup(mirrorSelection(chart, wanted));
        },
        // After the chart has mounted, as React's effect runs after commit.
        { flush: 'post' }
    );

    return { chartRef, onChartSelectionChange };
}
