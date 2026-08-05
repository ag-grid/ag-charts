import { describe, expect, it, vi } from 'vitest';

import { type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    type SceneGeometrySample,
    compareImageSnapshot,
    createSceneGeometrySampler,
    expectNoAnimation,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    spyOnAnimationManager,
} from 'ag-charts-community-test';
import { expectWarningsCalls } from 'ag-charts-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('PieSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: AgChartInstance;

    const compareSnapshot = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    afterEach(() => {
        chart?.destroy();
        (chart as any) = undefined;
    });

    // AG-12391 - Test for switching data with overlapping non-unique keys rendering incorrectly.
    // This is a pixel-correctness check of how overlapping sectors composite at the settled render,
    // kept as a stored-baseline image snapshot per the animation-trajectory-tests classification rule.
    // Sector MOTION during the switch is covered structurally by the 'switching data animation' CASE below.
    describe('switching data', () => {
        const animate = spyOnAnimationManager();

        it('should switch between datasets with overlapping keys', async () => {
            animate(1200, 1);

            const data = [
                { id: 'a', value: 4 },
                { id: 'b', value: 6 },
                { id: 'c', value: 5 },
            ];
            const options = prepareEnterpriseTestOptions({
                // animation: { enabled: true },
                data,
                series: [{ type: 'pie' as const, angleKey: 'value', calloutLabelKey: 'id' }],
            });

            chart = AgCharts.create(options);
            await compareSnapshot();

            await chart.updateDelta({
                data: [...data, ...data],
            });
            await compareSnapshot();

            await chart.updateDelta({
                data: [...data],
            });
            await compareSnapshot();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - legend item 'a' has multiple fill colours, this may cause unexpected behaviour.",
  ],
  [
    "AG Charts - legend item 'b' has multiple fill colours, this may cause unexpected behaviour.",
  ],
  [
    "AG Charts - legend item 'c' has multiple fill colours, this may cause unexpected behaviour.",
  ],
]
`);
        });
    });

    // Sector MOTION during the overlapping-key switch above. Non-unique keys can't be paired old→new,
    // so the ring re-lays-out and snaps to its settled geometry on the first frame rather than
    // tweening — the enterprise override of community pie, whose unique-key tweening path is covered
    // in the community pieSeries.test.ts trajectory suite.
    describe('switching data animation', () => {
        const frames = spyOnAnimationFrames();

        const sectorEntries = (sample: SceneGeometrySample) =>
            [...sample].filter(([key]) => /^series\[0\]\/sector\[/.test(key));
        const sectorCount = (sample: SceneGeometrySample) => sectorEntries(sample).length;

        it('overlapping-key data switch snaps sectors without tweening', async () => {
            const data = [
                { id: 'a', value: 4 },
                { id: 'b', value: 6 },
                { id: 'c', value: 5 },
            ];
            const options = prepareEnterpriseTestOptions({
                data,
                series: [{ type: 'pie' as const, angleKey: 'value', calloutLabelKey: 'id' }],
            });
            chart = AgCharts.create(options);
            const sampler = createSceneGeometrySampler(chart);
            const { before, trajectory, after } = await frames.captureSnap(chart, sampler, () =>
                chart.updateDelta({ data: [...data, ...data] })
            );

            // Anti-vacuity: the switch genuinely reshaped the ring — duplicating the keys doubles the
            // sector count and re-layouts the outer radius — so a constant trajectory is a real snap,
            // not a pin over an unchanged scene.
            expect(sectorCount(before)).toBe(3);
            expect(sectorCount(after)).toBe(6);
            const beforeOuter = sectorEntries(before)[0][1].outerRadius;
            const afterOuter = sectorEntries(after)[0][1].outerRadius;
            expect(Math.abs(afterOuter - beforeOuter), 'outer radius re-layout').toBeGreaterThan(10);

            // The re-laid-out six-sector ring is already at its settled geometry on the first captured
            // frame (contrast a tween, which would grow the entrants and shrink survivors over the
            // trajectory) and holds constant thereafter.
            expect(sectorCount(trajectory[0])).toBe(6);
            expectNoAnimation(trajectory);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
});
