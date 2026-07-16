import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgChartOptions,
    AgCharts,
    type AgMarkerShapeFn,
    type AgPolarChartOptions,
    type AgRadarLineSeriesOptions,
    type AgRadarLineSeriesStyle,
} from 'ag-charts-community';
import {
    BIG,
    MIN_UNHIGHLIGHT_DELAY,
    type MockRadarLineStyler,
    type PhasedPropertyExpectation,
    type SceneGeometrySample,
    clickAction,
    computeLegendBBox,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectSceneSamplesMatch,
    expectSceneTrajectory,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    looserSnapshotDefaults,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { NonNullablePath } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RadarLineSeries', () => {
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
        data: [
            { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
            { subject: 'Physics', gradeA: 4.3, gradeB: 8.5 },
            { subject: 'Biology', gradeA: 3, gradeB: 3 },
            { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
            { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
        ],
        series: [
            {
                type: 'radar-line',
                angleKey: 'subject',
                radiusKey: 'gradeA',
            },
            {
                type: 'radar-line',
                angleKey: 'subject',
                radiusKey: 'gradeB',
            },
        ],
        legend: {
            enabled: true,
        },
    };

    const compare = async (options?: MatchImageSnapshotOptions) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(options);
    };

    it(`should render polar chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with circle axes as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: { angle: { type: 'angle-category', shape: 'circle' }, radius: { type: 'radius-number' } },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart as expected with reversed circle axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                angle: {
                    type: 'angle-category',
                    shape: 'circle',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart as expected with reversed polygon axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                angle: {
                    type: 'angle-category',
                    shape: 'polygon',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should avoid polar chart label collisions`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: Array.from({ length: 95 }).map((_, i) => ({
                subject: `Subject ${i}`,
                gradeA: 2 * ((i % 5) + 1),
                gradeB: 2 * (((i + 3) % 5) + 1),
            })),
            axes: {
                angle: { type: 'angle-category', label: { avoidCollisions: true, minSpacing: 2 } },
                radius: { type: 'radius-number' },
            },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with invalid data disconnected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
                { subject: 'Physics', gradeA: undefined, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3, gradeB: 3 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
            series: EXAMPLE_OPTIONS.series!.map((series) => ({
                ...series,
                connectMissingData: false,
            })),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render polar chart with invalid data connected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
                { subject: 'Physics', gradeA: undefined, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3, gradeB: 3 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should support legend.item.showSeriesStroke`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            legend: { item: { showSeriesStroke: true } },
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });
    // Covers the radar-line -test page (radar-line-series-test) actions, asserted over the whole
    // animation trajectory (see the animation-trajectory-tests rule) rather than per-ratio snapshots.
    // Radar-line only genuinely tweens on its INITIAL reveal: the line path grows radially out from the
    // chart centre while the markers fade in behind it. Its data-swap and legend-toggle paths both
    // skipCurrentBatch (polar animation state machine), so they SNAP structurally — the page's
    // "re-tween between datasets" / "animates out and back in" wording never matched the code. The snap
    // CASEs pin that behaviour (no tween, correct end state) so a regression that started tweening them,
    // or dropped the snap, would fail.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        // The -test page's two datasets: data2 prepends one extra category (a point add on swap).
        const DATA_1 = [
            { category: 'cat 1', iphone: 18, mac: 27 },
            { category: 'cat 2', iphone: 138, mac: 35 },
            { category: 'cat 3', iphone: 107, mac: 32 },
            { category: 'cat 5', iphone: 137, mac: 26 },
        ];
        const DATA_2 = [{ category: 'cat 10', iphone: 18, mac: 27 }, ...DATA_1];

        // radiusMax pins the radius domain so a legend toggle can't rescale the surviving series — the
        // hidden series' marks then move in isolation, keeping the snap CASEs' "nothing else moved"
        // default honest.
        const radarOptions = (data: typeof DATA_1, radiusMax?: number): AgPolarChartOptions =>
            prepareEnterpriseTestOptions<AgPolarChartOptions>({
                animation: { enabled: true },
                data: [...data],
                series: [
                    { type: 'radar-line', angleKey: 'category', radiusKey: 'iphone' },
                    { type: 'radar-line', angleKey: 'category', radiusKey: 'mac' },
                ],
                axes:
                    radiusMax == null
                        ? undefined
                        : {
                              angle: { type: 'angle-category' },
                              radius: { type: 'radius-number', min: 0, max: radiusMax },
                          },
                legend: { enabled: true },
            });

        const pathKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/path/.test(k));
        const hasSeriesPath = (sample: SceneGeometrySample, seriesIndex: number) =>
            [...sample.keys()].some((k) => k.startsWith(`series[${seriesIndex}]/path`));
        const markerKeyCount = (sample: SceneGeometrySample, seriesIndex: number) =>
            [...sample.keys()].filter((k) => k.startsWith(`series[${seriesIndex}]/marker[`)).length;
        // Hiding a series flips its markers to invisible in place (the nodes stay in the scene), so a
        // toggle is measured by how many of a series' markers are actually visible, not how many exist.
        const visibleMarkerCount = (sample: SceneGeometrySample, seriesIndex: number) =>
            [...sample].filter(([k, v]) => k.startsWith(`series[${seriesIndex}]/marker[`) && v.visible === 1).length;

        // A structural snap runs no animation batch, so every captured inter-frame interval traversed no
        // phase. This is the "did not tween" contract for the data-swap and legend-toggle actions, and
        // (unlike a full-scene constancy check) it tolerates the paths' legitimately non-finite stations.
        const expectSnapped = (trajectory: SceneGeometrySample[]) => {
            const intervals = (trajectory as unknown as { phaseIntervals: unknown[][] }).phaseIntervals;
            expect(
                intervals.filter((i) => i.length > 0),
                'expected a structural snap: no animation phase ran'
            ).toEqual([]);
        };

        // The fade-in shared by every marker on the initial reveal: markers snap to opacity 0 and fade
        // back to 1 during add/trailing. Only non-vacuous alongside the frame-0 collapsed guard below —
        // a marker held at 1 throughout also satisfies increases/bounded/settlesAt.
        const markerFadeIn: PhasedPropertyExpectation = {
            during: ['add', 'trailing'],
            expect: ['increases', 'bounded'],
            settlesAt: 1,
        };

        // "Initial reveal" — the line path sweeps out from the centre (bbox grows from a collapsed point
        // during the `initial` phase) and the markers fade in during add/trailing. Both series reveal
        // identically, so the path/marker globs cover series[0] (iphone) and series[1] (mac) together.
        it('initial reveal: the line grows out from the centre and markers fade in', async () => {
            const proxy = AgCharts.create(radarOptions(DATA_1));
            chart = deproxy(proxy);
            const sampler = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampler);
            await frames.runToEnd(chart);

            // Anti-vacuity: on the first captured frame every line path is collapsed to a point (zero
            // extent) and every marker is invisible, so the growth/fade specs below cannot pass vacuously.
            const paths = pathKeys(trajectory[0]);
            expect(paths.length, 'line paths at frame 0').toBe(2);
            for (const key of paths) {
                expect(trajectory[0].get(key)!.width, `${key} width at frame 0`).toBeLessThanOrEqual(0.5);
                expect(trajectory[0].get(key)!.height, `${key} height at frame 0`).toBeLessThanOrEqual(0.5);
            }
            for (const [key, props] of trajectory[0]) {
                if (/^series\[\d+\]\/marker\[/.test(key)) {
                    expect(props.opacity, `${key} opacity at frame 0`).toBeLessThanOrEqual(0.01);
                }
            }

            const grows: PhasedPropertyExpectation = {
                during: 'initial',
                expect: ['increases', 'progresses', 'bounded'],
            };
            const recedes: PhasedPropertyExpectation = { during: 'initial', expect: ['decreases', 'bounded'] };
            // The per-station top-y crossings are non-finite while the path is collapsed (frame 0) and at
            // any frame where a station has no crossing, so they are pinned `degenerate`; the bbox
            // width/height carry the growth signal, and top@2 (the deepest station) additionally proves
            // per-point outward motion.
            const collapsedStation: PhasedPropertyExpectation = { during: 'initial', expect: ['degenerate'] };
            expectSceneTrajectory(trajectory, {
                'series[*]/path[*]': {
                    width: grows,
                    height: grows,
                    x: recedes,
                    y: recedes,
                    'top@0': collapsedStation,
                    'top@1': collapsedStation,
                    'top@2': { during: 'initial', expect: ['degenerate', 'decreases', 'progresses', 'bounded'] },
                    'top@3': collapsedStation,
                    'top@4': collapsedStation,
                },
                'series[*]/marker[*]': {
                    opacity: markerFadeIn,
                    translationX: 'constant',
                    translationY: 'constant',
                    x: 'any',
                    y: 'any',
                },
                // The datum labels fade in alongside the markers (also from opacity 0 — the frame-0 guard
                // above covers markers; labels start at 0 too, per the same add/trailing fade).
                'series[*]/labels/text[*]': {
                    opacity: { during: ['add', 'trailing'], expect: ['increases', 'bounded'] },
                    x: 'any',
                    y: 'any',
                },
            });
        });

        // "Data1 → Data2" — the swap prepends the `cat 10` category (4 → 5 points), so the series rebuild
        // their marks. The polar update path skipCurrentBatches, so this SNAPS: no animation phase runs.
        // Anti-vacuity: each series gains a marker (4 → 5) and the new `cat 10` marker is present after,
        // proving the swap actually landed rather than the trajectory being trivially still.
        it('data swap: reshapes to the new categories without tweening', async () => {
            const proxy = AgCharts.create(radarOptions(DATA_1));
            chart = deproxy(proxy);
            await frames.runToEnd(chart);
            const before = createSceneGeometrySampler(chart)();

            await proxy.update(radarOptions(DATA_2));
            const trajectory = await frames.captureAnimationFrames(chart, createSceneGeometrySampler(chart));
            await frames.runToEnd(chart);
            const after = createSceneGeometrySampler(chart)();

            expect(markerKeyCount(before, 0), 'series[0] markers before swap').toBe(4);
            expect(markerKeyCount(before, 1), 'series[1] markers before swap').toBe(4);
            expect(markerKeyCount(after, 0), 'series[0] markers after swap').toBe(5);
            expect(markerKeyCount(after, 1), 'series[1] markers after swap').toBe(5);
            expect(after.has('series[0]/marker[cat 10]'), 'new cat 10 marker present after swap').toBe(true);
            expectSnapped(trajectory);
            // End-anchor: the last captured frame is the fully-settled DATA_2 scene, so the snap landed
            // its marks at their final positions (not a wrong-but-stable layout).
            expectSceneSamplesMatch(trajectory.at(-1)!, after);
        });

        // "Data2 → Data1" — the reverse: the swap drops the `cat 10` category (5 → 4 points). Also a snap.
        it('data swap (remove): drops a category without tweening', async () => {
            const proxy = AgCharts.create(radarOptions(DATA_2));
            chart = deproxy(proxy);
            await frames.runToEnd(chart);
            const before = createSceneGeometrySampler(chart)();

            await proxy.update(radarOptions(DATA_1));
            const trajectory = await frames.captureAnimationFrames(chart, createSceneGeometrySampler(chart));
            await frames.runToEnd(chart);
            const after = createSceneGeometrySampler(chart)();

            expect(markerKeyCount(before, 0), 'series[0] markers before remove').toBe(5);
            expect(markerKeyCount(after, 0), 'series[0] markers after remove').toBe(4);
            expect(after.has('series[0]/marker[cat 10]'), 'cat 10 marker gone after remove').toBe(false);
            expectSnapped(trajectory);
            expectSceneSamplesMatch(trajectory.at(-1)!, after);
        });

        // "Toggle a legend item" — clicking a legend entry hides the series. With the radius domain pinned
        // the surviving series stays put, and the toggle SNAPS (no phase runs): the hidden series' line
        // path leaves the scene and its markers flip invisible in place, everything else holds. Re-clicking
        // restores it, again without tweening.
        it('legend toggle: the series snaps out and back in without tweening', async () => {
            const proxy = AgCharts.create(radarOptions(DATA_1, 150));
            chart = deproxy(proxy);
            await frames.runToEnd(chart);
            const sampler = createSceneGeometrySampler(chart);
            const before = sampler();
            const { x, y } = computeLegendBBox(chart);

            // Hide series[0] (the first legend item).
            await clickAction(x, y)(proxy);
            const hideTrajectory = await frames.captureAnimationFrames(chart, sampler);
            await frames.runToEnd(chart);
            const hidden = sampler();

            expect(visibleMarkerCount(before, 0), 'series[0] visible markers before hide').toBe(4);
            expect(hasSeriesPath(before, 0), 'series[0] path before hide').toBe(true);
            expect(visibleMarkerCount(hidden, 0), 'series[0] visible markers after hide').toBe(0);
            expect(hasSeriesPath(hidden, 0), 'series[0] path after hide').toBe(false);
            expectSnapped(hideTrajectory);
            // End-anchor: the hide settled at the last captured frame (converged, not mid-transition).
            expectSceneSamplesMatch(hideTrajectory.at(-1)!, hidden);
            // Positional correctness: with the radius domain pinned, hiding series[0] must not disturb the
            // surviving series[1] — every one of its markers stays at the same screen position. Compared by
            // sorted position (not by key), because hiding a sibling re-creates series[1]'s marker nodes and
            // the sampler assigns the fresh instances new keys.
            const survivorCenters = (s: SceneGeometrySample) =>
                [...s]
                    .filter(([k]) => k.startsWith('series[1]/marker['))
                    .map(([, v]) => [v.x + (v.translationX ?? 0), v.y + (v.translationY ?? 0)] as const)
                    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            const centersBefore = survivorCenters(before);
            const centersHidden = survivorCenters(hidden);
            expect(centersHidden.length, 'survivor marker count unchanged by hide').toBe(centersBefore.length);
            for (let i = 0; i < centersBefore.length; i++) {
                const drift = Math.hypot(
                    centersHidden[i][0] - centersBefore[i][0],
                    centersHidden[i][1] - centersBefore[i][1]
                );
                expect(drift, `survivor marker ${i} moved when the sibling was hidden`).toBeLessThan(0.5);
            }

            // Show series[0] again.
            await clickAction(x, y)(proxy);
            const showTrajectory = await frames.captureAnimationFrames(chart, sampler);
            await frames.runToEnd(chart);
            const shown = sampler();

            expect(visibleMarkerCount(shown, 0), 'series[0] visible markers after show').toBe(4);
            expect(hasSeriesPath(shown, 0), 'series[0] path after show').toBe(true);
            expectSnapped(showTrajectory);
            expectSceneSamplesMatch(showTrajectory.at(-1)!, shown);
        });

        // Pixel endpoint guards: the animated reveal of data1 and the data1 → data2 swap must each settle
        // at exactly the pixels a non-animated (snapped) render of the same options produces.
        it('animated endpoints match a static render (reveal + data swap)', async () => {
            const before = radarOptions(DATA_1);
            const after = radarOptions(DATA_2);
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, after);
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
                    type: 'radar-line',
                    angleKey: 'department',
                    radiusKey: 'quality',
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
        type D = { tank: number; damage: number; healer: number; trait: string };
        type C = unknown;
        type O = AgPolarChartOptions<D, C>;
        type M = MockRadarLineStyler<D, C>;
        let styler: ReturnType<typeof newFreezableMock<D, C, M>>;
        let data: D[];

        beforeEach(() => {
            const shieldPath: AgMarkerShapeFn = ({ path, x, y, size }) => {
                const s = size / 2;
                path.clear();
                path.moveTo(x + s * 0.7, y - s);
                path.lineTo(x + s * 0.7, y + s * 0.3);
                path.lineTo(x, y + s);
                path.lineTo(x - s * 0.7, y + s * 0.3);
                path.lineTo(x - s * 0.7, y - s);
                path.closePath();
            };
            data = [
                { tank: 90, damage: 70, healer: 40, trait: 'Strength' },
                { tank: 40, damage: 85, healer: 50, trait: 'Agility' },
                { tank: 35, damage: 60, healer: 95, trait: 'Intelligence' },
                { tank: 95, damage: 60, healer: 70, trait: 'Vitality' },
                { tank: 50, damage: 55, healer: 90, trait: 'Spirit' },
                { tank: 60, damage: 75, healer: 65, trait: 'Luck' },
            ];
            styler = newFreezableMock<D, C, M>((params): AgRadarLineSeriesStyle | undefined => {
                switch (params.radiusKey) {
                    case 'tank':
                        return {
                            stroke: '#3b82f6',
                            strokeWidth: 3,
                            marker: {
                                fill: '#3b82f6',
                                fillOpacity: 0.9,
                                shape: shieldPath,
                                size: 18,
                                stroke: '#1e3a8a',
                                strokeWidth: 1.5,
                            },
                        };
                    case 'damage':
                        return {
                            stroke: '#ef4444',
                            strokeWidth: 2.5,
                            strokeOpacity: 0.85,
                            lineDash: [6, 4],
                            marker: {
                                fill: '#ef4444',
                                fillOpacity: 0.85,
                                size: 14,
                                stroke: '#7f1d1d',
                                strokeWidth: 1.2,
                            },
                        };
                    case 'healer':
                        return {
                            stroke: '#10b981',
                            strokeWidth: 3,
                            strokeOpacity: 0.9,
                            lineDash: [3, 3],
                            marker: {
                                fill: '#10b981',
                                fillOpacity: 0.9,
                                shape: 'plus',
                                size: 18,
                                stroke: '#065f46',
                                strokeWidth: 1.5,
                            },
                        };
                    default:
                        break;
                }
            });
        });
        describe('init', () => {
            let c1: C;
            let c2: C;
            beforeEach(async () => {
                c1 = { name: 'healer - magic powers' };
                c2 = { name: 'tank - heavy armor' };
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radar-line',
                                context: c1,
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                stroke: 'limegreen', // ignored
                                strokeWidth: 30, // ignored
                                strokeOpacity: 0.3, // ignored
                                lineDash: [7, 7, 4, 4], // ignored
                                marker: {
                                    fill: 'mediumseagreen', // ignored
                                    fillOpacity: 0.2, // ignored
                                    shape: 'heart', // ignored
                                    size: 40, // ignored
                                    stroke: 'seagreen', // ignored
                                    strokeWidth: 5, // ignored
                                },
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-line',
                                context: c2,
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                stroke: 'fuchsia', // ignored
                                strokeWidth: 3, // not ignored
                                strokeOpacity: 0.9, // not ignored
                                // marker should be enabled
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'damage',
                                // should use all style properties from the styler
                                marker: {}, // should be enabled, but with the styler's styling
                                styler: styler.frozen,
                            },
                        ],
                        legend: {
                            position: 'bottom',
                            item: { line: { length: 40 } },
                        },
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
                    styler.expect().nthCalledWithoutContext(2);
                    styler.expect().toHaveBeenCalledTimes(3);
                });
                test('params', () => {
                    expect(styler.mock.mock.calls).toMatchSnapshot();
                });
            });
        });
        describe('priorities', () => {
            beforeEach(async () => {
                const itemStyler: NonNullablePath<AgRadarLineSeriesOptions, 'marker', 'itemStyler'> = (params) => {
                    if (params.radiusKey === 'healer' && params.datum['trait'] === 'Intelligence') {
                        return { fill: 'gold', size: 30, stroke: 'lime' };
                    }
                    if (params.radiusKey === 'tank' && params.datum['trait'] === 'Vitality') {
                        return { fill: 'gold', size: 36, stroke: 'mediumblue' };
                    }
                    if (params.radiusKey === 'damage' && params.datum['trait'] === 'Agility') {
                        return { fill: 'gold', size: 32, strokeWidth: 3, shape: 'star' };
                    }
                };

                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                stroke: 'limegreen', // ignored
                                strokeWidth: 30, // ignored
                                strokeOpacity: 0.3, // ignored
                                lineDash: [7, 7, 4, 4], // ignored
                                marker: {
                                    itemStyler,
                                    fill: 'mediumseagreen', // ignored
                                    fillOpacity: 0.2, // ignored
                                    shape: 'heart', // ignored
                                    size: 40, // ignored
                                    stroke: 'seagreen', // ignored
                                    strokeWidth: 5, // ignored
                                },
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                stroke: 'fuchsia', // ignored
                                strokeWidth: 3, // not ignored
                                strokeOpacity: 0.9, // not ignored
                                styler: styler.frozen,
                                marker: { itemStyler },
                            },
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'damage',
                                // should use all style properties from the styler
                                styler: styler.frozen,
                                marker: { itemStyler },
                            },
                        ],
                        legend: {
                            position: 'bottom',
                            item: { line: { length: 40 } },
                        },
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
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                marker: { size: 30 },
                                styler: (): AgRadarLineSeriesStyle | undefined => {
                                    return {
                                        marker: { fill: { type: 'pattern' } },
                                    };
                                },
                            },
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                marker: { size: 30 },
                                styler: (): AgRadarLineSeriesStyle | undefined => {
                                    return {
                                        marker: { fill: { type: 'gradient' } },
                                    };
                                },
                            },
                        ],
                    })
                );
                await waitForChartStability(chart);
            });
            test('snapshot', async () => {
                // The 'pattern' fill type is rendered slightly different on GitHub CI, but the difference isn't
                // noticeable without an image-diff aid. I've counted the exact number of pixels that differ.
                await compare(looserSnapshotDefaults(0.08));
            });
        });
        describe('highlights', () => {
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'healer',
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'tank',
                                strokeWidth: 3,
                                strokeOpacity: 0.9,
                                styler: styler.frozen,
                            },
                            {
                                type: 'radar-line',
                                angleKey: 'trait',
                                radiusKey: 'damage',
                                styler: styler.frozen,
                            },
                        ],
                        legend: {
                            position: 'bottom',
                            item: { line: { length: 40 } },
                        },
                    })
                );
                await waitForChartStability(chart);
            });

            const miss = { x: 10, y: 10 } as const;
            const series0datum0 = { x: 400, y: 186 } as const;
            const series0datum2 = { x: 587, y: 385 } as const;
            const series1datum0 = { x: 400, y: 70 } as const;
            const legendItem0 = { x: 300, y: 572 } as const;
            const legendItem1 = { x: 400, y: 572 } as const;

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

    it('should dim non-highlight markers with cutout in multi-series radar line', async () => {
        const options: AgPolarChartOptions = {
            data: [
                { subject: 'Maths', gradeA: 7, gradeB: 4.2 },
                { subject: 'Physics', gradeA: 4.3, gradeB: 8.5 },
                { subject: 'Biology', gradeA: 3, gradeB: 3 },
                { subject: 'History', gradeA: 6.5, gradeB: 4.3 },
                { subject: 'P.E.', gradeA: 9.8, gradeB: 6.4 },
            ],
            series: [
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'gradeA',
                    strokeWidth: 5,
                    marker: { enabled: true, size: 28 },
                },
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'gradeB',
                    strokeWidth: 5,
                    marker: { enabled: true, size: 28 },
                },
            ],
        };

        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);

        await waitForChartStability(chart);
        await hoverAction(300, 200)(chart);
        await waitForChartStability(chart);
        await compare();
    });

    describe('AG-15743 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                data: [
                    { x: 0, s1: 100, s2: 200, s3: 300 },
                    { x: 1, s1: 100, s2: 200, s3: 300 },
                    { x: 3, s1: 100, s2: 200, s3: 300 },
                ],
                series: [
                    { type: 'radar-line', angleKey: 'x', radiusKey: 's1', radiusName: 'series 1' },
                    { type: 'radar-line', angleKey: 'x', radiusKey: 's2', radiusName: 'series 2' },
                    { type: 'radar-line', angleKey: 'x', radiusKey: 's3', radiusName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const RADAR_LINE_NULL_CATEGORY_KEY_DATA = [
            { subject: 'Maths', gradeA: 7 },
            { subject: null, gradeA: 4.3 },
            { subject: 'Biology', gradeA: 3 },
        ];

        const RADAR_LINE_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADAR_LINE_NULL_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'gradeA',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...RADAR_LINE_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [RadarLineSeries-1 / angleValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADAR_LINE_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADAR_LINE_NULL_CATEGORY_KEY_OPTIONS.series![0],
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
        const RADAR_LINE_UNDEFINED_CATEGORY_KEY_DATA = [
            { subject: 'Maths', gradeA: 7 },
            { subject: undefined, gradeA: 4.3 },
            { subject: 'Biology', gradeA: 3 },
        ];

        const RADAR_LINE_NULL_AND_UNDEFINED_KEYS_DATA = [
            { subject: 'Maths', gradeA: 7 },
            { subject: null, gradeA: 4.3 },
            { subject: undefined, gradeA: 5 },
            { subject: 'Biology', gradeA: 3 },
        ];

        const RADAR_LINE_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADAR_LINE_UNDEFINED_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'gradeA',
                },
            ],
        };

        const RADAR_LINE_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: RADAR_LINE_NULL_AND_UNDEFINED_KEYS_DATA,
            series: [
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'gradeA',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...RADAR_LINE_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [RadarLineSeries-1 / angleValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADAR_LINE_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADAR_LINE_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
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
                ...RADAR_LINE_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...RADAR_LINE_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
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

    describe('AG-17463 label.enabled toggle', () => {
        it('should hide series labels when label.enabled is toggled to false', async () => {
            const options: AgChartOptions = {
                data: [
                    { subject: 'Maths', score: 7 },
                    { subject: 'Physics', score: 4 },
                    { subject: 'Biology', score: 3 },
                    { subject: 'History', score: 6 },
                ],
                series: [
                    {
                        type: 'radar-line',
                        angleKey: 'subject',
                        radiusKey: 'score',
                        label: { enabled: true },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0];
            const labelGroup = (series as any).labelGroup;

            const countVisibleLabels = () => {
                let count = 0;
                for (const node of labelGroup.children()) {
                    if (node.visible && node.text) {
                        count++;
                    }
                }
                return count;
            };

            expect(countVisibleLabels()).toBeGreaterThan(0);

            await chart.update({
                ...options,
                series: [
                    {
                        type: 'radar-line',
                        angleKey: 'subject',
                        radiusKey: 'score',
                        label: { enabled: false },
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(countVisibleLabels()).toBe(0);
        });
    });

    describe('bigint values (AG-16608)', () => {
        // Out-of-safe-range bigint radius values that would lose precision if narrowed to Number.
        const plainData = [
            { subject: 'Maths', grade: BIG },
            { subject: 'Physics', grade: BIG * 2n },
            { subject: 'Biology', grade: BIG * 3n },
        ];

        it('renders a radar-line series with out-of-safe-range bigint radius values', async () => {
            const options: AgChartOptions = {
                data: plainData,
                series: [{ type: 'radar-line', angleKey: 'subject', radiusKey: 'grade' }],
                axes: { angle: { type: 'angle-category' }, radius: { type: 'radius-number' } },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });

    describe('all series hidden', () => {
        it('should not warn when every series is toggled off', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: (EXAMPLE_OPTIONS.series as AgRadarLineSeriesOptions[]).map((series) => ({
                    ...series,
                    visible: false,
                })),
            };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });
});
