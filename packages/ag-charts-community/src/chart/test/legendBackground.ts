import { expect } from 'vitest';

import type { AgChartInstance, AgChartLegendPosition, AgChartOptions, AgChartTheme } from 'ag-charts-types';

import type { ChartFactory } from './solidFills';
import { compareImageSnapshot, deproxy, type setupMockCanvas, waitForChartStability } from './utils';

interface LegendUnderTest {
    key: 'legend' | 'gradientLegend';
    /** Chart options without a theme. Each case adds to the options already at `key`. */
    options: AgChartOptions;
    /** A floating position over the series, so that the legend's fill shows in the snapshots. */
    floating: AgChartLegendPosition;
}

const CHART_BACKGROUND = '#d8e6f3';
const DARK_BACKGROUND = '#192232';

/**
 * Checks that the legend at `key` is filled with `legendBackgroundColor` when it floats, and wherever it is once the
 * param is set. One chart is updated per case, as the mock canvas only captures the first chart a test creates.
 */
export async function expectLegendBackgroundRules(
    ctx: ReturnType<typeof setupMockCanvas>,
    { create, prepare }: ChartFactory,
    { key, options, floating }: LegendUnderTest
) {
    let chart: AgChartInstance | undefined;

    const backgroundOf = async (theme: AgChartTheme, legend: { position?: AgChartLegendPosition; fill?: string }) => {
        const caseOptions: AgChartOptions = { ...options, theme, [key]: { ...options[key], ...legend } };
        if (chart == null) {
            chart = await create(caseOptions);
        } else {
            await chart.update(prepare(caseOptions));
            await waitForChartStability(chart);
        }
        const { fill, padding } = deproxy(chart).chartOptions.processedOptions[key]!;
        return { fill, padding };
    };
    const compare = () => compareImageSnapshot(chart!, ctx);

    try {
        const unset: AgChartTheme = { params: { chartBackgroundColor: CHART_BACKGROUND } };
        expect(await backgroundOf(unset, {})).toEqual({ fill: 'transparent', padding: 0 });
        expect(await backgroundOf(unset, { position: floating })).toEqual({ fill: CHART_BACKGROUND, padding: 0 });
        await compare();
        expect(await backgroundOf({ params: { backgroundColor: '#eee8d5' } }, { position: floating })).toEqual({
            fill: '#eee8d5',
            padding: 0,
        });

        const set: AgChartTheme = { params: { legendBackgroundColor: '#ffd9a8', legendPadding: 12 } };
        expect(await backgroundOf(set, {})).toEqual({ fill: '#ffd9a8', padding: 12 });
        await compare();
        expect(await backgroundOf(set, { position: floating })).toEqual({ fill: '#ffd9a8', padding: 12 });
        await compare();

        // A value equal to the default still counts as set.
        const setToDefault: AgChartTheme = {
            params: { chartBackgroundColor: CHART_BACKGROUND, legendBackgroundColor: CHART_BACKGROUND },
        };
        expect(await backgroundOf(setToDefault, {})).toEqual({ fill: CHART_BACKGROUND, padding: 5 });

        const setToRef: AgChartTheme = {
            params: { accentColor: '#8a2be2', legendBackgroundColor: { ref: 'accentColor' } },
        };
        expect(await backgroundOf(setToRef, {})).toEqual({ fill: '#8a2be2', padding: 5 });
        expect(await backgroundOf(setToRef, { position: floating })).toEqual({ fill: '#8a2be2', padding: 5 });

        const ownFill = { fill: '#b7e4c7', padding: 12 };
        expect(await backgroundOf(set, { fill: '#b7e4c7', position: floating })).toEqual(ownFill);
        expect(await backgroundOf(set, { fill: '#b7e4c7' })).toEqual(ownFill);
        await compare();

        const dark: AgChartTheme = { baseTheme: 'ag-default-dark' };
        expect(await backgroundOf(dark, { position: floating })).toEqual({ fill: DARK_BACKGROUND, padding: 0 });
        await compare();
    } finally {
        chart?.destroy();
    }
}
