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

    // Pixel-correctness check of overlapping-sector compositing at the settled render; sector
    // MOTION during the switch is covered structurally by the 'switching data animation' CASE below.
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

    // Non-unique keys can't be paired old→new, so the ring re-lays-out and snaps to its settled
    // geometry on the first frame rather than tweening.
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

            // The ring genuinely reshapes (sector count doubles, outer radius changes), so a
            // constant trajectory below is a real snap, not a pin over an unchanged scene.
            expect(sectorCount(before)).toBe(3);
            expect(sectorCount(after)).toBe(6);
            const beforeOuter = sectorEntries(before)[0][1].outerRadius;
            const afterOuter = sectorEntries(after)[0][1].outerRadius;
            expect(Math.abs(afterOuter - beforeOuter), 'outer radius re-layout').toBeGreaterThan(10);

            // Already at settled geometry on the first captured frame, not tweened in.
            expect(sectorCount(trajectory[0])).toBe(6);
            expectNoAnimation(trajectory);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
});
