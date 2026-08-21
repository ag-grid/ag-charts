import { useMemo } from 'react';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgScatterSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, THEME } from '../chartTheme';
import { fmtCurrency, fmtCurrencyCompact, fmtInt, fmtPct } from '../format';
import type { QualityCost } from '../types';

/** A row with the rate expressed the way the chart reads it: what failed, not what passed. */
interface Row extends QualityCost {
    rejectedRate: number;
}

interface QualityCostChartProps {
    rows: QualityCost[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** Selecting the same supplier again clears it. */
    onSelect: (supplierId: string) => void;
}

/** The axis the reject rate is plotted against, kept off the money scale it shares a chart with. */
const RATE_AXIS = 'rate';

/**
 * What each supplier's rejected material cost, against the rate it was rejected at.
 *
 * Two scales because the two readings are different questions. The bill is what competes with a price
 * variance for her attention, and the rate is what a supplier can actually be held to — a big bill on
 * a low rate is a volume problem, the same bill on a high rate is a process one. Sorted by the bill,
 * so a marker sitting high above a short bar is the supplier whose quality is worst but cheapest.
 */
export function QualityCostChart({ rows, supplierColors, selectedSupplierId, onSelect }: QualityCostChartProps) {
    const data = useMemo<Row[]>(
        () =>
            [...rows]
                .sort((a, b) => b.rejectedValue - a.rejectedValue)
                .map((row) => ({ ...row, rejectedRate: 1 - row.acceptedRate })),
        [rows]
    );

    const options = useMemo<AgCartesianChartOptions<Row>>(() => {
        const dimmed = (supplierId: string) => selectedSupplierId != null && supplierId !== selectedSupplierId;

        const cost: AgBarSeriesOptions<Row> = {
            type: 'bar',
            xKey: 'supplier',
            yKey: 'rejectedValue',
            yName: 'Cost of rejected material',
            cornerRadius: 3,
            widthRatio: 0.65,
            // Every bar takes its supplier's identity colour from the styler below, so the series
            // fill only ever shows in the legend — where a single supplier's colour would read as
            // if the item stood for that supplier rather than for the measure.
            fill: NEUTRAL,
            itemStyler: ({ datum }) =>
                dimmed(datum.supplierId)
                    ? { fill: NEUTRAL, fillOpacity: 0.3 }
                    : { fill: supplierColors[datum.supplierId] ?? NEUTRAL },
            tooltip: {
                renderer: ({ datum }) => ({
                    title: datum.supplier,
                    data: [
                        { label: 'Rejected material', value: fmtCurrency(datum.rejectedValue) },
                        { label: 'Rejected', value: fmtPct(datum.rejectedRate) },
                        { label: 'Deliveries', value: fmtInt(datum.deliveredCount) },
                    ],
                }),
            },
            listeners: { seriesNodeClick: ({ datum }) => onSelect(datum.supplierId) },
        };

        // A mark per supplier, not a series through them: the axis has no order, so a stroke between
        // the rates would draw a trend that does not exist.
        const rate: AgScatterSeriesOptions<Row> = {
            type: 'scatter',
            xKey: 'supplier',
            yKey: 'rejectedRate',
            yName: 'Percent rejected',
            yKeyAxis: RATE_AXIS,
            shape: 'diamond',
            size: 12,
            fill: 'var(--pc-text)',
            strokeWidth: 1,
            stroke: 'var(--pc-bg)',
            tooltip: {
                renderer: ({ datum }) => ({
                    title: datum.supplier,
                    data: [{ label: 'Rejected', value: fmtPct(datum.rejectedRate) }],
                }),
            },
        };

        return {
            theme: THEME,
            data,
            series: [cost, rate],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    title: { enabled: true, text: 'Cost of rejected material' },
                    label: { formatter: ({ value }) => fmtCurrencyCompact(value) },
                },
                [RATE_AXIS]: {
                    type: 'number',
                    position: 'right',
                    min: 0,
                    title: { enabled: true, text: 'Percent rejected' },
                    label: { formatter: ({ value }) => fmtPct(value) },
                    // One grid is enough: a second set of lines at different intervals reads as noise.
                    gridLine: { enabled: false },
                },
            },
            legend: { enabled: true },
            // The box can fall below the 300px a chart defaults to as its minimum, and a chart that
            // will not shrink to its box overflows it and swallows clicks meant for the card below.
            minWidth: 0,
            minHeight: 0,
            padding: { top: 8, right: 8, bottom: 4, left: 4 },
        };
    }, [data, supplierColors, selectedSupplierId, onSelect]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
