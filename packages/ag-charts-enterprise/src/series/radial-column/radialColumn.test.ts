import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    type AgPolarChartOptions,
    type AgRadialColumnSeriesOptions,
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
    type SceneNodeExpectation,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectPixelIdenticalAcrossMagnitude,
    expectProgresses,
    expectSceneTrajectory,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    magnitudePair,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    stripAxes,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';

describe('RadialColumnSeries', () => {
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
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Mountain air',
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Polar winds',
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Donut holes',
            },
        ],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render radial column chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareEnterpriseTestOptions(options as any);
        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render radial column chart as expected with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            axes: {
                angle: {
                    type: 'angle-category',
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

    it(`should render stacked radial column as expected`, async () => {
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

    it(`should render stacked radial column with per-series data as expected`, async () => {
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

    it(`should render stacked radial column as expected with reversed axes`, async () => {
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
                    type: 'angle-category',
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

    it(`should render normalized radial column as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
        };
        prepareEnterpriseTestOptions(options as any);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render normalized radial column as expected with reversed axes`, async () => {
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
                angle: {
                    type: 'angle-category',
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

    it('should render radial column chart with all negative values', async () => {
        const options: AgChartOptions = {
            data: [
                { category: 'A', value: -10 },
                { category: 'B', value: -15 },
                { category: 'C', value: -8 },
                { category: 'D', value: -12 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('should render radial column chart with all negative values and reversed axes', async () => {
        const options: AgChartOptions = {
            data: [
                { category: 'A', value: -10 },
                { category: 'B', value: -15 },
                { category: 'C', value: -8 },
                { category: 'D', value: -12 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
            axes: {
                angle: {
                    type: 'angle-category',
                    reverse: true,
                },
                radius: {
                    type: 'radius-number',
                    reverse: true,
                },
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('should render stacked radial column chart with corner clipping', async () => {
        const options: AgChartOptions = {
            data: [
                { quarter: 'Q1', software: 4.35, hardware: 2.14 },
                { quarter: 'Q2', software: 4.28, hardware: 3.13 },
                { quarter: 'Q3', software: 4.14, hardware: 3.34 },
                { quarter: 'Q4', software: 3.48, hardware: 3.56 },
                { quarter: 'Q5', software: 3.35, hardware: 3.14 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'software',
                    radiusName: 'Software',
                    stackGroup: 'stack',
                },
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'hardware',
                    radiusName: 'Hardware',
                    stackGroup: 'stack',
                },
            ],
            axes: {
                angle: {
                    type: 'angle-category',
                },
                radius: {
                    type: 'radius-number',
                    nice: false,
                },
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    // A stack that straddles the baseline: alternating positive/negative quarters, stacked.
    it('should render stacked radial column chart with mixed-sign data', async () => {
        const options: AgChartOptions = {
            data: [
                { quarter: `Q1'22`, software: 4.35, hardware: 2.14 },
                { quarter: `Q2'22`, software: -4.28, hardware: -3.13 },
                { quarter: `Q3'22`, software: 4.14, hardware: 3.34 },
                { quarter: `Q4'22`, software: -3.48, hardware: -3.56 },
                { quarter: `Q1'23`, software: 3.35, hardware: 3.14 },
            ],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'software',
                    radiusName: 'Software',
                    stackGroup: 'stack',
                },
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'hardware',
                    radiusName: 'Hardware',
                    stackGroup: 'stack',
                },
            ],
            axes: {
                angle: { type: 'angle-category' },
                radius: { type: 'radius-number', nice: false },
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('should render single datum radial column with label positioned at top center', async () => {
        const options: AgChartOptions = {
            data: [{ quarter: `Q1'22`, revenue: 4.35 }],
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'revenue',
                    label: {
                        enabled: true,
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    // The public animation data actions — initial load, add/remove/update data — asserted over the whole
    // animation trajectory (see the animation-trajectory-tests rule) rather than as per-ratio image
    // snapshots. Only the empty→ready reveal animates: each column grows radially from a shared baseline
    // while the labels fade in during the trailing phase. A data update, add, or partial remove on an
    // already-populated series falls through to PolarSeries.animateWaitingUpdateReady, which snaps to the
    // settled state with no tween — the snap CASEs pin exactly that.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        type Row = { quarter: string; air: number; winds: number };
        const RC_DATA: Row[] = [
            { quarter: `Q1'22`, air: 4.35, winds: 2.14 },
            { quarter: `Q2'22`, air: 4.28, winds: 3.13 },
            { quarter: `Q3'22`, air: 4.14, winds: 3.34 },
            { quarter: `Q4'22`, air: 3.48, winds: 3.56 },
        ];
        // A pinned radius axis keeps the scaling fixed across data mutations, so only the marks move.
        const radialOptions = (data: Row[] = RC_DATA): AgPolarChartOptions =>
            prepareEnterpriseTestOptions<AgPolarChartOptions>({
                data: [...data],
                series: [
                    { type: 'radial-column', angleKey: 'quarter', radiusKey: 'air', radiusName: 'Air' },
                    { type: 'radial-column', angleKey: 'quarter', radiusKey: 'winds', radiusName: 'Winds' },
                ],
                axes: {
                    angle: { type: 'angle-category' },
                    radius: { type: 'radius-number', min: 0, max: 10, nice: false },
                },
                legend: { enabled: true },
            });
        const grow = (data: Row[]) => data.map((d) => ({ ...d, air: d.air * 1.8 }));

        const pathEntries = (sample: SceneGeometrySample) =>
            [...sample].filter(([key]) => /^series\[\d+\]\/path\[/.test(key));
        const pathCount = (sample: SceneGeometrySample) => pathEntries(sample).length;

        // Farthest AABB corner from the polar centre (origin in contentGroup coords). A radial column
        // grows outward at its own angle, so no single bbox dimension tracks the growth on its own; this
        // derived radius rises monotonically with the column's radial extent regardless of orientation.
        const outerExtent = (sample: SceneGeometrySample, key: string): number | undefined => {
            const v = sample.get(key);
            if (v == null) return undefined;
            const { x, y, width, height } = v;
            if (![x, y, width, height].every((n) => Number.isFinite(n))) return undefined;
            return Math.hypot(Math.max(Math.abs(x), Math.abs(x + width)), Math.max(Math.abs(y), Math.abs(y + height)));
        };
        const extents = (trajectory: SceneGeometrySample[], key: string): number[] =>
            trajectory.map((f) => outerExtent(f, key)).filter((v): v is number => v != null);

        // The per-column label containers fade in during the trailing phase, after the columns have grown.
        const labelFadeIn: Record<string, SceneNodeExpectation> = {
            'series[0]/labels/text[*]': {
                opacity: { during: 'trailing', expect: ['increases', 'bounded'] },
                x: 'any',
                y: 'any',
            },
            'series[1]/labels/text[*]': {
                opacity: { during: 'trailing', expect: ['increases', 'bounded'] },
                x: 'any',
                y: 'any',
            },
        };
        // The labels start collapsed at opacity ~0 on the first captured frame, so the fade-in specs above
        // cannot pass vacuously — a regression that snapped them straight to full opacity would trip this.
        const expectLabelsStartHidden = (trajectory: SceneGeometrySample[]) => {
            const hidden = [...trajectory[0]].filter(([key]) => /^series\[\d+\]\/labels\/text\[.+\]$/.test(key));
            expect(hidden.length, 'label nodes at frame 0').toBeGreaterThan(0);
            for (const [key, props] of hidden) {
                expect(props.opacity, `${key} opacity at frame 0`).toBeLessThanOrEqual(0.01);
            }
        };
        // Columns are matched `any` (a narrow rotated column path leaves some x-stations un-crossed, i.e.
        // legitimately NaN, which the whole-scene constancy check would reject). The rest of the scene —
        // pinned axes and the labels — must still hold constant, and every column's radial extent must not
        // move a pixel across the captured frames: the snap contract with no tween anywhere.
        const expectMarksSnapped = (trajectory: SceneGeometrySample[]) => {
            expectSceneTrajectory(trajectory, { 'series[0]/path[*]': 'any', 'series[1]/path[*]': 'any' });
            for (const [key] of pathEntries(trajectory[0])) {
                const extent = extents(trajectory, key);
                expect(Math.max(...extent) - Math.min(...extent), `${key} radial extent must not move`).toBeLessThan(1);
            }
        };

        it('initial load: every column grows radially from a shared baseline while labels fade in', async () => {
            const proxy = AgCharts.create(radialOptions());
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const pathKeys = pathEntries(sampleScene()).map(([key]) => key);
            expect(pathKeys).toHaveLength(8);

            // Every column shares one collapsed baseline extent at frame 0 and grows to its own target —
            // a snap regression would show frame 0 already at the (distinct) targets.
            const baselines = pathKeys.map((key) => extents(trajectory, key)[0]);
            const finals = pathKeys.map((key) => extents(trajectory, key).at(-1)!);
            const baseline = baselines[0];
            for (const [i, value] of baselines.entries()) {
                expect(value, `${pathKeys[i]} baseline`).toBeCloseTo(baseline, 0);
            }
            expect(Math.max(...finals) - Math.min(...finals), 'targets are distinct').toBeGreaterThan(15);

            // All columns advance by one shared growth fraction on every frame — the desync detector.
            const columnsGrowInSync: SceneFrameInvariant = {
                name: 'all columns share one radial growth fraction',
                check: (frame) => {
                    const fractions: number[] = [];
                    for (const key of pathKeys) {
                        const current = outerExtent(frame, key);
                        const target = extents(trajectory, key).at(-1)!;
                        if (current == null || target - baseline < 20) continue;
                        fractions.push((current - baseline) / (target - baseline));
                    }
                    if (fractions.length < 2) return undefined;
                    const spread = Math.max(...fractions) - Math.min(...fractions);
                    return spread > 0.1 ? `growth fractions desynced by ${spread.toFixed(3)}` : undefined;
                },
            };

            expectSceneTrajectory(
                trajectory,
                { 'series[0]/path[*]': 'any', 'series[1]/path[*]': 'any', ...labelFadeIn },
                { frameInvariants: [columnsGrowInSync] }
            );
            expectLabelsStartHidden(trajectory);

            for (const key of pathKeys) {
                const extent = extents(trajectory, key);
                expect(extent[0], `${key} baseline`).toBeCloseTo(baseline, 0);
                expectMonotonic(extent, 'increasing');
                expectProgresses(extent);
                expect(extent.at(-1)! - extent[0], `${key} radial growth`).toBeGreaterThan(5);
            }
        });

        it('update data: value changes snap into place without a tween', async () => {
            const options = radialOptions();
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: grow(RC_DATA) } as AgPolarChartOptions)
            );

            const key = `series[0]/path[Q1'22]`;
            // The update actually moved the air columns (anti-vacuity for the snap assertion below)...
            expect(outerExtent(after, key)! - outerExtent(before, key)!, 'air column grew').toBeGreaterThan(20);
            // ...and it landed fully formed on the first captured frame, then held.
            expect(
                Math.abs(outerExtent(trajectory[0], key)! - outerExtent(after, key)!),
                'snapped at frame 0'
            ).toBeLessThan(1);
            expectMarksSnapped(trajectory);
        });

        it('add data: new columns appear fully formed without animating in', async () => {
            const options = radialOptions();
            const proxy = AgCharts.create({ ...options, data: RC_DATA.slice(0, 3) } as AgPolarChartOptions);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: RC_DATA } as AgPolarChartOptions)
            );
            expect(pathCount(before)).toBe(6);

            expect(pathCount(after), 'two columns added').toBe(8);
            expect(pathCount(trajectory[0]), 'added columns present from frame 0').toBe(8);
            // Entrants are drawn at FULL size from the first frame, not collapsed then held: a
            // stuck-collapsed entrant sits at the ~148px reveal baseline, so a >170px floor rejects it
            // while every real column (>=187px here) clears it. Snapped ⇒ frame 0 already == after.
            for (const key of [`series[0]/path[Q4'22]`, `series[1]/path[Q4'22]`]) {
                expect(outerExtent(after, key)!, `${key} entrant at full size`).toBeGreaterThan(170);
                expect(
                    Math.abs(outerExtent(trajectory[0], key)! - outerExtent(after, key)!),
                    `${key} snapped at frame 0`
                ).toBeLessThan(1);
            }
            expectMarksSnapped(trajectory);
        });

        it('remove data: dropped columns disappear without collapsing', async () => {
            const options = radialOptions();
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update({ ...options, data: RC_DATA.slice(0, 3) } as AgPolarChartOptions)
            );
            expect(pathCount(before)).toBe(8);

            expect(pathCount(after), 'two columns removed').toBe(6);
            expect(pathCount(trajectory[0]), 'dropped columns gone from frame 0').toBe(6);
            expectMarksSnapped(trajectory);
        });

        // Endpoint sanity guards: the animated reveal into `before` and the snapped transition into `after`
        // must settle at exactly the pixels a non-animated render of the same options produces.
        it('sanity: update-data endpoints match static renders', async () => {
            const before = radialOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: grow(RC_DATA),
            });
        });

        it('sanity: add-data endpoints match static renders', async () => {
            const before = { ...radialOptions(), data: RC_DATA.slice(0, 3) } as AgPolarChartOptions;
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: [...RC_DATA],
            });
        });

        it('sanity: remove-data endpoints match static renders', async () => {
            const before = radialOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: RC_DATA.slice(0, 3),
            });
        });

        // Runtime option toggles from the retired page, driven with update() on a populated chart.
        const stackedOptions = (data: Row[] = RC_DATA): AgPolarChartOptions => ({
            ...radialOptions(data),
            series: (radialOptions(data).series as AgRadialColumnSeriesOptions[]).map((s) => ({
                ...s,
                stackGroup: 'stack',
            })),
        });
        const signedOptions = (data: Row[]): AgPolarChartOptions => ({
            ...radialOptions(data),
            axes: {
                angle: { type: 'angle-category' },
                radius: { type: 'radius-number', min: -10, max: 10, nice: false },
            },
        });
        const reversedRadiusOptions = (data: Row[] = RC_DATA): AgPolarChartOptions => ({
            ...radialOptions(data),
            axes: {
                angle: { type: 'angle-category' },
                radius: { type: 'radius-number', min: 0, max: 10, nice: false, reverse: true },
            },
        });
        const negativeData = RC_DATA.map((d) => ({ ...d, air: -d.air, winds: -d.winds }));

        // Toggling stackGroup rebuilds the series' node set (grouped→stacked), which re-runs the
        // empty→ready reveal: the fresh stacked columns grow from a shared baseline, they do NOT snap.
        it('toggle stacked: stacked columns reveal-grow from a shared baseline', async () => {
            const proxy = AgCharts.create(radialOptions());
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            await frames.runToEnd(proxy);

            await (proxy as AgChartInstance).update(stackedOptions());
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const after = sampleScene();

            const stackedKeys = pathEntries(after)
                .map(([key]) => key)
                .filter((key) => extents(trajectory, key).length === trajectory.length);
            expect(stackedKeys.length, 'stacked columns present across all frames').toBe(8);
            const baselines = stackedKeys.map((key) => extents(trajectory, key)[0]);
            const finals = stackedKeys.map((key) => extents(trajectory, key).at(-1)!);
            // Shared collapsed baseline at frame 0, distinct targets — a snap would show frame 0 already
            // spread across the (distinct) targets instead of bunched at the baseline.
            for (const [i, value] of baselines.entries()) {
                expect(value, `${stackedKeys[i]} baseline`).toBeCloseTo(baselines[0], 0);
            }
            expect(Math.max(...finals) - Math.min(...finals), 'stacked targets are distinct').toBeGreaterThan(15);
            for (const key of stackedKeys) {
                const extent = extents(trajectory, key);
                expectMonotonic(extent, 'increasing');
                expectProgresses(extent);
                expect(extent.at(-1)! - extent[0], `${key} reveal growth`).toBeGreaterThan(15);
            }
        });

        it('toggle stacked: endpoints match static renders', async () => {
            const before = radialOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, stackedOptions());
        });

        // Flipping the data sign re-lays out every column on the opposite side of the baseline; the
        // radius axis spans both signs so nothing clips. This is a data update ⇒ it snaps, no tween.
        it('flip data sign: columns move across the baseline and snap', async () => {
            const before = signedOptions(RC_DATA);
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const {
                before: beforeSample,
                trajectory,
                after,
            } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update(signedOptions(negativeData))
            );

            const key = `series[0]/path[Q1'22]`;
            expect(
                Math.abs(outerExtent(after, key)! - outerExtent(beforeSample, key)!),
                'sign flip moved the column'
            ).toBeGreaterThan(15);
            expectMarksSnapped(trajectory);
        });

        it('flip data sign: endpoints match static renders', async () => {
            const before = signedOptions(RC_DATA);
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(
                frames,
                () => ctx.snapshot(),
                proxy,
                before,
                signedOptions(negativeData)
            );
        });

        // Reversing the radius axis re-maps every column's radial extent (bars now grow from the outer
        // edge inward); another option update that snaps rather than tweening.
        it('reverse radius axis: columns remap and snap', async () => {
            const before = radialOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const {
                before: beforeSample,
                trajectory,
                after,
            } = await frames.captureSnap(proxy, sampleScene, () =>
                (proxy as AgChartInstance).update(reversedRadiusOptions())
            );

            const key = `series[0]/path[Q1'22]`;
            expect(
                Math.abs(outerExtent(after, key)! - outerExtent(beforeSample, key)!),
                'radius reverse remapped the column'
            ).toBeGreaterThan(15);
            expectMarksSnapped(trajectory);
        });

        it('reverse radius axis: endpoints match static renders', async () => {
            const before = radialOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(
                frames,
                () => ctx.snapshot(),
                proxy,
                before,
                reversedRadiusOptions()
            );
        });
    });

    describe('gradient fill', () => {
        it('should render radial column series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
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

        it('should render radial column series with a gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
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

        it('should render radial column series with an item bound gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
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
                    } as AgRadialColumnSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial column series with a linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
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
                    } as AgRadialColumnSeriesOptions,
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        it('should render radial column series with an item bound linear gradient fill', async () => {
            const options: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'quarter',
                        radiusKey: 'Mountain air',
                        fill: {
                            type: 'gradient',
                            gradient: 'linear',
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
                    } as AgRadialColumnSeriesOptions,
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
                    type: 'radial-column',
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
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                context: c1,
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                            },
                            {
                                type: 'radial-column',
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
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                fill: 'lime', // ignored
                                fillOpacity: 0.5, // not ignored
                                styler: styler.frozen,
                                itemStyler,
                            },
                            {
                                type: 'radial-column',
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
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: () => {
                                    return { fill: { type: 'gradient' } };
                                },
                            },
                            {
                                type: 'radial-column',
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
            beforeEach(async () => {
                chart = AgCharts.create(
                    prepareEnterpriseTestOptions<O>({
                        data,
                        series: [
                            {
                                type: 'radial-column',
                                angleKey: 'quarter',
                                radiusKey: 'sw',
                                radiusName: 'Software',
                                styler: styler.frozen,
                            },
                            {
                                type: 'radial-column',
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
                    type: 'radial-column',
                    angleKey: 'quarter',
                    radiusKey: 'revenue',
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
                    { type: 'radial-column', angleKey: 'x', radiusKey: 's1', radiusName: 'series 1' },
                    { type: 'radial-column', angleKey: 'x', radiusKey: 's2', radiusName: 'series 2' },
                    { type: 'radial-column', angleKey: 'x', radiusKey: 's3', radiusName: 'series 3' },
                ],
            },
        });
    });

    describe('null category key', () => {
        const RADIAL_COLUMN_NULL_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADIAL_COLUMN_NULL_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        it('should reject null category key with warning', async () => {
            const options: AgChartOptions = { ...RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [RadialColumnSeries-1 / angleValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADIAL_COLUMN_NULL_CATEGORY_KEY_OPTIONS.series![0],
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
        const RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_DATA = [
            { category: 'A', value: 10 },
            { category: undefined, value: 20 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_DATA = [
            { category: 'A', value: 10 },
            { category: null, value: 20 },
            { category: undefined, value: 25 },
            { category: 'B', value: 15 },
        ];

        const RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS: AgChartOptions = {
            data: RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_DATA,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        const RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_OPTIONS: AgChartOptions = {
            data: RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_DATA,
            series: [
                {
                    type: 'radial-column',
                    angleKey: 'category',
                    radiusKey: 'value',
                },
            ],
        };

        it('should reject undefined category key with warning', async () => {
            const options: AgChartOptions = { ...RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [RadialColumnSeries-1 / angleValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const options: AgChartOptions = {
                ...RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS,
                series: [
                    {
                        ...RADIAL_COLUMN_UNDEFINED_CATEGORY_KEY_OPTIONS.series![0],
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
                ...RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_OPTIONS,
                series: [
                    {
                        ...RADIAL_COLUMN_NULL_AND_UNDEFINED_KEYS_OPTIONS.series![0],
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

    describe.each(['radial-column', 'nightingale'] as const)('%s', (seriesType) => {
        const polarAxes = {
            angle: { type: 'angle-category' as const },
            radius: { type: 'radius-number' as const },
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

        describe('bigint values (AG-16608)', () => {
            it(`renders a plain ${seriesType} series with out-of-safe-range bigint values`, async () => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: plainData,
                        series: [{ type: seriesType, angleKey: 'quarter', radiusKey: 'value' }],
                        axes: polarAxes,
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });

            it(`renders a stacked ${seriesType} series with bigint values`, async () => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: pairedData,
                        series: [
                            { type: seriesType, angleKey: 'quarter', radiusKey: 'value', stacked: true },
                            { type: seriesType, angleKey: 'quarter', radiusKey: 'value2', stacked: true },
                        ],
                        axes: polarAxes,
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });

            it(`renders a grouped ${seriesType} series with bigint values`, async () => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: pairedData,
                        series: [
                            { type: seriesType, angleKey: 'quarter', radiusKey: 'value', grouped: true },
                            { type: seriesType, angleKey: 'quarter', radiusKey: 'value2', grouped: true },
                        ],
                        axes: polarAxes,
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });

            it(`renders a 100%-stacked ${seriesType} series with bigint values`, async () => {
                expect(
                    await renderEnterpriseChartImage(ctx, {
                        data: pairedData,
                        series: [
                            {
                                type: seriesType,
                                angleKey: 'quarter',
                                radiusKey: 'value',
                                stacked: true,
                                normalizedTo: 100,
                            },
                            {
                                type: seriesType,
                                angleKey: 'quarter',
                                radiusKey: 'value2',
                                stacked: true,
                                normalizedTo: 100,
                            },
                        ],
                        axes: polarAxes,
                    })
                ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
            });
        });

        describe('bigint magnitude invariance (AG-16608)', () => {
            const values = (vals: number[]) => (toValue: (v: number) => number | bigint) =>
                vals.map((value, i) => ({ quarter: `Q${i + 1}`, value: toValue(value) }));

            it(`positions a plain ${seriesType} series identically when scaled beyond Number.MAX_VALUE`, async () => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createEnterpriseChart,
                    magnitudePair(
                        {
                            series: [{ type: seriesType, angleKey: 'quarter', radiusKey: 'value' }],
                            axes: stripAxes({
                                angle: { type: 'angle-category' },
                                radius: { type: 'radius-number', nice: false },
                            }),
                            legend: { enabled: false },
                        },
                        values([1, 2, 3])
                    )
                );
            });
        });
    });
});
