import { useMemo } from 'react';

import type { AgBubbleSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { NEUTRAL, THEME } from '../chartTheme';
import { ON_TIME_TARGET } from '../data';
import { fmtCurrency, fmtCurrencyCompact, fmtInt, fmtPct, fmtSignedPct } from '../format';
import type { SupplierScorecard } from '../types';

interface CostReliabilityScatterProps {
    rows: SupplierScorecard[];
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** Clicking the selected supplier's bubble again clears it. */
    onSelect: (supplierId: string) => void;
}

/**
 * Her roster plotted as price against delivery performance, sized by spend — the same rows
 * the scorecard cards show, positioned instead of listed, so an outlier is visible at a
 * glance and the cards carry the detail.
 *
 * Bubble area is spend rather than quantity ordered: her commodity is bought in both tonnes and
 * kilos, so a summed quantity is only comparable between suppliers that happen to share a unit,
 * and spend is what makes a relationship big in the sense the bubble implies.
 *
 * Price is plotted as a share of catalogue list for the same reason: the roster spans the whole
 * commodity, and an average price across tonnes and kilos compares nothing.
 */
export function CostReliabilityScatter({
    rows,
    supplierColors,
    selectedSupplierId,
    onSelect,
}: CostReliabilityScatterProps) {
    // A supplier with no orders in scope has no price to plot, only a card.
    const plotted = useMemo(() => rows.filter((row) => row.orderCount > 0), [rows]);

    const options = useMemo<AgCartesianChartOptions<SupplierScorecard>>(() => {
        const series: AgBubbleSeriesOptions<SupplierScorecard> = {
            type: 'bubble',
            xKey: 'priceIndex',
            xName: 'Price vs list',
            yKey: 'onTimeRate',
            yName: 'On-time delivery',
            sizeKey: 'spend',
            sizeName: 'Spend',
            labelKey: 'supplier',
            minSize: 12,
            maxSize: 46,
            fillOpacity: 0.78,
            strokeWidth: 1.5,
            label: { enabled: true, fontSize: 11 },
            // Each supplier keeps the identity colour it carries on its card and in the
            // sunburst's outer ring; a dimmed bubble is one outside the current selection.
            itemStyler: ({ datum }) => {
                const color = supplierColors[datum.supplierId] ?? NEUTRAL;
                if (selectedSupplierId == null || datum.supplierId === selectedSupplierId) {
                    return { fill: color, stroke: color };
                }
                return { fill: NEUTRAL, stroke: NEUTRAL, fillOpacity: 0.28 };
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    title: `${datum.supplier} · ${datum.country}`,
                    data: [
                        { label: 'Price vs list', value: `${datum.priceIndex.toFixed(2)}×` },
                        { label: 'vs contract', value: fmtSignedPct(datum.priceVariance) },
                        datum.rateIsContracted
                            ? { label: 'On-time (contracted)', value: fmtPct(datum.onTimeRate) }
                            : {
                                  label: `On-time (${fmtInt(datum.deliveredCount)} delivered)`,
                                  value: fmtPct(datum.onTimeRate),
                              },
                        { label: 'Quality', value: fmtPct(datum.qualityScore) },
                        { label: 'Spend', value: fmtCurrency(datum.spend) },
                        { label: 'Order lines', value: fmtInt(datum.orderCount) },
                    ],
                }),
            },
            listeners: {
                seriesNodeClick: ({ datum }) => onSelect(datum.supplierId),
            },
        };

        return {
            theme: THEME,
            data: plotted,
            series: [series],
            axes: {
                x: {
                    type: 'number',
                    position: 'bottom',
                    title: { enabled: true, text: 'Price vs list price' },
                    label: { formatter: ({ value }) => `${value.toFixed(2)}×` },
                },
                y: {
                    type: 'number',
                    position: 'left',
                    title: { enabled: true, text: 'On-time delivery' },
                    label: { formatter: ({ value }) => fmtPct(value) },
                    // Her delivery target, so a supplier below it reads as below it.
                    crossLines: [
                        {
                            type: 'line',
                            value: ON_TIME_TARGET,
                            stroke: 'var(--pc-muted)',
                            strokeWidth: 1,
                            lineDash: [4, 4],
                            label: {
                                enabled: true,
                                text: `${fmtPct(ON_TIME_TARGET)} target`,
                                position: 'top-left',
                                color: 'var(--pc-muted)',
                                fontSize: 11,
                            },
                        },
                    ],
                },
            },
            legend: { enabled: false },
            padding: { top: 8, right: 16, bottom: 4, left: 4 },
            formatter: {
                size: ({ value }) => fmtCurrencyCompact(Number(value)),
            },
        };
    }, [plotted, supplierColors, selectedSupplierId, onSelect]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
