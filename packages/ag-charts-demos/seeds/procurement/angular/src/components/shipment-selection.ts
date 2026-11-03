import { afterRenderEffect, signal } from '@angular/core';

import type { AgChartInstance, AgSelectionChangeEvent, AgSelectionItemIds } from 'ag-charts-community';

import { mirrorSelection } from './chartSelection';

/** A change to the shipment selection: the React `onSelectionChange(added, removed)` pair, as one output payload. */
export interface ShipmentSelectionChange {
    added: string[];
    removed: string[];
}

interface ShipmentSelectionOptions<TDatum> {
    /** The workspace's shipment selection, shared with the other chart, the worklist and the clear button. */
    selectedShipmentIds: () => string[];
    /** The user changed the selection on this chart: which shipments it added and removed. */
    onSelectionChange: (added: string[], removed: string[]) => void;
    /** The shipment a selected datum belongs to, if any. */
    shipmentIdOf: (datum: TDatum) => string | undefined;
    /** The chart item that stands for one shipment; empty when this chart does not draw it. */
    itemsFor: () => (shipmentId: string) => AgSelectionItemIds[];
}

/**
 * The React `useShipmentSelection` hook: mirrors a chart's own data selection to and from the
 * workspace's shared shipment selection. Call it in a component's injection context (a field
 * initialiser); bind the chart's `(chartReady)` to `chart.set`.
 *
 * A shipment is selected as the one item `itemsFor` returns, so the chart's added and removed items are
 * the shipments the user added and removed. Another selectable mark for it only selects it: the sync
 * replaces that mark with the shipment's item, so a Ctrl/Cmd-click on the mark cannot deselect it.
 */
export function shipmentSelection<TDatum>({
    selectedShipmentIds,
    onSelectionChange,
    shipmentIdOf,
    itemsFor,
}: ShipmentSelectionOptions<TDatum>) {
    const chart = signal<AgChartInstance | undefined>(undefined);

    const onChartSelectionChange = ({ source, added, removed }: AgSelectionChangeEvent<TDatum, unknown>) => {
        // Our own setSelection echoes back as an api-call; reacting to it would loop.
        if (source === 'api-call') return;
        const shipmentIds = (items: typeof added) => items.flatMap(({ datum }) => shipmentIdOf(datum) ?? []);
        onSelectionChange(shipmentIds(added), shipmentIds(removed));
    };

    // After render, as the React effect runs after the chart wrapper has taken the new options.
    afterRenderEffect((onCleanup) => {
        const instance = chart();
        if (instance == null) return;
        onCleanup(mirrorSelection(instance, selectedShipmentIds().flatMap(itemsFor())));
    });

    return { chart, onChartSelectionChange };
}
