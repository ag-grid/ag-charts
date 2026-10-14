import { useCallback, useMemo } from 'react';

import type {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgScatterSeriesOptions,
    AgSelectionItemIds,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, THEME } from '../chartTheme';
import { fmtCurrency, fmtCurrencyCompact, fmtInt, fmtPct, fmtPctWhole } from '../format';
import type { MaterialQualityCost, QualityCost } from '../types';
import { stylerOwnedSelection } from './chartSelection';
import { useSupplierSelection } from './useSupplierSelection';

/** A supplier or a material, with the rate expressed the way the chart reads it: what failed, not what passed. */
interface Row {
    label: string;
    /** The supplier the bar is coloured by: its own at the top level, the drilled one beneath it. */
    supplierId: string;
    /** Only set on a material row. */
    subcategory?: string;
    rejectedValue: number;
    rejectedRate: number;
    deliveredCount: number;
}

interface QualityCostChartProps {
    rows: QualityCost[];
    /** The supplier whose materials are shown in place of the suppliers, if any. */
    drilledSupplierId?: string;
    /** The drilled supplier's materials; ignored when no supplier is drilled. */
    materialRows: MaterialQualityCost[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** The user selected a supplier's bar or marker, or clicked away to clear the selection. */
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
    /** Called with a supplier's id when its materials are chosen from the context menu. */
    onDrill: (supplierId: string) => void;
}

/** The axis the reject rate is drawn against, kept off the money scale it shares a chart with. */
const RATE_AXIS = 'rate';

const COST_SERIES_ID = 'cost';
const RATE_SERIES_ID = 'rate';
const RATE_MARKER_STROKE_WIDTH = 1;

const supplierIdOf = ({ datum }: { datum: Row }) => datum.supplierId;

const tooltipRow = (label: string, value: string) =>
    `<div class="ag-charts-tooltip-row"><span class="ag-charts-tooltip-label">${label}</span><span class="ag-charts-tooltip-value">${value}</span></div>`;

// Raw markup in the default tooltip's classes, as the structured result has no footer.
function barTooltip(datum: Row, footer: string | undefined) {
    const rows = [
        datum.subcategory == null ? '' : tooltipRow('Subcategory', datum.subcategory),
        tooltipRow('Rejected material', fmtCurrency(datum.rejectedValue)),
        tooltipRow('Rejected', fmtPct(datum.rejectedRate)),
        tooltipRow('Deliveries', fmtInt(datum.deliveredCount)),
    ].join('');
    return `<div class="ag-charts-tooltip-content">
                <span class="ag-charts-tooltip-title">${datum.label}</span>
                ${rows}
                ${footer == null ? '' : `<div class="ag-charts-tooltip-footer">${footer}</div>`}
            </div>`;
}

/**
 * What each supplier's rejected material cost, against the rate it was rejected at.
 *
 * Two scales because the two readings are different questions. The bill is what competes with a price
 * variance for her attention, and the rate is what a supplier can actually be held to — a big bill on
 * a low rate is a volume problem, the same bill on a high rate is a process one. Sorted by the bill,
 * so a marker sitting high above a short bar is the supplier whose quality is worst but cheapest.
 * A supplier's context menu drills into the same two readings per material bought from it.
 */
export function QualityCostChart({
    rows,
    drilledSupplierId,
    materialRows,
    supplierColors,
    selectedSupplierId,
    onSelectedSupplierChange,
    onDrill,
}: QualityCostChartProps) {
    const data = useMemo<Row[]>(() => {
        const levelRows: Row[] =
            drilledSupplierId == null
                ? rows.map((row) => ({
                      label: row.supplier,
                      supplierId: row.supplierId,
                      rejectedValue: row.rejectedValue,
                      rejectedRate: 1 - row.acceptedRate,
                      deliveredCount: row.deliveredCount,
                  }))
                : materialRows.map((row) => ({
                      label: row.material,
                      supplierId: drilledSupplierId,
                      subcategory: row.subcategory,
                      rejectedValue: row.rejectedValue,
                      rejectedRate: 1 - row.acceptedRate,
                      deliveredCount: row.deliveredCount,
                  }));
        return levelRows.sort((a, b) => b.rejectedValue - a.rejectedValue);
    }, [rows, drilledSupplierId, materialRows]);

    // A row's bar and marker are both the supplier, so a click on either selects it.
    const itemsFor = useCallback(
        (supplierId: string): AgSelectionItemIds[] =>
            data
                .filter((row) => row.supplierId === supplierId)
                .flatMap((row) => [
                    { seriesId: COST_SERIES_ID, itemId: row.label },
                    { seriesId: RATE_SERIES_ID, itemId: row.label },
                ]),
        [data]
    );

    const { chartRef, onChartSelectionChange, onChartClick } = useSupplierSelection<Row>({
        selectedSupplierId,
        onSelectedSupplierChange,
        supplierIdOf,
        itemsFor,
    });

    const options = useMemo<AgCartesianChartOptions<Row>>(() => {
        const dimmed = (supplierId: string) => selectedSupplierId != null && supplierId !== selectedSupplierId;

        const cost: AgBarSeriesOptions<Row> = {
            type: 'bar',
            id: COST_SERIES_ID,
            xKey: 'label',
            yKey: 'rejectedValue',
            yName: 'Cost of rejected material',
            cornerRadius: 2,
            widthRatio: 0.65,
            // Bars take their supplier's colour from the styler, so the series fill only ever shows in the legend.
            fill: NEUTRAL,
            itemStyler: ({ datum }) =>
                dimmed(datum.supplierId)
                    ? { fill: NEUTRAL, fillOpacity: 0.3 }
                    : { fill: supplierColors[datum.supplierId] ?? NEUTRAL },
            selection: stylerOwnedSelection(0),
            tooltip: {
                renderer: ({ datum }) =>
                    barTooltip(
                        datum,
                        drilledSupplierId == null ? "Right-click to see this supplier's materials" : undefined
                    ),
            },
            highlight: { bringToFront: false },
        };

        // Markers only: the axis has no order, so a line would draw a trend that is not there.
        const rate: AgScatterSeriesOptions<Row> = {
            type: 'scatter',
            id: RATE_SERIES_ID,
            xKey: 'label',
            yKey: 'rejectedRate',
            yName: 'Percent rejected',
            yKeyAxis: RATE_AXIS,
            shape: 'diamond',
            size: 12,
            fill: 'var(--pc-text)',
            strokeWidth: RATE_MARKER_STROKE_WIDTH,
            stroke: 'var(--pc-bg)',
            selection: stylerOwnedSelection(RATE_MARKER_STROKE_WIDTH),
            // The shared tooltip shows the bar's, which already carries the rate.
            tooltip: { enabled: false },
            highlight: { enabled: false, bringToFront: false },
        };

        return {
            theme: THEME,
            data,
            dataIdKey: 'label',
            series: [cost, rate],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    label: { truncate: true },
                },
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
                    // Whole-percent ticks, or a 0.5% step would label two ticks with the same rounded value.
                    interval: { step: 0.01 },
                    label: { formatter: ({ value }) => fmtPctWhole(value) },
                    // One grid is enough: a second set of lines at different intervals reads as noise.
                    gridLine: { enabled: false },
                },
            },
            legend: { enabled: true },
            // Below the 300px chart minimum; a chart that will not shrink overflows its box and swallows clicks.
            minWidth: 0,
            minHeight: 0,
            padding: { top: 8, right: 8, bottom: 4, left: 4 },
            selection: { enabled: true },
            listeners: { selectionChange: onChartSelectionChange, click: onChartClick },
            contextMenu: {
                // A click selects, so drilling is the menu's: the materials replace every supplier in the chart.
                getItems: ({ allShowOnParams, defaultItems }) => {
                    const node = allShowOnParams.find((params) => params.showOn === 'series-node');
                    if (drilledSupplierId != null || node == null) return undefined;
                    const { supplierId, label } = node.datum;
                    return [
                        {
                            showOn: 'series-node',
                            label: `Drill down into ${label}'s materials`,
                            action: () => onDrill(supplierId),
                        },
                        'separator',
                        ...defaultItems,
                    ];
                },
            },
            tooltip: {
                position: {
                    anchorTo: 'node',
                    placement: ['top'],
                },
                range: 10,
                mode: 'shared',
            },
        };
    }, [data, drilledSupplierId, supplierColors, selectedSupplierId, onDrill, onChartSelectionChange, onChartClick]);

    return <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
