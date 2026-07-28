import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    type AgPolarChartOptions,
    type AgRadialBarSeriesOptions,
    type AgRadialSeriesItemStylerParams,
    type AgRadialSeriesStyle,
    type AgRadialSeriesStylerParams,
} from 'ag-charts-community';
import {
    BIG,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    type MockRadialColumnStyler,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectProgresses,
    expectSceneTrajectory,
    expectWarningsCalls,
    hoverAction,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';

import { mockCssVarColorSupport, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';

describe('RadialBarSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();
    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        title: {
            text: `Night & Gale Inc revenue by product category`,
        },
        subtitle: {
            text: 'in million U.S. dollars',
        },
        data: [
            { quarter: `Q1'22`, 'Mountain air': 4.35, 'Polar winds': 2.14, 'Donut holes': 3.91 },
            { quarter: `Q2'22`, 'Mountain air': 4.28, 'Polar winds': 3.13, 'Donut holes': 3.04 },
            { quarter: `Q3'22`, 'Mountain air': 4.14, 'Polar winds': 3.34, 'Donut holes': 3.18 },
            { quarter: `Q4'22`, 'Mountain air': 3.48, 'Polar winds': 3.56, 'Donut holes': 3.61 },
            { quarter: `Q1'23`, 'Mountain air': 3.35, 'Polar winds': 3.14, 'Donut holes': 3.91 },
            { quarter: `Q2'23`, 'Mountain air': 3.28, 'Polar winds': 3.13, 'Donut holes': 3.54 },
            { quarter: `Q3'23`, 'Mountain air': 3.14, 'Polar winds': 2.84, 'Donut holes': 3.18 },
            { quarter: `Q4'23`, 'Mountain air': 2.48, 'Polar winds': 2.46, 'Donut holes': 3.21 },
        ],
        series: [
            {
                type: 'radial-bar',
                angleKey: 'Mountain air',
                radiusKey: 'quarter',
            },
            {
                type: 'radial-bar',
                angleKey: 'Polar winds',
                radiusKey: 'quarter',
            },
            {
                type: 'radial-bar',
                angleKey: 'Donut holes',
                radiusKey: 'quarter',
            },
        ],
    };

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    it(`should render radial bar chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radial bar chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                angle: {
                    type: 'angle-number',
                    reverse: true,
                },
                radius: {
                    type: 'radius-category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial bar as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
            axes: {
                angle: {
                    type: 'angle-number',
                    reverse: true,
                },
                radius: {
                    type: 'radius-category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked radial bar with per-series data as expected`, async () => {
        const { data, series, ...exampleOptions } = EXAMPLE_OPTIONS;
        const options: AgChartOptions = {
            ...exampleOptions,
            series: series?.map((s) => {
                return {
                    ...s,
                    stacked: true,
                    data: [...(data ?? [])],
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
            axes: { angle: { type: 'angle-number', nice: false }, radius: { type: 'radius-category' } },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
            axes: {
                angle: { type: 'angle-number', nice: false, reverse: true },
                radius: { type: 'radius-category', reverse: true },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render single datum radial bar as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: EXAMPLE_OPTIONS.data?.slice(0, 1),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    // The public animation data actions — initial load, add/remove/update data — asserted over the whole
    // animation trajectory (see the animation-trajectory-tests rule) rather than as per-ratio image
    // snapshots. Only the empty→ready reveal animates: each bar sweeps its angular span out from a shared
    // start-angle anchor (the angle-axis origin) while its radius band holds. A data update, add, or
    // partial remove on an already-populated series snaps to the settled state with no tween.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        type Row = { quarter: string; air: number; winds: number };
        const RB_DATA: Row[] = [
            { quarter: `Q1'22`, air: 4.35, winds: 2.14 },
            { quarter: `Q2'22`, air: 4.28, winds: 3.13 },
            { quarter: `Q3'22`, air: 4.14, winds: 3.34 },
            { quarter: `Q4'22`, air: 3.48, winds: 3.56 },
        ];
        // A pinned angle axis keeps the value→angle scaling fixed across data mutations, so a bar's span
        // tracks its value directly and the radius bands only re-layout when categories are added/removed.
        const radialBarOptions = (data: Row[] = RB_DATA): AgPolarChartOptions =>
            prepareEnterpriseTestOptions<AgPolarChartOptions>({
                data: [...data],
                series: [
                    { type: 'radial-bar', angleKey: 'air', radiusKey: 'quarter' },
                    { type: 'radial-bar', angleKey: 'winds', radiusKey: 'quarter' },
                ],
                axes: {
                    angle: { type: 'angle-number', min: 0, max: 10, nice: false },
                    radius: { type: 'radius-category' },
                },
                legend: { enabled: true },
            });
        const grow = (data: Row[]) => data.map((d) => ({ ...d, air: d.air * 1.8 }));

        const sectorEntries = (sample: SceneGeometrySample) =>
            [...sample].filter(([key]) => /^series\[\d+\]\/sector\[/.test(key));
        const sectorCount = (sample: SceneGeometrySample) => sectorEntries(sample).length;
        const spanOf = (sample: SceneGeometrySample, key: string): number | undefined => {
            const s = sample.get(key);
            return s == null ? undefined : s.endAngle - s.startAngle;
        };
        const spans = (trajectory: SceneGeometrySample[], key: string): number[] =>
            trajectory.map((f) => spanOf(f, key)).filter((v): v is number => v != null && Number.isFinite(v));
        const maxSpan = (sample: SceneGeometrySample) =>
            Math.max(...sectorEntries(sample).map(([, v]) => v.endAngle - v.startAngle));
        // The per-bar labels start collapsed at opacity ~0 on the first captured frame, so the
        // trailing-phase fade-in specs cannot pass vacuously — a regression that snapped them straight
        // to full opacity would trip this.
        const expectLabelsStartHidden = (trajectory: SceneGeometrySample[]) => {
            const hidden = [...trajectory[0]].filter(([key]) => /^series\[\d+\]\/labels\/text\[.+\]$/.test(key));
            expect(hidden.length, 'label nodes at frame 0').toBeGreaterThan(0);
            for (const [key, props] of hidden) {
                expect(props.opacity, `${key} opacity at frame 0`).toBeLessThanOrEqual(0.01);
            }
        };

        it('initial load: each bar sweeps its span from a shared start-angle anchor', async () => {
            const proxy = AgCharts.create(radialBarOptions());
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const sectorKeys = sectorEntries(sampleScene()).map(([key]) => key);
            expect(sectorKeys).toHaveLength(8);

            // Every bar advances by one shared sweep fraction on each frame — the desync detector.
            const barsSweepInSync: SceneFrameInvariant = {
                name: 'all bars share one angular sweep fraction',
                check: (frame) => {
                    const fractions: number[] = [];
                    for (const key of sectorKeys) {
                        const current = spanOf(frame, key);
                        const target = spans(trajectory, key).at(-1);
                        if (current == null || target == null || target < 0.2) continue;
                        fractions.push(current / target);
                    }
                    if (fractions.length < 2) return undefined;
                    const spread = Math.max(...fractions) - Math.min(...fractions);
                    return spread > 0.1 ? `sweep fractions desynced by ${spread.toFixed(3)}` : undefined;
                },
            };

            // Each bar's endAngle sweeps out during 'initial' from the fixed startAngle anchor; the anchor
            // and the radius band (unlisted props) hold constant. The per-bar labels fade in during the
            // trailing phase, after the sweep.
            const angularSweep = {
                startAngle: 'constant',
                endAngle: { during: 'initial', expect: ['increases', 'bounded'] },
            } as const;
            const labelFadeIn = {
                opacity: { during: 'trailing', expect: ['increases', 'bounded'] },
                x: 'any',
                y: 'any',
            } as const;
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[*]': angularSweep,
                    'series[1]/sector[*]': angularSweep,
                    'series[0]/labels/text[*]': labelFadeIn,
                    'series[1]/labels/text[*]': labelFadeIn,
                },
                { frameInvariants: [barsSweepInSync] }
            );
            expectLabelsStartHidden(trajectory);

            // Anti-vacuity: every bar's span starts collapsed (~0) at the anchor and sweeps to a real
            // angle — a snap regression would show frame 0 already at the target span.
            for (const key of sectorKeys) {
                const span = spans(trajectory, key);
                expect(span[0], `${key} span collapsed at frame 0`).toBeLessThanOrEqual(0.02);
                expectMonotonic(span, 'increasing');
                expectProgresses(span);
                expect(span.at(-1)! - span[0], `${key} angular sweep`).toBeGreaterThan(0.2);
            }
        });

        it('update data: value changes snap into place without a tween', async () => {
            const options = radialBarOptions();
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: grow(RB_DATA) } as AgPolarChartOptions)
            );
            // The update actually swept the air bars wider (anti-vacuity for the snap assertion)...
            expect(maxSpan(after) - maxSpan(before), 'bars swept wider').toBeGreaterThan(0.5);
            // ...and the whole scene held constant across the captured frames: it landed fully formed on
            // frame 0 with no tween anywhere (a regression that tweened the sweep would break this).
            expectSceneTrajectory(trajectory);
        });

        it('add data: new bars appear fully formed without animating in', async () => {
            const options = radialBarOptions();
            const proxy = AgCharts.create({ ...options, data: RB_DATA.slice(0, 3) } as AgPolarChartOptions);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: [...RB_DATA] } as AgPolarChartOptions)
            );
            expect(sectorCount(before), 'three quarters before').toBe(6);
            expect(sectorCount(after), 'four quarters after').toBe(8);
            expect(sectorCount(trajectory[0]), 'added bars present from frame 0').toBe(8);
            expectSceneTrajectory(trajectory);
        });

        it('remove data: dropped bars disappear without collapsing', async () => {
            const options = radialBarOptions();
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: RB_DATA.slice(0, 3) } as AgPolarChartOptions)
            );
            expect(sectorCount(before), 'four quarters before').toBe(8);
            expect(sectorCount(after), 'three quarters after').toBe(6);
            expect(sectorCount(trajectory[0]), 'dropped bars gone from frame 0').toBe(6);
            expectSceneTrajectory(trajectory);
        });

        // Endpoint sanity guards: the animated reveal into `before` and the snapped transition into
        // `after` must settle at exactly the pixels a non-animated render of the same options produces.
        it('sanity: update-data endpoints match static renders', async () => {
            const before = radialBarOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: grow(RB_DATA),
            });
        });

        it('sanity: add-data endpoints match static renders', async () => {
            const before = { ...radialBarOptions(), data: RB_DATA.slice(0, 3) } as AgPolarChartOptions;
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...radialBarOptions(),
                data: [...RB_DATA],
            });
        });

        it('sanity: remove-data endpoints match static renders', async () => {
            const before = radialBarOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: RB_DATA.slice(0, 3),
            });
        });
    });

    describe('gradient fill', () => {
        it('should render radial bar series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-bar',
                        angleKey: 'Mountain air',
                        radiusKey: 'quarter',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial bar series with a gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-bar',
                        angleKey: 'Mountain air',
                        radiusKey: 'quarter',
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                {
                                    color: '#080',
                                },
                                {
                                    color: '#fff',
                                },
                            ],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial bar series with a series bound gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-bar',
                        angleKey: 'Mountain air',
                        radiusKey: 'quarter',
                        fill: {
                            type: 'gradient',
                            bounds: 'series',
                            colorStops: [
                                {
                                    color: '#080',
                                },
                                {
                                    color: '#fff',
                                },
                            ],
                        },
                    } as AgRadialBarSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    test('AG-8290 label boxing', async () => {
        const options = prepareEnterpriseTestOptions({
            data: [
                { department: 'Sales', quality: 40, efficiency: 75 },
                { department: 'Engineering', quality: 45, efficiency: 90 },
                { department: 'HR', quality: 80, efficiency: 60 },
                { department: 'Marketing', quality: 80, efficiency: 60 },
                { department: 'Finance', quality: 85, efficiency: 50 },
            ],
            series: [
                {
                    type: 'radial-bar',
                    radiusKey: 'department',
                    angleKey: 'quality',
                    label: {
                        fontWeight: 'bold',
                        padding: 5,
                        border: { strokeWidth: 3, stroke: 'lightblue' },
                        fill: 'lightgrey',
                        fillOpacity: 0.7,
                        cornerRadius: 10,
                    },
                },
            ],
        });

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-15782 styler', () => {
        type D = { quarter: string; sw: number; hw: number };
        type C = unknown;
        type O = AgPolarChartOptions<D, C>;
        type M = MockRadialColumnStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        let data: D[];

        beforeEach(() => {
            data = [
                { quarter: `Q1'22`, sw: 4.35, hw: 2.14 },
                { quarter: `Q2'22`, sw: 4.28, hw: 3.13 },
                { quarter: `Q3'22`, sw: 4.14, hw: 3.34 },
                { quarter: `Q4'22`, sw: 3.48, hw: 3.56 },
                { quarter: `Q1'23`, sw: 3.35, hw: 3.14 },
                { quarter: `Q2'23`, sw: 3.28, hw: 3.13 },
                { quarter: `Q3'23`, sw: 3.14, hw: 2.84 },
                { quarter: `Q4'23`, sw: 2.48, hw: 2.46 },
            ];
            styler = newFreezableMock<D, C, M>(
                (params: AgRadialSeriesStylerParams<D, C>): AgRadialSeriesStyle | undefined => {
                    if (params.angleKey === 'sw') {
                        return {
                            fill: 'cyan',
                            lineDash: [7, 2],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 3,
                            strokeOpacity: 0.5,
                        };
                    }
                    if (params.angleKey === 'hw')
                        return {
                            fill: 'hotpink',
                            stroke: 'darkmagenta',
                            strokeWidth: 4,
                        };
                    return {};
                }
            );
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'software context 1' };
                c2 = { name: 'hardware context 2' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        legend: { position: 'left' },
                        series: [
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'sw',
                                angleName: 'Software',
                                context: c1,
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'hw',
                                context: c2,
                                stroke: 'CornflowerBlue', // ignored
                                strokeOpacity: 0.5, // not ignored
                                strokeWidth: 15, // ignored
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
            describe('callbacks', () => {
                test('context', () => {
                    styler.expect().nthCalledWithContext(0, c1);
                    styler.expect().nthCalledWithContext(1, c2);
                    styler.expect().toHaveBeenCalledTimes(2);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler = (params: AgRadialSeriesItemStylerParams<D, C>): AgRadialSeriesStyle => {
                    if (params.angleKey === 'sw' && params.datum.quarter === `Q1'22`) {
                        return { fill: 'lightskyblue', stroke: 'deepskyblue' };
                    }
                    if (params.angleKey === 'hw' && params.datum.quarter === `Q3'23`) {
                        return { fill: 'darkkhaki', strokeWidth: 1, strokeOpacity: 1 };
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        legend: { position: 'left' },
                        series: [
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'sw',
                                angleName: 'Software',
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'hw',
                                stroke: 'CornflowerBlue', // ignored
                                strokeOpacity: 0.5, // not ignored
                                strokeWidth: 15, // ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('gradient-pattern', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        legend: { position: 'left' },
                        series: [
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'sw',
                                angleName: 'Software',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'hw',
                                styler: () => {
                                    return { fill: { type: 'pattern' } };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                await compare();
            });
        });
        describe('highlights', () => {
            // Manual-test version available at radial-bar-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        legend: { position: 'left' },
                        series: [
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'sw',
                                angleName: 'Software',
                                styler: styler.frozen,
                            },
                            {
                                type: 'radial-bar',
                                radiusKey: 'quarter',
                                angleKey: 'hw',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 100, y: 100 } as const;
            const series0datum0 = { x: 508, y: 300 } as const;
            const series0datum2 = { x: 559, y: 300 } as const;
            const series1datum0 = { x: 515, y: 275 } as const;
            const legendItem0 = { x: 50, y: 290 } as const;
            const legendItem1 = { x: 50, y: 311 } as const;

            describe('single', () => {
                async function testHover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                }
                test('miss', async () => testHover(miss));
                test('series[0].datum[0]', async () => testHover(series0datum0));
                test('series[0].datum[2]', async () => testHover(series0datum2));
                test('series[1].datum[0]', async () => testHover(series1datum0));
                test('legendItem[0]', async () => testHover(legendItem0));
                test('legendItem[1]', async () => testHover(legendItem1));
            });
            describe('sequenced', () => {
                async function hover(p: { readonly x: number; readonly y: number }) {
                    await hoverAction(p.x, p.y)(chart);
                    await waitForChartStability(chart);
                }
                function popCalls() {
                    const result = [...styler.mock.mock.calls];
                    styler.mock.mockClear();
                    return result;
                }
                test('1', async () => {
                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series0datum0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series0datum2);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(series1datum0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(miss);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(legendItem0);
                    expect(popCalls()).toMatchSnapshot();

                    await hover(legendItem1);
                    // Wait for delayed unhighlights to complete
                    await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
                    expect(popCalls()).toMatchSnapshot();
                });
            });
        });
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { quarter: `Q1'22`, revenue: 4.35, status: 1 },
            { quarter: `Q2'22`, revenue: 4.28, status: 1 },
            { quarter: `Q3'22`, revenue: 4.14, status: 1 },
            { quarter: `Q4'22`, revenue: 3.48, status: 2 },
            { quarter: `Q3'23`, revenue: 3.14, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { quarter: `Q4'23`, revenue: 2.48, status: 1 },
        ];

        const DATA2 = [
            { quarter: `Q1'23`, revenue: 3.35, status: 2 },
            { quarter: `Q2'23`, revenue: 3.28, status: 1 },
            { quarter: `Q3'23`, revenue: 3.14, status: 2 },
        ];

        const TEST_OPTIONS: AgChartOptions<
            { quarter: string; revenue: number; status: number },
            { colors: Record<number, string> }
        > = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'radial-bar',
                    radiusKey: 'quarter',
                    angleKey: 'revenue',
                    label: { formatter: ({ datum, context }) => context?.colors[datum.status] ?? 'none' },
                    itemStyler: ({ datum, context }) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...TEST_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });

    describe('AG-17875 itemStyler CSS variable resolution', () => {
        it('resolves a CSS variable fill returned from itemStyler to its computed colour', async () => {
            const container = document.createElement('div');
            const restoreCssVarColorSupport = mockCssVarColorSupport(container, { '--my-color': 'rgb(0, 128, 0)' });
            try {
                const options: AgChartOptions = {
                    data: [{ quarter: `Q1'22`, revenue: 4.35 }],
                    series: [
                        {
                            type: 'radial-bar',
                            radiusKey: 'quarter',
                            angleKey: 'revenue',
                            itemStyler: () => ({ fill: 'var(--my-color)' }),
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options, container);

                chart = deproxy(AgCharts.create(options));
                await waitForChartStability(chart);

                const series = chart.series[0];
                const [sector] = series.getItemNodes();

                expect(sector.fill).toBe('rgb(0, 128, 0)');
            } finally {
                restoreCssVarColorSupport();
            }
        });
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [{ x: 'Value', s1: 100, s2: 200, s3: 300 }],
                series: [
                    { type: 'radial-bar', radiusKey: 'x', angleKey: 's1', angleName: 'series 1' },
                    { type: 'radial-bar', radiusKey: 'x', angleKey: 's2', angleName: 'series 2' },
                    { type: 'radial-bar', radiusKey: 'x', angleKey: 's3', angleName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const RADIAL_BAR_NULL_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_BAR_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADIAL_BAR_NULL_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radial-bar',
                    radiusKey: 'category',
                    angleKey: 'value',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...RADIAL_BAR_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [RadialBarSeries-1 / radiusValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADIAL_BAR_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADIAL_BAR_NULL_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('undefined category key', () => {
        const RADIAL_BAR_UNDEFINED_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: undefined, value: 20 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_BAR_NULL_AND_UNDEFINED_KEYS_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: undefined, value: 25 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADIAL_BAR_UNDEFINED_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radial-bar',
                    radiusKey: 'category',
                    angleKey: 'value',
                },
            ],
        };

        const RADIAL_BAR_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: RADIAL_BAR_NULL_AND_UNDEFINED_KEYS_DATA,
            series: [
                {
                    type: 'radial-bar',
                    radiusKey: 'category',
                    angleKey: 'value',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...RADIAL_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [RadialBarSeries-1 / radiusValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADIAL_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADIAL_BAR_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories', async () => {
            const options: AgChartOptions = {
                ...RADIAL_BAR_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...RADIAL_BAR_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });
    });

    describe('bigint values (AG-16608)', () => {
        const polarAxes = {
            angle: { type: 'angle-number' as const },
            radius: { type: 'radius-category' as const },
        };
        const plainData = [
            { quarter: 'Q1', value: BIG },
            { quarter: 'Q2', value: BIG * 2n },
            { quarter: 'Q3', value: BIG * 3n },
        ];
        const pairedData = [
            { quarter: 'Q1', value: BIG, value2: BIG * 2n },
            { quarter: 'Q2', value: BIG * 2n, value2: BIG * 3n },
            { quarter: 'Q3', value: BIG * 3n, value2: BIG },
        ];

        it('renders a plain radial-bar series with out-of-safe-range bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: plainData,
                    series: [{ type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter' }],
                    axes: polarAxes,
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders a stacked radial-bar series with bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: pairedData,
                    series: [
                        { type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter', stacked: true },
                        { type: 'radial-bar', angleKey: 'value2', radiusKey: 'quarter', stacked: true },
                    ],
                    axes: polarAxes,
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders a grouped radial-bar series with bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: pairedData,
                    series: [
                        { type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter', grouped: true },
                        { type: 'radial-bar', angleKey: 'value2', radiusKey: 'quarter', grouped: true },
                    ],
                    axes: polarAxes,
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders a 100%-stacked radial-bar series with bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: pairedData,
                    series: [
                        {
                            type: 'radial-bar',
                            angleKey: 'value',
                            radiusKey: 'quarter',
                            stacked: true,
                            normalizedTo: 100,
                        },
                        {
                            type: 'radial-bar',
                            angleKey: 'value2',
                            radiusKey: 'quarter',
                            stacked: true,
                            normalizedTo: 100,
                        },
                    ],
                    axes: polarAxes,
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        // Guards the bigint grid-tick sort on the value (angle-number) axis.
        it('renders bigint values on an explicit angle-number axis without warnings (grid tick sort)', async () => {
            const options: AgPolarChartOptions = {
                data: [
                    { category: 'A', value: BIG },
                    { category: 'B', value: BIG * 2n },
                    { category: 'C', value: BIG * 3n },
                ],
                series: [{ type: 'radial-bar', angleKey: 'value', radiusKey: 'category' }],
                axes: { angle: { type: 'angle-number' }, radius: { type: 'radius-category' } },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });

    // Magnitude-invariance is omitted: the angle-number scale routes through Number, so MAX_VALUE-scaling overflows it.
});
