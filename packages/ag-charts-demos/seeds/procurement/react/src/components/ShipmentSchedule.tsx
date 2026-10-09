import { useCallback, useMemo } from 'react';

import type {
    AgCartesianChartOptions,
    AgRangeBarSeriesOptions,
    AgScatterSeriesOptions,
    AgSelectionItemIds,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, STATUS_COLORS, THEME } from '../chartTheme';
import { DEMO_NOW } from '../data';
import { fmtCurrencyCompact, fmtDate, fmtSlack } from '../format';
import type { ShipmentStatus, TrackedShipment } from '../types';
import { useShipmentSelection } from './useShipmentSelection';

/** One row of the schedule: a shipment's transit window plus the date it is needed. */
interface Leg {
    shipmentId: string;
    supplier: string;
    material: string;
    plant: string;
    depart: number;
    projected: number;
    required: number;
    status: TrackedShipment['status'];
    slackDays: number;
    value: number;
    /** The transit window again, under its status's keys only, so each status series draws just its own bars. */
    onTimeDepart?: number;
    onTimeProjected?: number;
    atRiskDepart?: number;
    atRiskProjected?: number;
    lateDepart?: number;
    lateProjected?: number;
}

const STATUSES: ShipmentStatus[] = ['On time', 'At risk', 'Late'];

const STATUS_KEYS: Record<ShipmentStatus, { low: keyof Leg; high: keyof Leg }> = {
    'On time': { low: 'onTimeDepart', high: 'onTimeProjected' },
    'At risk': { low: 'atRiskDepart', high: 'atRiskProjected' },
    Late: { low: 'lateDepart', high: 'lateProjected' },
};

/**
 * Fixed bar thickness. This is what makes the chart scrollable: a fixed width means the rows
 * need whatever height they need, and the scrollbar pans the overflow rather than the axis
 * squeezing every bar to a hairline.
 */
const BAR_WIDTH = 14;

interface ShipmentScheduleProps {
    shipments: TrackedShipment[];
    /** The shipments currently selected; empty when none is. */
    selectedShipmentIds: string[];
    /** The user changed the selection on the schedule. */
    onSelectionChange: (added: string[], removed: string[]) => void;
}

const transitSeriesId = (status: ShipmentStatus) => `transit-${status}`;

const shipmentIdOf = (leg: Leg) => leg.shipmentId;

/**
 * Every shipment's transit window against the date production needs it.
 *
 * The at-risk rule *is* the gap between the projected arrival and the required date, so this
 * draws the decision criterion as a length rather than restating it as "3d buffer" text. A bar
 * whose end passes its required marker is late, and by how much is directly readable — which the
 * status board's tiles can only tell her one shipment at a time.
 */
