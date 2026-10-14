import { useCallback, useMemo } from 'react';

import type { AgSelectionItemIds } from 'ag-charts-community';
import type { AgQuadrantChartOptions } from 'ag-charts-enterprise';
import { AgQuadrantChart } from 'ag-charts-react';

import { NEUTRAL, STATUS_COLORS, SUCCESS_FILL, THEME } from '../chartTheme';
import { ON_TIME_TARGET } from '../data';
import { fmtCurrency, fmtCurrencyCompact, fmtIndex, fmtInt, fmtPct, fmtPctWhole } from '../format';
import type { SupplierScorecard } from '../types';
import { stylerOwnedSelection } from './chartSelection';
import { useSupplierSelection } from './useSupplierSelection';

/** Paying exactly list price: left of it is cheaper, right of it dearer. */
const LIST_PRICE_INDEX = 1;

const SERIES_ID = 'suppliers';

const STROKE_WIDTH = 1.5;

// The preset forwards only chart-level selection options, so the series' styles come through the theme.
const SCATTER_THEME: AgQuadrantChartOptions['theme'] = {
    ...THEME,
    overrides: { ...THEME.overrides, bubble: { series: { selection: stylerOwnedSelection(STROKE_WIDTH) } } },
};

interface CostReliabilityScatterProps {
    rows: SupplierScorecard[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** The user selected a supplier's bubble, or clicked away to clear the selection. */
    onSelectedSupplierChange: (supplierId: string | undefined) => void;
}

const supplierIdOfItem = ({ datum }: { datum: SupplierScorecard }) => datum.supplierId;

/**
 * Her roster drawn as price against delivery performance, sized by spend — the same rows
 * the scorecard cards show, positioned instead of listed, so an outlier is visible at a
 * glance and the cards carry the detail.
 *
 * The chart is split at list price and her on-time target, so the quadrant a supplier falls in
 * is the verdict: below list and on target is good value, above list and below target needs action.
 *
 * Bubble area is spend rather than quantity ordered: her commodity is bought in both tonnes and
 * kilos, so a summed quantity is only comparable between suppliers that happen to share a unit,
 * and spend is what makes a relationship big in the sense the bubble implies.
 *
 * Price is drawn as a share of catalogue list for the same reason: the roster spans the whole
 * commodity, and an average price across tonnes and kilos compares nothing.
 */
export function CostReliabilityScatter({
    rows,
    supplierColors,
    selectedSupplierId,
    onSelectedSupplierChange,
}: CostReliabilityScatterProps) {
    // A supplier with no orders in scope has no price to draw, only a card.
    const drawn = useMemo(() => rows.filter((row) => row.orderCount > 0), [rows]);

    const itemsFor = useCallback(
        (supplierId: string): AgSelectionItemIds[] =>
            drawn.some((row) => row.supplierId === supplierId) ? [{ seriesId: SERIES_ID, itemId: supplierId }] : [],
        [drawn]
    );

    const { chartRef, onChartSelectionChange, onChartClick } = useSupplierSelection<SupplierScorecard>({
        selectedSupplierId,
        onSelectedSupplierChange,
        supplierIdOf: supplierIdOfItem,
        itemsFor,
    });

    const options = useMemo<AgQuadrantChartOptions<SupplierScorecard>>(
        () => ({
            theme: SCATTER_THEME,
            data: drawn,
            dataIdKey: 'supplierId',
            id: SERIES_ID,
            xKey: 'priceIndex',
            xName: 'Price vs list',
            yKey: 'onTimeRate',
            yName: 'On-time delivery',
            sizeKey: 'spend',
            sizeName: 'Spend',
            labelKey: 'supplier',
            minSize: 12,
            maxSize: 46,
            strokeWidth: STROKE_WIDTH,
            label: { enabled: true, fontSize: 11 },
            pivot: { x: LIST_PRICE_INDEX, y: ON_TIME_TARGET },
            regions: {
                label: { fontSize: 11, fontWeight: 'bold', color: 'var(--pc-muted)' },
                topLeft: {
                    fill: SUCCESS_FILL,
                    fillOpacity: 0.12,
                    label: { text: 'Retain & expand', color: 'var(--pc-ok)' },
                },
                topRight: { fillOpacity: 0, label: { text: 'Renegotiate price' } },
                bottomLeft: { fillOpacity: 0, label: { text: 'Improve delivery' } },
                bottomRight: {
                    fill: STATUS_COLORS.Late,
                    fillOpacity: 0.12,
                    label: { text: 'Review / exit', color: 'var(--pc-bad)' },
                },
            },
            // Supplier identity colour, as on its card and the sunburst; `fillOpacity` is explicit so a
            // bubble never inherits its region's faint tint. A dimmed bubble is outside the selection.
            itemStyler: ({ datum }) => {
                const color = supplierColors[datum.supplierId] ?? NEUTRAL;
                if (selectedSupplierId == null || datum.supplierId === selectedSupplierId) {
                    return { fill: color, stroke: color, fillOpacity: 0.78 };
                }
                return { fill: NEUTRAL, stroke: NEUTRAL, fillOpacity: 0.28 };
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    title: datum.supplier,
                    data: [
                        { label: 'Price vs list', value: fmtIndex(datum.priceIndex) },
                        datum.rateIsContracted
                            ? { label: 'On-time (contracted)', value: fmtPct(datum.onTimeRate) }
                            : {
                                  label: `On-time (${fmtInt(datum.deliveredCount)} delivered)`,
                                  value: fmtPct(datum.onTimeRate),
                              },
                        { label: 'Spend', value: fmtCurrency(datum.spend) },
                    ],
                }),
            },
            selection: { enabled: true },
            listeners: { selectionChange: onChartSelectionChange, click: onChartClick },
            xAxis: {
                title: { enabled: true, text: 'Price vs list price' },
                label: { formatter: ({ value }) => fmtIndex(value, 1) },
            },
            yAxis: {
                title: { enabled: true, text: `On-time delivery (target ${fmtPctWhole(ON_TIME_TARGET)})` },
                label: { formatter: ({ value }) => fmtPctWhole(value) },
                max: 1,
            },
            padding: { top: 8, right: 16, bottom: 4, left: 4 },
            formatter: {
                size: ({ value }) => fmtCurrencyCompact(Number(value)),
            },
        }),
        [drawn, supplierColors, selectedSupplierId, onChartSelectionChange, onChartClick]
    );

    return <AgQuadrantChart ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
