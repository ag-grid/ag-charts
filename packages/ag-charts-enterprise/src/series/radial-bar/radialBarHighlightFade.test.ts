import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgPolarChartOptions } from 'ag-charts-community';
import {
    deproxy,
    expectFade,
    getSeriesNodeData,
    playTransitionAnimations,
    renderedPixelAt,
    setupMockCanvas,
    setupMockConsole,
    shownOpacity,
    spyOnAnimationFrames,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

// 0.3 of the default animation duration of 1s.
const FADE_MS = 300;
const WHITE = [255, 255, 255, 255];

interface SectorDatum {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
}

describe('RadialBarSeries highlight fade', () => {
    setupMockConsole();
    setupMockCanvas();
    playTransitionAnimations();
    const frames = spyOnAnimationFrames();

    let proxy: AgChartInstance;
    /** The colour each series' sectors render with at full opacity. */
    let opaque: number[][];

    afterEach(() => {
        proxy?.destroy();
    });

    const options: AgPolarChartOptions = {
        background: { fill: '#ffffff' },
        data: [
            { quarter: 'Q1', apples: 5, oranges: 3 },
            { quarter: 'Q2', apples: 7, oranges: 4 },
            { quarter: 'Q3', apples: 6, oranges: 5 },
        ],
        legend: { enabled: false },
        series: (['apples', 'oranges'] as const).map((angleKey) => ({
            type: 'radial-bar' as const,
            radiusKey: 'quarter',
            angleKey,
        })),
    };

    const chart = () => deproxy(proxy);
    const datum = (seriesIndex: number, datumIndex: number) => getSeriesNodeData(proxy, seriesIndex)[datumIndex];
    /** The colour rendered at the middle of a sector. */
    const pixel = (seriesIndex: number, datumIndex: number) => {
        const { innerRadius, outerRadius, startAngle, endAngle } = getSeriesNodeData<SectorDatum>(proxy, seriesIndex)[
            datumIndex
        ];
        const { centerX, centerY } = chart().series[seriesIndex] as unknown as { centerX: number; centerY: number };
        const radius = (innerRadius + outerRadius) / 2;
        const angle = (startAngle + endAngle) / 2;
        const { x, y } = chart().seriesRect!;
        return renderedPixelAt(proxy, x + centerX + radius * Math.cos(angle), y + centerY + radius * Math.sin(angle));
    };
    /** The opacity a sector is seen at, whichever nodes draw it. */
    const shown = (seriesIndex: number, datumIndex: number) =>
        shownOpacity(pixel(seriesIndex, datumIndex), opaque[seriesIndex], WHITE);
    const highlight = (highlighted?: ReturnType<typeof datum>) =>
        chart().ctx.highlightManager.updateHighlight(chart().id, highlighted);

    const capture = <T>(sampler: () => T) =>
        frames.captureAnimationFrames(proxy, sampler, { frames: 10, duration: FADE_MS + 100, rendered: true });

    const create = async (chartOptions: AgPolarChartOptions) => {
        proxy?.destroy();
        proxy = await createEnterpriseChart(chartOptions);
        await frames.runToEnd(proxy);
        await chart().waitForUpdate();
        opaque = chart().series.map((_, seriesIndex) => pixel(seriesIndex, 0));
    };

    beforeEach(async () => {
        await create(options);
    });

    it('fades the sectors of the other series when a sector is highlighted', async () => {
        expect(opaque[1]).not.toEqual(WHITE);
        highlight(datum(0, 1));
        const trajectory = await capture(() => shown(1, 0));

        expect(trajectory.at(-1)).toBeLessThan(1);
        expectFade(trajectory, 1, trajectory.at(-1)!);
    });

    it('fades the sectors back when the highlight is removed', async () => {
        highlight(datum(0, 1));
        await frames.runToEnd(proxy);
        const dimmed = shown(1, 0);

        highlight();
        const trajectory = await capture(() => shown(1, 0));

        expectFade(trajectory, dimmed, 1);
    });

    it('fades out the highlighted copy when the highlight moves to another sector', async () => {
        const unhighlightedItem = { fillOpacity: 0.4, strokeOpacity: 0.4 };
        await create({
            ...options,
            series: options.series?.map((series) => ({ ...series, highlight: { unhighlightedItem } })),
        });
        highlight(datum(0, 1));
        await frames.runToEnd(proxy);

        highlight(datum(0, 2));
        const trajectory = await capture(() => shown(0, 1));

        expect(trajectory.at(-1)).toBeLessThan(1);
        expectFade(trajectory, 1, trajectory.at(-1)!);
    });
});
