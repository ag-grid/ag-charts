import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    type AgNightingaleSeriesOptions,
    type AgPolarChartOptions,
    type AgRadialSeriesItemStylerParams,
    type AgRadialSeriesStyle,
    type AgRadialSeriesStylerParams,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    type MockNightingaleStyler,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    clickAction,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    doubleClickAction,
    doubleTapAction,
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
    tapAction,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('NightingaleSeries', () => {
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
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Mountain air',
            },
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Polar winds',
            },
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Donut holes',
            },
        ],
    };

    const compare = async (customSnapshotIdentifier?: string) => {
        await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, customSnapshotIdentifier });
    };

    it(`should render stacked nightingale chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked nightingale chart with data per series as expected`, async () => {
        const { data, series, ...exampleOptions } = EXAMPLE_OPTIONS;
        const options: AgChartOptions = {
            ...exampleOptions,
            series: series?.map((s) => ({ ...s, data: [...(data ?? [])] })),
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render stacked nightingale chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render grouped nightingale as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    grouped: true,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render grouped nightingale as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    grouped: true,
                };
            }),
            axes: {
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized nightingale as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    normalizedTo: 100,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized nightingale as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    normalizedTo: 100,
                };
            }),
            axes: {
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-14232 legend toggling', () => {
        const xs = [300, 400, 500] as const;
        const y = 570;
        beforeEach(async () => {
            const options: AgChartOptions = {
                animation: { enabled: true, duration: 0 }, // AG-14232: There's a bug with nightingale `animation.enabled = false`
                data: [
                    { quarter: `Q1'22`, software: 4.35, hardware: 2.14, services: 3.91 },
                    { quarter: `Q2'22`, software: 4.28, hardware: 3.13, services: 3.04 },
                    { quarter: `Q3'22`, software: 4.14, hardware: 3.34, services: 3.18 },
                    { quarter: `Q4'22`, software: 3.48, hardware: 3.56, services: 3.61 },
                ],
                series: [
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'software' },
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'hardware' },
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'services' },
                ],
            };
            chart = AgCharts.create(prepareEnterpriseTestOptions(options));
            await waitForChartStability(chart);
            await clickAction(400, 300)(chart); // interrupt animation
        });
        describe('click', () => {
            for (const x of xs) {
                test(`mouse {x: ${x}, y: ${y}}`, async () => {
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`);
                    await clickAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-click-${x}`);
                    await clickAction(x, y)(chart);
                    // Clear highlight state to match initial state (legend click sets highlight when toggling back on)
                    const chartInstance = deproxy(chart);
                    for (const { legend } of chartInstance.modulesManager.legends()) {
                        chartInstance.ctx.highlightManager.updateHighlight((legend as any).id);
                    }
                    await waitForChartStability(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`);
                });
            }
            for (const x of xs) {
                test(`touch {x: ${x}, y: ${y}}`, async () => {
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`);
                    await tapAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-click-${x}`);
                    await tapAction(x, y)(chart);
                    // Clear highlight state to match initial state (legend click sets highlight when toggling back on)
                    const chartInstance = deproxy(chart);
                    for (const { legend } of chartInstance.modulesManager.legends()) {
                        chartInstance.ctx.highlightManager.updateHighlight((legend as any).id);
                    }
                    await waitForChartStability(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`);
                });
            }
        });
        describe('dblclick', () => {
            for (const x of xs) {
                test(`mouse {x: ${x}, y: ${y}}`, async () => {
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`);
                    await doubleClickAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-dblclick-${x}`);
                });
            }
            for (const x of xs) {
                test(`touch {x: ${x}, y: ${y}}`, async () => {
                    await compare(`nightingale-test-ts-nightingale-series-legend-All`);
                    await doubleTapAction(x, y)(chart);
                    await compare(`nightingale-test-ts-nightingale-series-legend-dblclick-${x}`);
                });
            }
        });
    });

    // The public animation data actions — initial load, add/remove/update data — asserted over the whole
    // animation trajectory (see the animation-trajectory-tests rule) rather than as per-ratio image
    // snapshots. Only the empty→ready reveal animates: each wedge grows radially from a collapsed centre
    // (outerRadius 0 → target) while its fixed angular slice holds. A data update, add, or partial remove
    // on an already-populated series snaps to the settled state with no tween — the snap CASEs pin that.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        type Row = { quarter: string; air: number; winds: number };
        const NG_DATA: Row[] = [
            { quarter: `Q1'22`, air: 4.35, winds: 2.14 },
            { quarter: `Q2'22`, air: 4.28, winds: 3.13 },
            { quarter: `Q3'22`, air: 4.14, winds: 3.34 },
            { quarter: `Q4'22`, air: 3.48, winds: 3.56 },
        ];
        // A pinned radius axis keeps the scaling fixed across data mutations, so only the marks move.
        const nightingaleOptions = (data: Row[] = NG_DATA): AgPolarChartOptions =>
            prepareEnterpriseTestOptions<AgPolarChartOptions>({
                data: [...data],
                series: [
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'air', radiusName: 'Air' },
                    { type: 'nightingale', angleKey: 'quarter', radiusKey: 'winds', radiusName: 'Winds' },
                ],
                axes: {
                    angle: { type: 'angle-category' },
                    radius: { type: 'radius-number', min: 0, max: 10, nice: false },
                },
                legend: { enabled: true },
            });
        const grow = (data: Row[]) => data.map((d) => ({ ...d, air: d.air * 1.8 }));

        const sectorEntries = (sample: SceneGeometrySample) =>
            [...sample].filter(([key]) => /^series\[\d+\]\/sector\[/.test(key));
        const sectorCount = (sample: SceneGeometrySample) => sectorEntries(sample).length;
        const outerRadiusOf = (sample: SceneGeometrySample, key: string) => sample.get(key)?.outerRadius;
        const radii = (trajectory: SceneGeometrySample[], key: string): number[] =>
            trajectory.map((f) => outerRadiusOf(f, key)).filter((v): v is number => v != null && Number.isFinite(v));
        const maxRadius = (sample: SceneGeometrySample) =>
            Math.max(...sectorEntries(sample).map(([, v]) => v.outerRadius));
        // The per-wedge labels start collapsed at opacity ~0 on the first captured frame, so the
        // trailing-phase fade-in specs cannot pass vacuously — a regression that snapped them straight
        // to full opacity would trip this.
        const expectLabelsStartHidden = (trajectory: SceneGeometrySample[]) => {
            const hidden = [...trajectory[0]].filter(([key]) => /^series\[\d+\]\/labels\/text\[.+\]$/.test(key));
            expect(hidden.length, 'label nodes at frame 0').toBeGreaterThan(0);
            for (const [key, props] of hidden) {
                expect(props.opacity, `${key} opacity at frame 0`).toBeLessThanOrEqual(0.01);
            }
        };

        it('initial load: every wedge grows radially from a collapsed centre', async () => {
            const proxy = AgCharts.create(nightingaleOptions());
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const sectorKeys = sectorEntries(sampleScene()).map(([key]) => key);
            expect(sectorKeys).toHaveLength(8);

            // Every wedge advances by one shared growth fraction on each frame — the desync detector.
            const wedgesGrowInSync: SceneFrameInvariant = {
                name: 'all wedges share one radial growth fraction',
                check: (frame) => {
                    const fractions: number[] = [];
                    for (const key of sectorKeys) {
                        const current = outerRadiusOf(frame, key);
                        const target = radii(trajectory, key).at(-1);
                        if (current == null || target == null || target < 20) continue;
                        fractions.push(current / target);
                    }
                    if (fractions.length < 2) return undefined;
                    const spread = Math.max(...fractions) - Math.min(...fractions);
                    return spread > 0.1 ? `growth fractions desynced by ${spread.toFixed(3)}` : undefined;
                },
            };

            // Each wedge grows radially during 'initial' — its outer edge sweeps out and, for the
            // radially-stacked outer series, its inner edge tracks the series beneath it. The angular
            // slice holds fixed; the per-wedge labels fade in during the trailing phase, after the growth.
            const radialGrowth = {
                startAngle: 'constant',
                endAngle: 'constant',
                innerRadius: { during: 'initial', expect: ['increases', 'bounded'] },
                outerRadius: { during: 'initial', expect: ['increases', 'bounded'] },
            } as const;
            const labelFadeIn = {
                opacity: { during: 'trailing', expect: ['increases', 'bounded'] },
                x: 'any',
                y: 'any',
            } as const;
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[*]': radialGrowth,
                    'series[1]/sector[*]': radialGrowth,
                    'series[0]/labels/text[*]': labelFadeIn,
                    'series[1]/labels/text[*]': labelFadeIn,
                },
                { frameInvariants: [wedgesGrowInSync] }
            );
            expectLabelsStartHidden(trajectory);

            // Anti-vacuity: every wedge starts collapsed at the centre (~0) and grows to a real radius —
            // a snap regression would show frame 0 already at the target.
            for (const key of sectorKeys) {
                const radius = radii(trajectory, key);
                expect(radius[0], `${key} collapsed at frame 0`).toBeLessThanOrEqual(1);
                expectMonotonic(radius, 'increasing');
                expectProgresses(radius);
                expect(radius.at(-1)! - radius[0], `${key} radial growth`).toBeGreaterThan(20);
            }
        });

        it('update data: value changes snap into place without a tween', async () => {
            const options = nightingaleOptions();
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: grow(NG_DATA) } as AgPolarChartOptions)
            );
            // The update actually grew the air wedges (anti-vacuity for the snap assertion)...
            expect(maxRadius(after) - maxRadius(before), 'wedges grew').toBeGreaterThan(20);
            // ...and the whole scene held constant across the captured frames: it landed fully formed on
            // frame 0 with no tween anywhere (a regression that tweened the growth would break this).
            expectSceneTrajectory(trajectory);
        });

        it('add data: new wedges appear fully formed without animating in', async () => {
            const options = nightingaleOptions();
            const proxy = AgCharts.create({ ...options, data: NG_DATA.slice(0, 3) } as AgPolarChartOptions);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: [...NG_DATA] } as AgPolarChartOptions)
            );
            expect(sectorCount(before), 'three quarters before').toBe(6);
            expect(sectorCount(after), 'four quarters after').toBe(8);
            expect(sectorCount(trajectory[0]), 'added wedges present from frame 0').toBe(8);
            expectSceneTrajectory(trajectory);
        });

        it('remove data: dropped wedges disappear without collapsing', async () => {
            const options = nightingaleOptions();
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: NG_DATA.slice(0, 3) } as AgPolarChartOptions)
            );
            expect(sectorCount(before), 'four quarters before').toBe(8);
            expect(sectorCount(after), 'three quarters after').toBe(6);
            expect(sectorCount(trajectory[0]), 'dropped wedges gone from frame 0').toBe(6);
            expectSceneTrajectory(trajectory);
        });

        // Endpoint sanity guards: the animated reveal into `before` and the snapped transition into
        // `after` must settle at exactly the pixels a non-animated render of the same options produces.
        it('sanity: update-data endpoints match static renders', async () => {
            const before = nightingaleOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: grow(NG_DATA),
            });
        });

        it('sanity: add-data endpoints match static renders', async () => {
            const before = { ...nightingaleOptions(), data: NG_DATA.slice(0, 3) } as AgPolarChartOptions;
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...nightingaleOptions(),
                data: [...NG_DATA],
            });
        });

        it('sanity: remove-data endpoints match static renders', async () => {
            const before = nightingaleOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: NG_DATA.slice(0, 3),
            });
        });
    });

    describe('gradient fill', () => {
        it('should render nightingale series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
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

        it('should render nightingale series with a gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
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
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render nightingale series with an item bound gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            bounds: 'item',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgNightingaleSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render nightingale series with a linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgNightingaleSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render nightingale series with a series bound linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
                            bounds: 'series',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgNightingaleSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    test('AG-8290 legend boxing', async () => {
        const label = {
            fontWeight: 'bold',
            padding: 5,
            border: { strokeWidth: 3, stroke: 'lightblue' },
            fill: 'lightgrey',
            fillOpacity: 0.7,
            cornerRadius: 10,
        } as const satisfies NonNullable<AgNightingaleSeriesOptions['label']>;

        const options = prepareEnterpriseTestOptions({
            data: [
                { quarter: `Q1'22`, software: 4.35, hardware: 2.14, services: 3.91 },
                { quarter: `Q2'22`, software: 4.28, hardware: 3.13, services: 3.04 },
                { quarter: `Q3'22`, software: 4.14, hardware: 3.34, services: 3.18 },
                { quarter: `Q4'22`, software: 3.48, hardware: 3.56, services: 3.61 },
                { quarter: `Q1'23`, software: 3.35, hardware: 3.14, services: 3.91 },
                { quarter: `Q2'23`, software: 3.28, hardware: 3.13, services: 3.54 },
                { quarter: `Q3'23`, software: 3.14, hardware: 2.84, services: 3.18 },
                { quarter: `Q4'23`, software: 2.48, hardware: 2.46, services: 3.21 },
            ],
            series: [
                { type: 'nightingale', angleKey: 'quarter', radiusKey: 'software', label },
                { type: 'nightingale', angleKey: 'quarter', radiusKey: 'hardware', label },
                { type: 'nightingale', angleKey: 'quarter', radiusKey: 'services', label },
            ],
        });

        chart = AgCharts.create(options);
        await compare();
    });

    describe('AG-15782 styler', () => {
        type D = { quarter: string; sw: number; hw: number };
        type C = unknown;
        type O = AgPolarChartOptions<D, C>;
        type M = MockNightingaleStyler<D, C>;
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
                    if (params.radiusKey === 'sw') {
                        return {
                            fill: 'cyan',
                            lineDash: [7, 2],
                            lineDashOffset: 5,
                            stroke: 'blue',
                            strokeWidth: 7,
                            strokeOpacity: 0.5,
                        };
                    }
                    if (params.radiusKey === 'hw')
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
                        series: [
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                context: c1,
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
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
                    if (params.radiusKey === 'sw' && params.datum.quarter === `Q1'22`) {
                        return { fill: 'lightskyblue', stroke: 'deepskyblue' };
                    }
                    if (params.radiusKey === 'hw' && params.datum.quarter === `Q3'23`) {
                        return { fill: 'darkkhaki', strokeWidth: 7, strokeOpacity: 1 };
                    }
                    return {};
                };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
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
                        series: [
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
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
            // Manual-test version available at nightingale-series-test#styler-highlight-state
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: styler.frozen,
                            },
                            {
                                type: 'nightingale',
                                angleKey: 'quarter',
                                radiusKey: 'hw',
                                styler: styler.frozen,
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 100, y: 100 } as const;
            const series0datum0 = { x: 400, y: 200 } as const;
            const series0datum2 = { x: 465, y: 275 } as const;
            const series1datum0 = { x: 400, y: 120 } as const;
            const legendItem0 = { x: 375, y: 570 } as const;
            const legendItem1 = { x: 450, y: 570 } as const;

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

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [{ x: 'Value', s1: 100, s2: 200, s3: 300 }],
                series: [
                    { type: 'nightingale', angleKey: 'x', radiusKey: 's1', radiusName: 'series 1' },
                    { type: 'nightingale', angleKey: 'x', radiusKey: 's2', radiusName: 'series 2' },
                    { type: 'nightingale', angleKey: 'x', radiusKey: 's3', radiusName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const NIGHTINGALE_NULL_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: 'B', value: 15 },
        ];

        const NIGHTINGALE_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: NIGHTINGALE_NULL_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'nightingale',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...NIGHTINGALE_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [NightingaleSeries-1 / angleValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...NIGHTINGALE_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...NIGHTINGALE_NULL_CATEGORY_KEY_OPTIONS.series![0],
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
        const NIGHTINGALE_UNDEFINED_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: undefined, value: 20 },
            { category: 'B', value: 15 },
        ];

        const NIGHTINGALE_NULL_AND_UNDEFINED_KEYS_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: undefined, value: 25 },
            { category: 'B', value: 15 },
        ];

        const NIGHTINGALE_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: NIGHTINGALE_UNDEFINED_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'nightingale',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        const NIGHTINGALE_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: NIGHTINGALE_NULL_AND_UNDEFINED_KEYS_DATA,
            series: [
                {
                    type: 'nightingale',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...NIGHTINGALE_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [NightingaleSeries-1 / angleValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...NIGHTINGALE_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...NIGHTINGALE_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
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
                ...NIGHTINGALE_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...NIGHTINGALE_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
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
});
