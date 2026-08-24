import { useMemo } from 'react';

import type { AgCartesianChartOptions, AgLineSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, THEME } from '../chartTheme';
import { fmtPct } from '../format';
import type { SupplierTrendPoint } from '../types';

/** Which metric the chart is reading off each month's point. */
export type TrendMetric = 'price' | 'onTime' | 'quality';

/** One month's row: the label plus one value per supplier, for the selected metric. */
interface Row {
    label: string;
    [supplierId: string]: string | number | null;
}

interface SupplierTrendChartProps {
    /** Monthly points per supplier id, one series per supplier. */
    trend: Map<string, SupplierTrendPoint[]>;
    supplierNames: Map<string, string>;
    supplierColors: Record<string, string>;
    metric: TrendMetric;
    /** The supplier currently selected, if any — its line is brought forward. */
    selectedSupplierId?: string;
}

/** How each metric is read off a point, titled and formatted. */
interface MetricSpec {
    read: (point: SupplierTrendPoint) => number | null;
    axisTitle: string;
    tooltipLabel: string;
    format: (value: number) => string;
    /** Axis ceiling, for a metric with a fixed one. Omitted where the domain is the data's own. */
    max?: number;
}

function metricSpec(metric: TrendMetric): MetricSpec {
    switch (metric) {
        case 'onTime':
            return {
                read: (point) => point.onTimeRate,
                axisTitle: 'Percent on time',
                tooltipLabel: 'On time',
                format: fmtPct,
                max: 1,
            };
        case 'quality':
            return {
                read: (point) => point.qualityRate,
                axisTitle: 'Percent accepted at inspection',
                tooltipLabel: 'Accepted',
                format: fmtPct,
                max: 1,
            };
        case 'price':
            // A share of catalogue list, not an amount per unit: the roster spans a whole commodity,
            // and a price averaged across tonnes and kilos compares nothing.
            return {
                read: (point) => point.index,
                axisTitle: 'Price vs list price',
                tooltipLabel: 'Price vs list',
                format: (value) => `${value.toFixed(2)}×`,
            };
    }
}

/**
 * One supplier trend, three ways: what she pays, whether it arrives, and whether it passes
 * inspection.
 *
 * The three metrics share a month axis and a scope, so switching between them is a change of
 * question over the same twelve months rather than a jump to another view — which is what lets her
 * carry an observation across: the supplier whose price drifted up is the one to check for on-time
 * and quality before a renewal.
 */
export function SupplierTrendChart({
    trend,
    supplierNames,
    supplierColors,
    metric,
    selectedSupplierId,
}: SupplierTrendChartProps) {
    const spec = useMemo(() => metricSpec(metric), [metric]);

    const data = useMemo<Row[]>(() => {
        const [first] = [...trend.values()];
        if (!first) return [];
        return first.map((point, index) => {
            const row: Row = { label: point.label };
            for (const [supplierId, points] of trend) {
                row[supplierId] = spec.read(points[index]);
            }
            return row;
        });
    }, [trend, spec]);

    const options = useMemo<AgCartesianChartOptions<Row>>(() => {
        const series = [...supplierNames.entries()].map<AgLineSeriesOptions<Row>>(([supplierId, name]) => {
            const dimmed = selectedSupplierId != null && supplierId !== selectedSupplierId;
            const color = supplierColors[supplierId] ?? NEUTRAL;
            return {
                type: 'line',
                xKey: 'label',
                yKey: supplierId,
                yName: name,
                // interpolation: { type: 'step' },
                stroke: dimmed ? NEUTRAL : color,
                strokeWidth: dimmed ? 1 : 2,
                strokeOpacity: dimmed ? 0.35 : 1,
                marker: { enabled: true, size: 5, fill: dimmed ? NEUTRAL : color, fillOpacity: dimmed ? 0.35 : 1 },
                // A month a supplier has no record in is a gap, not a drop to zero.
                connectMissingData: false,
                tooltip: {
                    renderer: ({ datum }) => {
                        const value = datum[supplierId];
                        return {
                            title: `${name} · ${datum.label}`,
                            data: [
                                typeof value === 'number'
                                    ? { label: spec.tooltipLabel, value: spec.format(value) }
                                    : { label: 'Record', value: 'nothing this month' },
                            ],
                        };
                    },
                },
            };
        });

        return {
            theme: THEME,
            data,
            series,
            // This box is shorter than the 300px a chart defaults to as its minimum, and a chart that
            // will not shrink to its box overflows it and swallows clicks meant for the card below.
            minHeight: 0,
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    max: spec.max,
                    title: { enabled: true, text: spec.axisTitle },
                    label: { formatter: ({ value }) => spec.format(value) },
                    nice: false,
                },
            },
            legend: { enabled: true, position: 'bottom' },
            padding: { top: 8, right: 12, bottom: 4, left: 4 },
        };
    }, [data, supplierNames, supplierColors, selectedSupplierId, spec]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
