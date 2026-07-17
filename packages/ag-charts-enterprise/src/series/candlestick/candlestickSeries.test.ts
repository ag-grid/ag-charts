import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    type SceneGeometrySample,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectNoAnimation,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const CANDLESTICK_OPTIONS: AgChartOptions = {
    data: [
        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
        { year: new Date(2022, 0, 1), low: 4.4, close: 4.41, open: 4.96, high: 5.2 },
        { year: new Date(2023, 0, 1), low: 7.31, open: 7.32, close: 7.33, high: 7.33 },
    ],
    series: [
        {
            type: 'candlestick',
            xKey: 'year',
            lowKey: 'low',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
        },
    ],
};

describe('CandlestickSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const compareSnapshot = async (chart: any) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        chart.destroy();
    };

    it(`should render a candlestick chart as expected with default ordinal time x-axis`, async () => {
        const options = CANDLESTICK_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a candlestick chart with a unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'unit-time',
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a candlestick chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    reverse: true,
                },
                x: {
                    type: 'ordinal-time',
                    position: 'bottom',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a candlestick chart with a reversed unit time x-axis`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
            axes: {
                y: {
                    position: 'left',
                    type: 'number',
                },
                x: {
                    position: 'bottom',
                    type: 'unit-time',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    it(`should render a candlestick chart with RTL enabled`, async () => {
        const options: AgChartOptions = {
            ...CANDLESTICK_OPTIONS,
            enableRtl: true,
        };
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    // One CASE per control on the candlestick-series-test page (update value / add data / remove data),
    // plus the initial-load reveal. Candlestick/OHLC series implement no animation hooks — the inherited
    // CartesianSeries defaults skip the batch and snap — so every action must land instantly and
    // completely on the first captured frame. These contracts lock that in: any future animation support
    // must revisit them deliberately.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();
        let chart: AgChartInstance | undefined;

        afterEach(() => {
            chart?.destroy();
            chart = undefined;
        });

        // The y-axis is pinned (0..10, all OHLC values inside it) so a data change never rescales the
        // value axis: candle heights reflect the data alone. The ordinal-time x-axis is left unpinned so
        // add/remove exercise the real band reflow the -test page demonstrates (the layout snaps to the
        // new band count). Winter (January) dates resolve to GMT under the suite's Europe/London TZ.
        const candleData = () => [
            { date: new Date(2023, 0, 1), low: 2, open: 4, close: 6, high: 8 },
            { date: new Date(2023, 0, 2), low: 3, open: 6, close: 4, high: 7 },
            { date: new Date(2023, 0, 3), low: 1, open: 3, close: 5, high: 6 },
        ];
        const candlestickOptions = (): AgCartesianChartOptions =>
            prepareEnterpriseTestOptions({
                data: candleData(),
                series: [
                    {
                        type: 'candlestick',
                        xKey: 'date',
                        lowKey: 'low',
                        openKey: 'open',
                        closeKey: 'close',
                        highKey: 'high',
                    },
                ],
                axes: {
                    x: { type: 'ordinal-time', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 10 },
                },
            }) as AgCartesianChartOptions;

        // Each candle is one Path node keyed by its date; the Date stringifies with a timezone suffix, so
        // match on the leading `Day Mon DD YYYY`.
        const candleKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[0\]\/path\[/.test(k));
        const candleCount = (sample: SceneGeometrySample) => candleKeys(sample).length;
        const candleKey = (sample: SceneGeometrySample, datePrefix: string) => {
            const key = candleKeys(sample).find((k) => k.startsWith(`series[0]/path[${datePrefix}`));
            expect(key, `candle for ${datePrefix}`).toBeDefined();
            return key!;
        };

        // A drawn candle has three subpaths (upper wick, lower wick, body rect) spanning a real
        // high-to-low pixel height — the anti-vacuity guard that the node is rendered at full size, not
        // parked collapsed at a baseline waiting to grow.
        const expectDrawnAtFullRange = (sample: SceneGeometrySample, key: string) => {
            const node = sample.get(key);
            expect(node, key).toBeDefined();
            expect(node!.subpaths, `${key} subpaths`).toBe(3);
            expect(node!.height, `${key} height`).toBeGreaterThan(20);
        };

        // Candlestick implements no animation hooks and skips its batch on every update, so a data
        // change SNAPS: the whole layout (surviving candles rebanding, axis reflow) already sits at its
        // settled state on the first captured frame.
        const captureSnap = (options: AgCartesianChartOptions, action: () => void | Promise<void>) => {
            chart = AgCharts.create(options);
            return frames.captureSnap(chart, createSceneGeometrySampler(chart), action);
        };

        // "Reset"/initial render — candles appear instantly at their full ranges (no reveal).
        it('initial load: candles render instantly at their full ranges', async () => {
            chart = AgCharts.create(candlestickOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            // Anti-vacuity: every candle is already drawn at full high-to-low height on frame 0. A reveal
            // would start collapsed here and grow, which expectNoAnimation would then catch — so the two
            // assertions together are non-vacuous (expectNoAnimation alone passes on a blank scene).
            expect(candleCount(trajectory[0])).toBe(3);
            for (const key of candleKeys(trajectory[0])) {
                expectDrawnAtFullRange(trajectory[0], key);
            }
            expectNoAnimation(trajectory);
        });

        // "Update value" — the last candle's close/high grow; it snaps to the taller range while the
        // earlier candles and the axis hold exactly.
        it('update value: the changed candle snaps to its new range', async () => {
            const data = candleData();
            data[2] = { ...data[2], close: 8, high: 9.5 };
            const { before, trajectory, after } = await captureSnap(candlestickOptions(), () =>
                chart!.update({ ...candlestickOptions(), data })
            );
            const changed = candleKey(after, 'Tue Jan 03 2023');
            // Anti-vacuity: the changed candle genuinely grew (constancy would pass vacuously if nothing
            // moved), and it is already at that taller height on frame 0 — the snap, not a tween.
            expect(after.get(changed)!.height, 'changed candle grew').toBeGreaterThan(before.get(changed)!.height + 30);
            expect(
                Math.abs(trajectory[0].get(changed)!.height - after.get(changed)!.height),
                'changed candle at full height on frame 0'
            ).toBeLessThan(1);
            // The other candles never moved across the update.
            const held = candleKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(held)!.height - before.get(held)!.height), 'untouched candle held').toBeLessThan(
                1
            );
            expectNoAnimation(trajectory);
        });

        // "Add data" — a new candle enters at the end; the ordinal-time bands re-flow and the whole
        // layout snaps to the wider band count.
        it('add data: a new candle appears instantly and the layout snaps', async () => {
            const { before, trajectory, after } = await captureSnap(candlestickOptions(), () =>
                chart!.update({
                    ...candlestickOptions(),
                    data: [...candleData(), { date: new Date(2023, 0, 4), low: 2, open: 5, close: 7, high: 9 }],
                })
            );
            // Anti-vacuity: the candle count grew and the entrant is drawn at full size on frame 0.
            expect(candleCount(before)).toBe(3);
            expect(candleCount(after)).toBe(4);
            expect(candleCount(trajectory[0])).toBe(4);
            expectDrawnAtFullRange(trajectory[0], candleKey(trajectory[0], 'Wed Jan 04 2023'));
            // The bands genuinely re-flowed: a survivor moved a wide margin from its 3-band position, yet
            // it is already at its new x on frame 0 (snapped, not sliding across).
            const survivor = candleKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x), 'survivor rebanded').toBeGreaterThan(5);
            expect(
                Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x),
                'survivor at new band on frame 0'
            ).toBeLessThan(1);
            // The reband must not disturb the survivor's value: its body height is unchanged (the y-axis
            // is pinned, so a survivor-rescale regression could only surface as a height drift here).
            expect(
                Math.abs(after.get(survivor)!.height - before.get(survivor)!.height),
                'survivor value undisturbed'
            ).toBeLessThan(1);
            expectNoAnimation(trajectory);
        });

        // "Remove data" — the last candle leaves; the bands widen and the layout snaps.
        it('remove data: the last candle disappears instantly and the layout snaps', async () => {
            const { before, trajectory, after } = await captureSnap(candlestickOptions(), () =>
                chart!.update({ ...candlestickOptions(), data: candleData().slice(0, 2) })
            );
            // Anti-vacuity: the candle count shrank and the dropped candle is already gone on frame 0 (a
            // fade-out would keep it present and collapsing over the trajectory).
            expect(candleCount(before)).toBe(3);
            expect(candleCount(after)).toBe(2);
            expect(candleKeys(trajectory[0]).some((k) => k.startsWith('series[0]/path[Tue Jan 03 2023'))).toBe(false);
            // The survivors genuinely widened their bands, snapped in place on frame 0.
            const survivor = candleKey(before, 'Sun Jan 01 2023');
            expect(Math.abs(after.get(survivor)!.x - before.get(survivor)!.x), 'survivor rebanded').toBeGreaterThan(5);
            expect(
                Math.abs(trajectory[0].get(survivor)!.x - after.get(survivor)!.x),
                'survivor at new band on frame 0'
            ).toBeLessThan(1);
            // The reband must not disturb the survivor's value: its body height is unchanged (the y-axis
            // is pinned, so a survivor-rescale regression could only surface as a height drift here).
            expect(
                Math.abs(after.get(survivor)!.height - before.get(survivor)!.height),
                'survivor value undisturbed'
            ).toBeLessThan(1);
            expectNoAnimation(trajectory);
        });

        // Endpoint sanity guards: the (snapped) animated route must settle at exactly the pixels a static
        // render of the same options produces. In-memory pixel comparison — no new image snapshot. One
        // chart per test: the mock canvas only snapshots the first chart created.
        it('sanity: update value endpoints match static renders', async () => {
            const before = candlestickOptions();
            const data = candleData();
            data[2] = { ...data[2], close: 8, high: 9.5 };
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, {
                ...candlestickOptions(),
                data,
            });
        });

        it('sanity: add data endpoints match static renders', async () => {
            const before = candlestickOptions();
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, {
                ...candlestickOptions(),
                data: [...candleData(), { date: new Date(2023, 0, 4), low: 2, open: 5, close: 7, high: 9 }],
            });
        });

        it('sanity: remove data endpoints match static renders', async () => {
            const before = candlestickOptions();
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, {
                ...candlestickOptions(),
                data: candleData().slice(0, 2),
            });
        });
    });

    describe('gradient fill', () => {
        it('should render candlestick series with a default gradient fill', async () => {
            const options = {
                ...CANDLESTICK_OPTIONS,
                series: [
                    {
                        ...CANDLESTICK_OPTIONS.series![0],
                        item: {
                            up: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                            down: {
                                fill: {
                                    type: 'gradient',
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });

        it('should render candlestick series with a gradient fill', async () => {
            const options = {
                ...CANDLESTICK_OPTIONS,
                series: [
                    {
                        ...CANDLESTICK_OPTIONS.series![0],
                        item: {
                            up: {
                                fill: {
                                    type: 'gradient',
                                    colorStops: [
                                        {
                                            color: 'green',
                                        },
                                        {
                                            color: 'white',
                                        },
                                    ],
                                },
                            },
                            down: {
                                fill: {
                                    type: 'gradient',
                                    colorStops: [
                                        {
                                            color: 'red',
                                        },
                                        {
                                            color: 'white',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as any);
            await compareSnapshot(AgCharts.create(options as AgChartOptions));
        });
    });

    describe('Series Matching - AG-16450', () => {
        let chart: any;

        afterEach(() => {
            if (chart) {
                chart.destroy();
                (chart as unknown) = undefined;
            }
        });

        describe('Candlestick series matching', () => {
            it('should not recreate candlestick series when direction property is omitted on update', async () => {
                const options = prepareEnterpriseTestOptions({
                    data: [
                        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27 },
                        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09 },
                    ],
                    legend: { enabled: true },
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: {
                                renderer: () => 'test',
                            },
                        },
                    ],
                });

                const chartInstance = AgCharts.create(options);
                chart = deproxy(chartInstance);
                await waitForChartStability(chart);

                const seriesIdBefore = chart.series[0]?.id;
                const legendDataBefore = chart.ctx.legendManager.getData();

                // Update with identical options (direction omitted)
                await chartInstance.updateDelta({
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: {
                                renderer: () => 'test',
                            },
                        },
                    ],
                });
                await waitForChartStability(chart);

                const seriesIdAfter = chart.series[0]?.id;
                const legendDataAfter = chart.ctx.legendManager.getData();

                // Series should be the same instance (not recreated)
                expect(seriesIdAfter).toBe(seriesIdBefore);

                // Legend should still have only one item for the same series
                expect(legendDataAfter).toHaveLength(1);
                expect(legendDataBefore).toHaveLength(1);
                expect(legendDataAfter[0].seriesId).toBe(legendDataBefore[0].seriesId);

                // Verify legend visually
                const imageData = extractImageData(ctx);
                expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });

        describe('Candlestick legend regression', () => {
            it('should not accumulate legend items when updating candlestick tooltip renderer', async () => {
                const options = prepareEnterpriseTestOptions({
                    data: [
                        { year: new Date(2020, 0, 1), low: 3.07, close: 4.78, open: 6.3, high: 7.27, value: 10 },
                        { year: new Date(2021, 0, 1), low: 4.87, open: 5.8, close: 6.66, high: 7.09, value: 20 },
                    ],
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: { renderer: () => 'tooltip 1' },
                        },
                        { type: 'line', xKey: 'year', yKey: 'value', yName: 'Value' },
                    ],
                });

                const chartInstance = AgCharts.create(options);
                chart = deproxy(chartInstance);
                await waitForChartStability(chart);

                const legendDataBefore = chart.ctx.legendManager.getData();
                expect(legendDataBefore).toHaveLength(2);

                // Update candlestick tooltip renderer multiple times
                await chartInstance.updateDelta({
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: { renderer: () => 'tooltip 1' },
                        },
                        { type: 'line', xKey: 'year', yKey: 'value', yName: 'Value' },
                    ],
                });
                await waitForChartStability(chart);

                let legendDataAfter = chart.ctx.legendManager.getData();
                expect(legendDataAfter).toHaveLength(2);

                await chartInstance.updateDelta({
                    series: [
                        {
                            type: 'candlestick',
                            xKey: 'year',
                            lowKey: 'low',
                            openKey: 'open',
                            closeKey: 'close',
                            highKey: 'high',
                            tooltip: { renderer: () => 'tooltip 2' },
                        },
                        { type: 'line', xKey: 'year', yKey: 'value', yName: 'Value' },
                    ],
                });
                await waitForChartStability(chart);

                legendDataAfter = chart.ctx.legendManager.getData();

                // Should still have exactly 2 items (no accumulation)
                expect(legendDataAfter).toHaveLength(2);

                // Verify no duplicate series IDs
                const seriesIds = legendDataAfter.map((d: any) => d.seriesId);
                const uniqueSeriesIds = new Set(seriesIds);
                expect(uniqueSeriesIds.size).toBe(2);

                // Verify legend visually shows exactly 2 items
                const imageData = extractImageData(ctx);
                expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });
    });
});
