import { useMemo } from 'react';

import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, SEGMENT_SEPARATOR, THEME } from '../chartTheme';
import { fmtCurrency, fmtPct } from '../format';
import type { SupplierShareRow } from '../types';

export type SupplierShareView = 'heatmap' | 'bar';

interface SupplierShareChartProps {
    rows: SupplierShareRow[];
    supplierNames: Map<string, string>;
    supplierColors: Record<string, string>;
    view: SupplierShareView;
}

/** One cell of the matrix: a supplier's spend within a subcategory, and its share of that subcategory. */
interface ShareCell {
    subcategory: string;
    supplier: string;
    spend: number;
    /** Unset where the supplier took no spend, so the cell takes the missing-data fill rather than the ramp's floor. */
    share?: number;
}

/**
 * Sequential ramp for share of subcategory spend, light to dark.
 *
 * Built on the neutral family the sunburst's subcategory ring uses rather than a categorical slot:
 * a categorical colour means supplier identity everywhere in the workspace, and here colour encodes
 * a quantity. The floor is kept clearly darker than `EMPTY_FILL`, so a 2% share never reads as none.
 */
const SHARE_RAMP = ['#ddd0c3', '#372411'];

/** Cells where the supplier took no spend — the panel's alternate tone, so they read as gaps in the grid. */
const EMPTY_FILL = 'var(--pc-panel-2)';

/** Share above which a cell is dark enough to need light label ink. */
const DARK_CELL_SHARE = 0.5;

/**
 * Supplier share of each subcategory, as a supplier × subcategory matrix.
 *
 * The single-sourcing view: a subcategory column with one dark cell and the rest empty has no second
 * source, and that is a supply risk regardless of how well the incumbent is performing. Reading
 * across a row shows the other side of the same risk — a supplier carrying several subcategories at
 * once. The colour scale is fixed at 0–100%, so the darkest cell always means sole supplier rather
 * than merely the largest share in the period.
 */
function heatmapOptions(
    rows: SupplierShareRow[],
    supplierNames: Map<string, string>
): AgCartesianChartOptions<ShareCell> {
    const names = [...supplierNames.values()];
    const cells = rows.flatMap<ShareCell>((row) => {
        const total = names.reduce((sum, name) => sum + Number(row[name] ?? 0), 0);
        return names.map((supplier) => {
            const spend = Number(row[supplier] ?? 0);
            return {
                subcategory: row.subcategory,
                supplier,
                spend,
                share: spend > 0 && total > 0 ? spend / total : undefined,
            };
        });
    });

    return {
        theme: THEME,
        data: cells,
        series: [
            {
                type: 'heatmap',
                yKey: 'subcategory',
                yName: 'Subcategory',
                xKey: 'supplier',
                xName: 'Supplier',
                colorKey: 'share',
                colorName: 'Share of subcategory',
                colorScale: {
                    fills: [
                        { color: SHARE_RAMP[0], stop: 0 },
                        { color: SHARE_RAMP[1], stop: 1 },
                    ],
                    domain: [0, 1],
                    missingDataFill: EMPTY_FILL,
                },
                ...SEGMENT_SEPARATOR,
                label: {
                    enabled: true,
                    formatter: ({ datum }) => (datum.share == null ? '' : fmtPct(datum.share)),
                    itemStyler: ({ datum }) => ({
                        color: (datum.share ?? 0) >= DARK_CELL_SHARE ? '#ffffff' : 'var(--pc-text)',
                    }),
                },
                tooltip: {
                    renderer: ({ datum }) => ({
                        title: `${datum.supplier} · ${datum.subcategory}`,
                        data: [
                            { label: 'Spend', value: fmtCurrency(datum.spend) },
                            {
                                label: 'Share of subcategory',
                                value: datum.share == null ? '—' : fmtPct(datum.share),
                            },
                        ],
                    }),
                },
            },
        ],
        axes: {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'category', position: 'left' },
        },
        gradientLegend: { enabled: false },
        padding: { top: 8, right: 12, bottom: 4, left: 4 },
    };
}

/**
 * Supplier share of each subcategory as horizontal bars normalised to 100%: a subcategory drawn as
 * one unbroken band has no second source. Keeps supplier identity colours, which the heatmap gives up.
 */
function stackedBarOptions(
    rows: SupplierShareRow[],
    supplierNames: Map<string, string>,
    supplierColors: Record<string, string>
): AgCartesianChartOptions<SupplierShareRow> {
    const series = [...supplierNames.entries()].map<AgBarSeriesOptions<SupplierShareRow>>(([supplierId, name]) => ({
        type: 'bar',
        direction: 'horizontal',
        xKey: 'subcategory',
        yKey: name,
        yName: name,
        stacked: true,
        normalizedTo: 100,
        fill: supplierColors[supplierId] ?? NEUTRAL,
        ...SEGMENT_SEPARATOR,
        tooltip: {
            renderer: ({ datum }) => {
                const spend = Number(datum[name] ?? 0);
                const total = [...supplierNames.values()].reduce((sum, key) => sum + Number(datum[key] ?? 0), 0);
                return {
                    title: `${name} · ${datum.subcategory}`,
                    data: [
                        { label: 'Spend', value: fmtCurrency(spend) },
                        { label: 'Share of subcategory', value: total > 0 ? fmtPct(spend / total) : '—' },
                    ],
                };
            },
        },
    }));

    return {
        theme: THEME,
        data: rows,
        series,
        axes: {
            y: { type: 'category', position: 'left' },
            x: {
                type: 'number',
                position: 'bottom',
                title: { enabled: true, text: 'Share of subcategory spend' },
                label: { formatter: ({ value }) => `${value}%` },
            },
        },
        legend: { enabled: true, position: 'bottom' },
        padding: { top: 8, right: 12, bottom: 4, left: 4 },
    };
}

/**
 * Supplier share of each subcategory, as a heatmap or a normalised stacked bar.
 *
 * Reads the whole period rather than the current selection, and emits none of its own: the two
 * spend charts answer the same question at different grains, and dimming one from the other's
 * selection hides exactly the comparison the pair exists to support.
 */
export function SupplierShareChart({ rows, supplierNames, supplierColors, view }: SupplierShareChartProps) {
    const options = useMemo<AgCartesianChartOptions>(
        () =>
            view === 'heatmap'
                ? heatmapOptions(rows, supplierNames)
                : stackedBarOptions(rows, supplierNames, supplierColors),
        [rows, supplierNames, supplierColors, view]
    );

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
