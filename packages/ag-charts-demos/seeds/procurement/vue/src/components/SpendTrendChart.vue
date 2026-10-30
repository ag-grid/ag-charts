<script lang="ts">
import type { AgBarSeriesOptions, AgCartesianChartOptions, AgUnitTimeAxisOptions } from 'ag-charts-community';

import { MONTH_AXIS, SEGMENT_SEPARATOR, STACKED_BAR_GAP, THEME } from '../chartTheme';
import { fmtCurrency, fmtCurrencyMillions, fmtMonth, fmtPct, wholeMillionStep } from '../format';
import type { SpendTrendGrain, SpendTrendRow } from '../types';

/** One stacked band: the row key it reads, the name it is shown under and its colour. */
export interface SpendTrendStack {
    key: string;
    name: string;
    fill: string;
}

/** Months only: the monthly grain is year to date, so every month is in the same year. */
const YEAR_TO_DATE_MONTH_AXIS: AgUnitTimeAxisOptions = {
    ...MONTH_AXIS,
    label: { format: { month: '%b' } },
    parentLevel: { enabled: false },
    crosshair: { label: { format: '%b' } },
    paddingInner: STACKED_BAR_GAP,
};
</script>

<script setup lang="ts">
import { computed } from 'vue';

import { AgCharts } from 'ag-charts-vue3';

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
const props = defineProps<{
    rows: SpendTrendRow[];
    /** The bands, bottom first — her subcategories in sunburst order, or her suppliers in roster order. */
    stacks: SpendTrendStack[];
    /** What one bar covers, which every figure in the tooltip has to name. */
    grain: SpendTrendGrain;
}>();

const options = computed<AgCartesianChartOptions<SpendTrendRow>>(() => {
    const { rows, stacks, grain } = props;
    // A week's label is the day it starts on, which only reads as a span if it says so.
    const spanOf = (row: SpendTrendRow) => (grain === 'week' ? `week of ${row.label}` : fmtMonth(row.start));
    // Weeks stay categories: they start on the window's first day, not on a calendar week a time axis would snap to.
    const monthly = grain === 'month';
    const series = stacks.map<AgBarSeriesOptions<SpendTrendRow>>(({ key, name, fill }) => ({
        type: 'bar',
        xKey: monthly ? 'start' : 'label',
        yKey: key,
        yName: name,
        stacked: true,
        fill,
        cornerRadius: 3,
        ...SEGMENT_SEPARATOR,
        tooltip: {
            renderer: ({ datum }) => {
                const spend = Number(datum[key] ?? 0);
                const total = stacks.reduce((sum, stack) => sum + Number(datum[stack.key] ?? 0), 0);
                return {
                    heading: '',
                    title: `${name} · ${spanOf(datum)}`,
                    data: [
                        { label: 'Committed', value: fmtCurrency(spend) },
                        { label: `Share of ${grain}`, value: total > 0 ? fmtPct(spend / total) : '—' },
                        { label: `${grain === 'week' ? 'Week' : 'Month'} total`, value: fmtCurrency(total) },
                    ],
                };
            },
        },
    }));

    const yMax = Math.max(0, ...rows.map((row) => stacks.reduce((sum, stack) => sum + Number(row[stack.key] ?? 0), 0)));

    return {
        theme: THEME,
        data: rows,
        series,
        axes: {
            x: monthly
                ? YEAR_TO_DATE_MONTH_AXIS
                : { type: 'category', position: 'bottom', paddingInner: STACKED_BAR_GAP },
            y: {
                type: 'number',
                position: 'left',
                title: { enabled: true, text: 'Committed spend' },
                interval: { step: wholeMillionStep(yMax) },
                label: { formatter: ({ value }) => fmtCurrencyMillions(value) },
            },
        },
        legend: { enabled: true, position: 'bottom' },
        padding: { top: 8, right: 12, bottom: 4, left: 4 },
    };
});
</script>

<template>
    <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
