import { useMemo } from 'react';

import type { AgMapLineSeriesOptions, AgMapMarkerSeriesOptions, AgTopologyChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, STATUS_COLORS, STATUS_SHAPES, THEME } from '../chartTheme';
import { PLANTS } from '../data';
import { fmtCurrency, fmtDate, fmtDaysToGo, fmtPct, fmtSlack } from '../format';
import { ROUTE_TOPOLOGY, WORLD_TOPOLOGY } from '../routes';
import type { ShipmentStatus, TrackedShipment } from '../types';

interface DeliveryMapProps {
    shipments: TrackedShipment[];
    /** The shipment currently selected, if any. */
    selectedShipmentId?: string;
    /** A marker was clicked. Clicking the selected shipment again clears it. */
    onShipmentClick: (shipmentId: string) => void;
}

/**
 * Everything plotted on the map — moving shipments, their routes, and the fixed plants —
 * shares one datum shape.
 *
 * That is not incidental tidiness: a series' `idKey`/`latitudeKey` must name a key that
 * exists on the chart's datum type, so series with different datum shapes cannot share a
 * chart. `shipment` is what distinguishes the two kinds, and is absent on a plant.
 */
interface MapPoint {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    shipment?: TrackedShipment;
}

// Worst-last, so a late marker draws over an on-time one where routes converge on a plant.
const STATUS_DRAW_ORDER: ShipmentStatus[] = ['On time', 'At risk', 'Late'];

const PLANT_POINTS: MapPoint[] = PLANTS.map((plant) => ({
    id: plant.plantId,
    label: plant.name,
    latitude: plant.destination.latitude,
    longitude: plant.destination.longitude,
}));

export function DeliveryMap({ shipments, selectedShipmentId, onShipmentClick }: DeliveryMapProps) {
    const points = useMemo<MapPoint[]>(
        () =>
            shipments.map((shipment) => ({
                id: shipment.shipmentId,
                label: shipment.shipmentId,
                latitude: shipment.position.latitude,
                longitude: shipment.position.longitude,
                shipment,
            })),
        [shipments]
    );

    const options = useMemo<AgTopologyChartOptions<MapPoint>>(() => {
        const dimmed = (id: string) => selectedShipmentId != null && id !== selectedShipmentId;

        // One route series per status, so a lane's line and marker agree on colour without a per-datum styler.
        const routeSeries = STATUS_DRAW_ORDER.map<AgMapLineSeriesOptions<MapPoint>>((status) => ({
            type: 'map-line',
            topology: ROUTE_TOPOLOGY,
            topologyIdKey: 'id',
            idKey: 'id',
            data: points.filter((point) => point.shipment?.status === status),
            stroke: STATUS_COLORS[status],
            // Light weight: at a heavier one, overlapping lanes blend into a wash that reads as neither status colour.
            strokeWidth: 1,
            strokeOpacity: 0.28,
            // The status key is rendered as HTML beside the card, so nothing needs a legend.
            showInLegend: false,
            itemStyler: ({ datum }) => (dimmed(datum.id) ? { strokeOpacity: 0.08 } : {}),
            // The marker carries the tooltip; a hit on the line as well would fight it.
            tooltip: { enabled: false },
            highlight: { enabled: false },
        }));

        // One series per status, so status never rests on colour alone.
        const markerSeries = STATUS_DRAW_ORDER.map<AgMapMarkerSeriesOptions<MapPoint>>((status) => ({
            type: 'map-marker',
            // Positional, so deliberately no `idKey`: with one the series would warn it cannot match the topology.
            latitudeKey: 'latitude',
            longitudeKey: 'longitude',
            data: points.filter((point) => point.shipment?.status === status),
            showInLegend: false,
            shape: STATUS_SHAPES[status],
            size: 11,
            fill: STATUS_COLORS[status],
            stroke: 'var(--pc-panel)',
            strokeWidth: 1.5,
            itemStyler: ({ datum }) =>
                dimmed(datum.id) ? { fillOpacity: 0.25, strokeOpacity: 0.25 } : { fillOpacity: 1, strokeOpacity: 1 },
            tooltip: {
                renderer: ({ datum }) => {
                    const shipment = datum.shipment;
                    if (!shipment) return undefined;
                    return {
                        title: `${shipment.shipmentId} · ${shipment.status}`,
                        data: [
                            { label: 'Lane', value: `${shipment.supplierName} → ${shipment.plantName}` },
                            {
                                label: shipment.lineCount > 1 ? `Cargo (${shipment.lineCount} lines)` : 'Cargo',
                                value: shipment.material,
                            },
                            { label: 'Route complete', value: fmtPct(shipment.progress) },
                            { label: 'Value', value: fmtCurrency(shipment.value) },
                            { label: 'Projected arrival', value: fmtDate(shipment.projectedDate) },
                            {
                                label: 'Required',
                                value: `${fmtDate(shipment.requiredDate)} · ${fmtDaysToGo(shipment.daysToRequired)}`,
                            },
                            { label: 'Against required', value: fmtSlack(shipment.slackDays) },
                            ...(shipment.carrierDelay ? [{ label: 'Carrier', value: 'Delay logged' }] : []),
                        ],
                    };
                },
            },
            listeners: {
                seriesNodeClick: ({ datum }) => onShipmentClick(datum.id),
            },
        }));

        const plants: AgMapMarkerSeriesOptions<MapPoint> = {
            type: 'map-marker',
            latitudeKey: 'latitude',
            longitudeKey: 'longitude',
            labelKey: 'label',
            data: PLANT_POINTS,
            showInLegend: false,
            shape: 'square',
            size: 9,
            fill: 'var(--pc-text)',
            stroke: 'var(--pc-panel)',
            strokeWidth: 1.5,
            // Plants sit where every lane converges, so an ordered fallback list is tried until a placement fits.
            label: {
                fontSize: 11,
                color: 'var(--pc-muted)',
                placement: ['bottom', 'top', 'right', 'left'],
                spacing: 6,
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    title: datum.label,
                    data: [{ label: 'Site', value: 'Receiving plant' }],
                }),
            },
            highlight: { enabled: false },
        };

        return {
            theme: THEME,
            topology: WORLD_TOPOLOGY,
            series: [
                { type: 'map-shape-background', fill: 'var(--pc-panel-2)', stroke: NEUTRAL, strokeWidth: 0.5 },
                ...routeSeries,
                plants,
                ...markerSeries,
            ],
            // The status legend is rendered as HTML alongside the board, carrying the same glyphs as the tiles.
            legend: { enabled: false },
            padding: 0,
        };
    }, [points, selectedShipmentId, onShipmentClick]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
