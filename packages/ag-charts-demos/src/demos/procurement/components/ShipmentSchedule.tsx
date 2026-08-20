import { useMemo } from 'react';

import type { AgCartesianChartOptions, AgRangeBarSeriesOptions, AgScatterSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, STATUS_COLORS, THEME } from '../chartTheme';
import { DEMO_NOW } from '../data';
import { fmtCurrencyCompact, fmtDate, fmtSlack } from '../format';
import type { TrackedShipment } from '../types';

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
}

/**
 * Fixed bar thickness. This is what makes the chart scrollable: a fixed width means the rows
 * need whatever height they need, and the scrollbar pans the overflow rather than the axis
 * squeezing every bar to a hairline.
 */
const BAR_WIDTH = 16;

interface ShipmentScheduleProps {
    shipments: TrackedShipment[];
    /** The shipment currently selected, if any. */
    selectedShipmentId?: string;
    /** Selecting the same shipment again clears it. */
    onSelect: (shipmentId: string) => void;
}

/**
 * Every shipment's transit window against the date production needs it.
 *
 * The at-risk rule *is* the gap between the projected arrival and the required date, so this
 * draws the decision criterion as a length rather than restating it as "3d buffer" text. A bar
 * whose end passes its required marker is late, and by how much is directly readable — which the
 * status board's tiles can only tell her one shipment at a time.
 */
export function ShipmentSchedule({ shipments, selectedShipmentId, onSelect }: ShipmentScheduleProps) {
    // Soonest required first, so what is most urgent is at the top of the axis.
    const legs = useMemo<Leg[]>(
        () =>
            [...shipments]
                .sort((a, b) => a.requiredDate - b.requiredDate)
                .map((shipment) => ({
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

    const options = useMemo<AgCartesianChartOptions<Leg>>(() => {
        const dimmed = (shipmentId: string) => selectedShipmentId != null && shipmentId !== selectedShipmentId;

        const transit: AgRangeBarSeriesOptions<Leg> = {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'shipmentId',
            yLowKey: 'depart',
            yHighKey: 'projected',
            yName: 'In transit',
            width: BAR_WIDTH,
            cornerRadius: 3,
            strokeWidth: 0,
            itemStyler: ({ datum }) =>
                dimmed(datum.shipmentId)
                    ? { fill: NEUTRAL, fillOpacity: 0.3 }
                    : { fill: STATUS_COLORS[datum.status], fillOpacity: 0.9 },
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
            listeners: {
                seriesNodeClick: ({ datum }) => onSelect(datum.shipmentId),
            },
        };

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
            tooltip: { enabled: false },
            highlight: { enabled: false },
            listeners: {
                seriesNodeClick: ({ datum }) => onSelect(datum.shipmentId),
            },
        };

        return {
            theme: THEME,
            data: legs,
            series: [transit, required],
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
                                position: 'top',
                                color: 'var(--pc-text)',
                                fontSize: 11,
                            },
                        },
                    ],
                },
            },
            legend: { enabled: false },
            // The rows overflow a short card, so panning is by scrollbar rather than by the
            // card growing to fit however many shipments are in transit.
            scrollbar: { enabled: true, vertical: { position: 'right' } },
            padding: { top: 8, right: 16, bottom: 4, left: 4 },
        };
    }, [legs, selectedShipmentId, onSelect]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
