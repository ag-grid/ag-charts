import { useCallback, useEffect, useRef } from 'react';

import type { AgChartInstance, AgSelectionChangeEvent, AgSelectionItemIds } from 'ag-charts-community';

interface ShipmentSelectionOptions<TDatum> {
    /** The workspace's shipment selection, shared with the other chart, the worklist and the clear button. */
    selectedShipmentIds: string[];
    /** The user changed the selection on this chart: which shipments it added and removed. */
    onSelectionChange: (added: string[], removed: string[]) => void;
    /** The shipment a selected datum belongs to, if any. */
    shipmentIdOf: (datum: TDatum) => string | undefined;
    /** The chart item that stands for one shipment; empty when this chart does not draw it. */
    itemsFor: (shipmentId: string) => AgSelectionItemIds[];
}

const itemKey = ({ seriesId, itemId }: AgSelectionItemIds) => `${seriesId}\u0000${String(itemId)}`;

/**
 * Mirrors a chart's own data selection to and from the workspace's shared shipment selection.
 *
 * Each shipment must be exactly one selectable item, so the chart's added and removed items are the
 * shipments the user added and removed. A second selectable mark per shipment breaks that: a plain
 * click on one is reported as removing the other.
 */
export function useShipmentSelection<TDatum>({
    selectedShipmentIds,
    onSelectionChange,
    shipmentIdOf,
    itemsFor,
}: ShipmentSelectionOptions<TDatum>) {
    const chartRef = useRef<AgChartInstance | null>(null);

    const onChartSelectionChange = useCallback(
        ({ source, added, removed }: AgSelectionChangeEvent<TDatum, unknown>) => {
            // Our own setSelection echoes back as an api-call; reacting to it would loop.
            if (source === 'api-call') return;
            const shipmentIds = (items: typeof added) => items.flatMap(({ datum }) => shipmentIdOf(datum) ?? []);
            onSelectionChange(shipmentIds(added), shipmentIds(removed));
        },
        [onSelectionChange, shipmentIdOf]
    );

    useEffect(() => {
        const chart = chartRef.current;
        if (chart == null) return;
        let cancelled = false;
        // A chart remounted by a tab switch has no series to select into until its first update lands.
        void chart.waitForUpdate().then(() => {
            if (cancelled) return;
            const wanted = selectedShipmentIds.flatMap(itemsFor);
            const current = new Set(Array.from(chart.getSelection(), itemKey));
            if (wanted.length === current.size && wanted.every((item) => current.has(itemKey(item)))) return;
            if (wanted.length === 0) {
                chart.clearSelection();
            } else {
                chart.setSelection(wanted);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [selectedShipmentIds, itemsFor]);

    return { chartRef, onChartSelectionChange };
}