export function ShipmentSchedule({ shipments, selectedShipmentIds, onSelectionChange }: ShipmentScheduleProps) {
    // Soonest required first, so what is most urgent is at the top of the axis.
    const legs = useMemo<Leg[]>(
        () =>
            [...shipments]
                .sort((a, b) => a.requiredDate - b.requiredDate)
                .map((shipment) => ({
                    [STATUS_KEYS[shipment.status].low]: shipment.departDate,
                    [STATUS_KEYS[shipment.status].high]: shipment.projectedDate,
                    shipmentId: shipment.shipmentId,
                    supplier: shipment.supplierName,
                    material: shipment.material,
                    plant: shipment.plantName,
                    depart: shipment.departDate,
                    projected: shipment.projectedDate,
                    required: shipment.requiredDate,
                    status: shipment.status,
                    slackDays: shipment.slackDays,
                    value: shipment.value,
                })),
        [shipments]
    );

    const itemsFor = useCallback(
        (shipmentId: string): AgSelectionItemIds[] => {
            const leg = legs.find((l) => l.shipmentId === shipmentId);
            return leg == null ? [] : [{ seriesId: transitSeriesId(leg.status), itemId: shipmentId }];
        },
        [legs]
    );

    const { chartRef, onChartSelectionChange } = useShipmentSelection({
        selectedShipmentIds,
        onSelectionChange,
        shipmentIdOf,
        itemsFor,
    });

    const options = useMemo<AgCartesianChartOptions<Leg>>(() => {
        // From the shared selection, not the styler's `selectionState`: a selection set through the
        // API does not re-run a cached styler, and this chart's selection mostly arrives that way.
        const dimmed = (shipmentId: string) =>
            selectedShipmentIds.length > 0 && !selectedShipmentIds.includes(shipmentId);

        // One series per status, so the legend keys each status colour; ungrouped, so each row keeps
        // a single full-width slot rather than three side by side with two left empty.
        const transit = STATUSES.map<AgRangeBarSeriesOptions<Leg>>((status) => ({
            type: 'range-bar',
            id: transitSeriesId(status),
            direction: 'horizontal',
            xKey: 'shipmentId',
            yLowKey: STATUS_KEYS[status].low,
            yHighKey: STATUS_KEYS[status].high,
            yName: status,
            grouped: false,
            width: BAR_WIDTH,
            cornerRadius: 3,
            fill: STATUS_COLORS[status],
            fillOpacity: 0.9,
            strokeWidth: 0,
            itemStyler: ({ datum }) => (dimmed(datum.shipmentId) ? { fill: NEUTRAL, fillOpacity: 0.3 } : {}),
            // The styler draws both states; the theme's outline and fade on top would compound it.
            selection: {
                selectedItem: { strokeWidth: 0 },
                unselectedItem: { opacity: 1 },
                unselectedSeries: { opacity: 1 },
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    title: `${datum.shipmentId} · ${datum.status}`,
                    data: [
                        { label: 'Lane', value: `${datum.supplier} → ${datum.plant}` },
                        { label: 'Cargo', value: datum.material },
                        { label: 'Despatched', value: fmtDate(datum.depart) },
                        { label: 'Projected arrival', value: fmtDate(datum.projected) },
                        { label: 'Required by', value: fmtDate(datum.required) },
                        { label: 'Against required', value: fmtSlack(datum.slackDays) },
                        { label: 'Value', value: fmtCurrencyCompact(datum.value) },
                    ],
                }),
            },
        }));

        // The date production needs it, as a separate mark so it reads against the bar's end
        // rather than as part of it.
        const required: AgScatterSeriesOptions<Leg> = {
            type: 'scatter',
            xKey: 'required',
            yKey: 'shipmentId',
            yName: 'Required by',
            shape: 'diamond',
            size: 11,
            fill: 'var(--pc-text)',
            stroke: 'var(--pc-text)',
            strokeWidth: 2,
            itemStyler: ({ datum }) => (dimmed(datum.shipmentId) ? { fillOpacity: 0.3, strokeOpacity: 0.3 } : {}),
            tooltip: { enabled: false },
            highlight: { enabled: false },
            // Not selectable, so each shipment is a single selection item: its bar.
            selection: { enabled: false },
        };

        return {
            theme: THEME,
            data: legs,
            // Addresses selection items by shipment, so a selection survives the rows re-sorting.
            dataIdKey: 'shipmentId',
            series: [...transit, required],
            // Horizontal bars: shipments down the left, time along the bottom.
            axes: {
                y: { type: 'category', position: 'left', label: { fontSize: 11 } },
                x: {
                    type: 'time',
                    position: 'bottom',
                    crossLines: [
                        {
                            type: 'line',
                            value: DEMO_NOW,
                            stroke: 'var(--pc-text)',
                            strokeWidth: 1.5,
                            label: {
                                enabled: true,
                                text: 'Today',
                                placement: 'top',
                                color: 'var(--pc-text)',
                                fontSize: 11,
                            },
                        },
                    ],
                },
            },
            legend: { enabled: true, position: 'bottom' },
            // The rows overflow a short card, so panning is by scrollbar rather than by the
            // card growing to fit however many shipments are in transit.
            scrollbar: { enabled: true, vertical: { position: 'right' } },
            padding: { top: 8, right: 16, bottom: 4, left: 4 },
            // Ctrl/Cmd-click adds or removes a shipment; a click off the bars clears.
            selection: { enabled: true },
            listeners: { selectionChange: onChartSelectionChange },
        };
    }, [legs, selectedShipmentIds, onChartSelectionChange]);

    return <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
