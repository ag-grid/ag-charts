import { useMemo } from 'react';

import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { SEGMENT_SEPARATOR, THEME } from '../chartTheme';
import { fmtCurrency, fmtCurrencyCompact, fmtPct } from '../format';
import type { SpendTrendGrain, SpendTrendRow } from '../types';

/** One stacked band: the row key it reads, the name it is shown under and its colour. */
export interface SpendTrendStack {
    key: string;
    name: string;
    fill: string;
}

interface SpendTrendChartProps {
    rows: SpendTrendRow[];
    /** The bands, bottom first — her subcategories in sunburst order, or her suppliers in roster order. */
    stacks: SpendTrendStack[];
    /** What one bar covers, which every figure in the tooltip has to name. */
    grain: SpendTrendGrain;
}

/**
 * Committed spend per month or per week, stacked by subcategory or by supplier.
 *
 * The tab's other charts all collapse time: the sunburst is a snapshot, the burn-up is cumulative
 * within one quarter, and the waterfall reduces a whole period's movement to three bars. So a mix
 * shift that built up over half a year — a subcategory quietly doubling while the total held
 * steady — is invisible on every one of them, and it is exactly what a business review needs to
 * open with.
 *
 * Stacked rather than grouped because the total is the primary reading and the split the second:
 * grouped bars make four subcategories comparable to each other but lose the month's total, which
 * is the run rate she is being measured on.
 *
 * The caller picks the colours: the subcategory ramp when split by material, matching the
 * sunburst's inner ring, and the suppliers' identity colours when split by supplier — so
 * categorical colour still means supplier identity everywhere in the workspace.
 */
export function SpendTrendChart({ rows, stacks, grain }: SpendTrendChartProps) {
    const options = useMemo<AgCartesianChartOptions<SpendTrendRow>>(() => {
        // A week's label is the day it starts on, which only reads as a span if it says so.
        const spanOf = (label: string) => (grain === 'week' ? `week of ${label}` : label);
        const series = stacks.map<AgBarSeriesOptions<SpendTrendRow>>(({ key, name, fill }) => ({
            type: 'bar',
            xKey: 'label',
            yKey: key,
            yName: name,
            stacked: true,
            fill,
            ...SEGMENT_SEPARATOR,
            tooltip: {
                renderer: ({ datum }) => {
                    const spend = Number(datum[key] ?? 0);
                    const total = stacks.reduce((sum, stack) => sum + Number(datum[stack.key] ?? 0), 0);
                    return {
                        title: `${name} · ${spanOf(datum.label)}`,
                        data: [
                            { label: 'Committed', value: fmtCurrency(spend) },
                            { label: `Share of ${grain}`, value: total > 0 ? fmtPct(spend / total) : '—' },
                            { label: `${grain === 'week' ? 'Week' : 'Month'} total`, value: fmtCurrency(total) },
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
                x: { type: 'category', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    title: { enabled: true, text: 'Committed spend' },
                    label: { formatter: ({ value }) => fmtCurrencyCompact(value) },
                },
            },
            legend: { enabled: true, position: 'bottom' },
            padding: { top: 8, right: 12, bottom: 4, left: 4 },
        };
    }, [rows, stacks, grain]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
