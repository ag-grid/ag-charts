import { useMemo } from 'react';

import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { SEGMENT_SEPARATOR, SUBCATEGORY_RAMP, THEME } from '../chartTheme';
import { fmtCurrency, fmtCurrencyCompact, fmtPct } from '../format';
import type { SpendTrendGrain, SpendTrendRow } from '../types';

interface SpendTrendChartProps {
    rows: SpendTrendRow[];
    /** Her commodity's subcategories, in the order the sunburst rings them. */
    subcategories: string[];
    /** What one bar covers, which every figure in the tooltip has to name. */
    grain: SpendTrendGrain;
}

/**
 * Committed spend per month or per week, stacked by subcategory.
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
 * Takes the subcategory ramp rather than the categorical palette, matching the sunburst's inner
 * ring — the same "what did I buy" question in the same hue, leaving categorical colour to mean
 * supplier identity everywhere in the workspace.
 */
export function SpendTrendChart({ rows, subcategories, grain }: SpendTrendChartProps) {
    const options = useMemo<AgCartesianChartOptions<SpendTrendRow>>(() => {
        // A week's label is the day it starts on, which only reads as a span if it says so.
        const spanOf = (label: string) => (grain === 'week' ? `week of ${label}` : label);
        const series = subcategories.map<AgBarSeriesOptions<SpendTrendRow>>((subcategory, index) => ({
            type: 'bar',
            xKey: 'label',
            yKey: subcategory,
            yName: subcategory,
            stacked: true,
            fill: SUBCATEGORY_RAMP[index % SUBCATEGORY_RAMP.length],
            ...SEGMENT_SEPARATOR,
            tooltip: {
                renderer: ({ datum }) => {
                    const spend = Number(datum[subcategory] ?? 0);
                    const total = subcategories.reduce((sum, key) => sum + Number(datum[key] ?? 0), 0);
                    return {
                        title: `${subcategory} · ${spanOf(datum.label)}`,
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
    }, [rows, subcategories, grain]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
