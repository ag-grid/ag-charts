import { classCast } from '_ag-charts-test';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ChartUpdateType } from 'ag-charts-core';
import type { AgChartInstance, AgChartOptions, AgPieSeriesOptions, AgPolarChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { OptionsGraph } from '../../../module/optionsGraph';
import { Transformable } from '../../../scene/transformable';
import type { Chart } from '../../chart';
import type { AgChartProxy } from '../../chartProxy';
import { LegendMarkerLabel } from '../../legend/legendMarkerLabel';
import * as examples from '../../test/examples';
import { type MockPieCalloutLineItemStyler, newFreezableMock } from '../../test/freezableMock';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    PATTERN_SNAPSHOT_DEFAULTS,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    type SceneNodeExpectation,
    clickAction,
    createChart,
    createSceneGeometrySampler,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectProgresses,
    expectSceneSamplesMatch,
    expectSceneTrajectory,
    expectWarningsCalls,
    extractImageData,
    looserSnapshotDefaults,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    spyOnAnimationManager,
    tapAction,
    waitForChartStability,
} from '../../test/utils';
import { PieSeries } from './pieSeries';
import { DATA_MARKET_SHARE } from './test/data';

function* iterPieSectors(myChart: Chart) {
    const pieSeries = classCast(deproxy(myChart).series[0], PieSeries);
    for (const nodeData of pieSeries.getNodeData() ?? []) {
        if (nodeData.angleValue < 1e-10) continue;

        const { x = 0, y = 0 } = nodeData.midPoint ?? {};
        yield Transformable.toCanvasPoint(pieSeries.contentGroup, x, y);
    }
}

function* iterLegendMarkerLabels(myChart: Chart) {
    for (const { legend } of deproxy(myChart).modulesManager.legends()) {
        const markerLabels = (legend as any).itemSelection?._nodes as LegendMarkerLabel[];
        for (const label of markerLabels) {
            const { x, y } = Transformable.toCanvas(label).computeCenter();
            yield { x, y, text: label.text };
        }
    }
}

describe('PieSeries', () => {
    setupMockConsole();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async (customSnapshotIdentifier?: string, defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            ...defaults,
            failureThreshold: 0,
            customSnapshotIdentifier,
        });
    };

    let chart: Chart;
    const ctx = setupMockCanvas();
    const options: AgPolarChartOptions = prepareTestOptions({});

    // The public animation data actions — initial-load, add, remove, update, legend-toggle — each
    // asserted over the whole animation trajectory (see the animation-trajectory-tests rule). Add and
    // remove append/truncate at the tail; the pie-series-test page's manual-only reorder, rapid-update,
    // change-in-place and start/middle add/remove controls exercise the same span/radius/fade code paths
    // and are not reproduced here. Pie sectors sweep their angular SPAN; the outer radius re-layouts as
    // the callout labels claim or release room; the callout labels snap to opacity 0 when the data lands
    // and re-fade during the trailing phase.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        type MarketRow = { os: string; share: number };

        const pieOptions = (data: MarketRow[] = DATA_MARKET_SHARE): AgPolarChartOptions =>
            prepareTestOptions({
                data: [...data],
                series: [{ type: 'pie', angleKey: 'share', calloutLabelKey: 'os' }],
                legend: { enabled: true },
            });
        const donutOptions = (data: MarketRow[] = DATA_MARKET_SHARE): AgPolarChartOptions =>
            prepareTestOptions({
                data: [...data],
                series: [{ type: 'donut', angleKey: 'share', calloutLabelKey: 'os', innerRadiusRatio: 0.6 }],
                legend: { enabled: true },
            });

        const dropLastTwo = (data: MarketRow[]) => data.slice(0, data.length - 2);
        const doubleIos = (data: MarketRow[]) => data.map((d) => (d.os === 'iOS' ? { ...d, share: d.share * 2 } : d));

        const sectorEntries = (sample: SceneGeometrySample) =>
            [...sample].filter(([key]) => /^series\[0\]\/sector\[/.test(key));
        const sectorCount = (sample: SceneGeometrySample) => sectorEntries(sample).length;
        // A sector's angular span across the frames where it is present and finite. `span` is a
        // derived quantity no per-property expectation can express, so the headline directional and
        // anti-vacuity contracts are asserted over it manually (as the historic spike CASE did).
        const spans = (trajectory: SceneGeometrySample[], key: string): number[] =>
            trajectory
                .map((f) => {
                    const s = f.get(key);
                    return s == null ? undefined : s.endAngle - s.startAngle;
                })
                .filter((v): v is number => v != null && Number.isFinite(v));
        const radii = (trajectory: SceneGeometrySample[], key: string): number[] =>
            trajectory.map((f) => f.get(key)?.outerRadius).filter((v): v is number => v != null && Number.isFinite(v));

        // Sorted by start angle, each sector ends exactly where the next begins — a collapsed
        // zero-span sector still satisfies this, so it holds through add/remove/update/legend.
        const sectorsContiguous: SceneFrameInvariant = {
            name: 'sectors tile the circle contiguously',
            check: (frame) => {
                const sorted = sectorEntries(frame)
                    .map(([, v]) => v)
                    .sort((a, b) => a.startAngle - b.startAngle);
                for (let i = 0; i < sorted.length - 1; i++) {
                    const gap = Math.abs(sorted[i].endAngle - sorted[i + 1].startAngle);
                    if (gap > 1e-3) return `gap ${gap.toFixed(4)} between contiguous sectors ${i} and ${i + 1}`;
                }
                return undefined;
            },
        };
        // On a full-circle transition the spans always sum to 2π: a shrinking sector is exactly offset
        // by growing neighbours on every frame (NOT true of the initial reveal, where the total grows).
        const spanClosesToCircle: SceneFrameInvariant = {
            name: 'sector spans sum to a full circle',
            check: (frame) => {
                const total = sectorEntries(frame).reduce((sum, [, v]) => sum + (v.endAngle - v.startAngle), 0);
                return Math.abs(total - Math.PI * 2) > 1e-2 ? `total span ${total.toFixed(3)} != 2π` : undefined;
            },
        };

        // The callout label containers and per-datum callout label texts re-fade during the trailing
        // phase, after the sectors have reflowed. The globs also match the non-fading structural groups
        // (items/phantom) and the persistent inner label `labels/text[]`, which satisfy the spec
        // vacuously; expectCalloutsStartHidden supplies the anti-vacuity for the nodes that do fade.
        const calloutRefade: Record<string, SceneNodeExpectation> = {
            'series[0]/group[*]': { opacity: { during: 'trailing', expect: ['increases', 'bounded'] } },
            'series[0]/labels/text[*]': {
                opacity: { during: 'trailing', expect: ['increases', 'bounded'] },
                x: 'any',
                y: 'any',
            },
        };
        // Both the callout label containers (unnamed / `#n` groups) AND the per-datum label texts
        // (`labels/text[<datum>]`) start collapsed at opacity ~0 on the first captured frame, so the
        // re-fade specs above cannot pass vacuously — a regression that snapped them straight to full
        // opacity would trip this. The persistent inner label (`labels/text[]`, empty key) never fades
        // and is excluded.
        const expectCalloutsStartHidden = (trajectory: SceneGeometrySample[]) => {
            const faders = [...trajectory[0]].filter(
                ([key]) => /^series\[0\]\/group\[(#\d+)?\]$/.test(key) || /^series\[0\]\/labels\/text\[.+\]$/.test(key)
            );
            expect(faders.length, 'callout label nodes at frame 0').toBeGreaterThan(0);
            for (const [key, props] of faders) {
                expect(props.opacity, `${key} opacity at frame 0`).toBeLessThanOrEqual(0.01);
            }
        };

        // A data update lands new / re-keyed sector nodes and snaps the callout labels to opacity 0 at
        // frame 0, tripping captureUpdate's whole-scene start anchor — so the data-action CASEs
        // hand-roll the capture, keeping only the end anchor (as the line/bar suites do). `setup` runs
        // an extra settled pre-state (used by legend-show, which must start from a hidden sector).
        const captureFrom = async (
            create: AgPolarChartOptions,
            action: (proxy: AgChartInstance) => void | Promise<void>,
            setup?: (proxy: AgChartInstance) => void | Promise<void>
        ) => {
            const proxy = AgCharts.create(create);
            chart = deproxy(proxy);
            await frames.runToEnd(proxy);
            if (setup != null) {
                await setup(proxy);
                await frames.runToEnd(proxy);
            }
            const sampleScene = createSceneGeometrySampler(proxy);
            const before = sampleScene();
            await action(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const after = sampleScene();
            // End anchor only (the frame-0 start anchor is dropped: labels snap at frame 0).
            expectSceneSamplesMatch(trajectory.at(-1)!, after);
            return { proxy, sampleScene, before, trajectory, after };
        };

        const toggleSector = (proxy: AgChartInstance, index: number, enabled: boolean) => {
            (deproxy(proxy).series[0] as any).toggleSeriesItem(enabled, 'category', index, undefined);
            deproxy(proxy).update(ChartUpdateType.FULL);
        };

        // Initial-load reveal: each sector sweeps its span from 0 to target while the radii hold; the
        // callouts and labels fade in as the sweep completes.
        it('standalone: initial load sweeps each sector span to a full circle', async () => {
            const proxy = AgCharts.create(pieOptions());
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const sectorKeys = sectorEntries(sampleScene()).map(([key]) => key);
            expect(sectorKeys).toHaveLength(6);

            expectSceneTrajectory(
                trajectory,
                {
                    // Every sector's endAngle sweeps during 'initial' and holds thereafter; startAngle is
                    // mixed (the anchor holds, the rest slide) so it is left to the span checks below.
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: { during: 'initial', expect: ['progresses', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous] }
            );
            expectCalloutsStartHidden(trajectory);

            // Anti-vacuity: every span grows from ~0 to its target and the total closes to 2π.
            for (const key of sectorKeys) {
                const sectorSpans = spans(trajectory, key);
                expect(sectorSpans[0], `${key} span at frame 0`).toBeLessThanOrEqual(0.02);
                expectMonotonic(sectorSpans, 'increasing');
                expectProgresses(sectorSpans);
            }
            const totalSpan = trajectory.map((f) =>
                sectorEntries(f).reduce((sum, [, v]) => sum + (v.endAngle - v.startAngle), 0)
            );
            expect(totalSpan[0]).toBeLessThanOrEqual(0.05);
            expectMonotonic(totalSpan, 'increasing');
            expect(totalSpan.at(-1)).toBeCloseTo(Math.PI * 2, 1);
        });

        // "Remove Data" — the two smallest sectors collapse their span to zero and leave, while the
        // survivors grow to fill the vacated sweep and the pie's outer radius grows into the freed room.
        it('remove data: dropped sectors collapse while survivors grow to fill the circle', async () => {
            const { before, trajectory, after } = await captureFrom(pieOptions(), (proxy) =>
                proxy.update(pieOptions(dropLastTwo(DATA_MARKET_SHARE)))
            );
            expect(sectorCount(before)).toBe(6);
            expect(sectorCount(after)).toBe(4);
            // The removed sectors are named explicitly (not left to the `sector[*]` wildcard): their
            // outerRadius must actually tween into the freed-up radius alongside the survivors, not
            // sit constant at the old (smaller) radius while only their span collapses — a wildcard
            // 'increases' check alone would pass vacuously on a constant trajectory (AG-8489).
            const removedRadius: SceneNodeExpectation = {
                startAngle: 'any',
                endAngle: 'any',
                outerRadius: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
            };
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[2.6]': removedRadius,
                    'series[0]/sector[1.9]': removedRadius,
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: 'any',
                        outerRadius: { during: 'update', expect: ['increases', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous, spanClosesToCircle] }
            );
            expectCalloutsStartHidden(trajectory);

            for (const key of ['series[0]/sector[2.6]', 'series[0]/sector[1.9]']) {
                const removed = spans(trajectory, key);
                expect(removed[0], `${key} span at frame 0`).toBeGreaterThan(0.1);
                expectMonotonic(removed, 'decreasing');
                expect(removed.at(-1), `${key} final span`).toBeLessThanOrEqual(0.02);
            }
            const android = spans(trajectory, 'series[0]/sector[56.9]');
            expectMonotonic(android, 'increasing');
            expect(android.at(-1)! - android[0], 'Android span growth').toBeGreaterThan(0.1);
        });

        // "Add Data" — the two restored sectors grow their span from zero while the survivors shrink to
        // make room and the outer radius contracts as the extra callout labels reclaim their space.
        it('add data: new sectors grow from zero while survivors shrink to make room', async () => {
            const { before, trajectory, after } = await captureFrom(
                pieOptions(dropLastTwo(DATA_MARKET_SHARE)),
                (proxy) => proxy.update(pieOptions())
            );
            expect(sectorCount(before)).toBe(4);
            expect(sectorCount(after)).toBe(6);
            // The added sectors are named explicitly (not left to the `sector[*]` wildcard): their
            // outerRadius must actually tween down from the old (bigger) radius alongside the
            // survivors, not snap straight to the target radius while only their span grows in — a
            // wildcard 'decreases' check alone would pass vacuously on a constant trajectory.
            const addedRadius: SceneNodeExpectation = {
                startAngle: 'any',
                endAngle: 'any',
                outerRadius: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
            };
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[2.6]': addedRadius,
                    'series[0]/sector[1.9]': addedRadius,
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: 'any',
                        outerRadius: { during: 'update', expect: ['decreases', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous, spanClosesToCircle] }
            );
            expectCalloutsStartHidden(trajectory);

            for (const key of ['series[0]/sector[2.6]', 'series[0]/sector[1.9]']) {
                const added = spans(trajectory, key);
                expect(added[0], `${key} span at frame 0`).toBeLessThanOrEqual(0.02);
                expectMonotonic(added, 'increasing');
                expectProgresses(added);
            }
            const android = spans(trajectory, 'series[0]/sector[56.9]');
            expectMonotonic(android, 'decreasing');
            expect(android[0] - android.at(-1)!, 'Android span shrink').toBeGreaterThan(0.1);
        });

        // "Update Data" — doubling iOS's share grows its sector at the expense of every other sector;
        // its shared boundary with the Android anchor tweens during the update phase. The trajectory
        // spec proves the boundary MOVES and WHEN (progresses/during); direction is proven by the span
        // checks below (per-frame angle steps sit under monotonicTol, so a direction word is vacuous).
        it('update data: doubling iOS grows its sector while the rest shrink proportionally', async () => {
            const { trajectory } = await captureFrom(pieOptions(), (proxy) =>
                proxy.update(pieOptions(doubleIos(DATA_MARKET_SHARE)))
            );
            expectSceneTrajectory(
                trajectory,
                {
                    // The iOS/Android boundary is the one angle that moves a whole radian; Android's
                    // startAngle is the fixed 12 o'clock anchor that must never move.
                    'series[0]/sector[22.5]': {
                        startAngle: { during: 'update', expect: ['progresses', 'bounded'] },
                        endAngle: 'any',
                        outerRadius: { during: 'update', expect: ['progresses', 'bounded'] },
                    },
                    'series[0]/sector[56.9]': {
                        startAngle: 'constant',
                        endAngle: { during: 'update', expect: ['progresses', 'bounded'] },
                        outerRadius: { during: 'update', expect: ['progresses', 'bounded'] },
                    },
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: 'any',
                        outerRadius: { during: 'update', expect: ['progresses', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous, spanClosesToCircle] }
            );
            expectCalloutsStartHidden(trajectory);

            const ios = spans(trajectory, 'series[0]/sector[22.5]');
            expectMonotonic(ios, 'increasing');
            expectProgresses(ios);
            expect(ios.at(-1)! - ios[0], 'iOS span growth').toBeGreaterThan(0.5);
            const android = spans(trajectory, 'series[0]/sector[56.9]');
            expectMonotonic(android, 'decreasing');
            expect(android[0] - android.at(-1)!, 'Android span shrink').toBeGreaterThan(0.3);
        });

        // "Legend toggle off" — hiding Android collapses its sector span to zero (its startAngle anchor
        // holds while its endAngle sweeps back to it) as the survivors grow to reclaim the whole circle.
        it('legend hide: the toggled-off sector collapses while survivors grow to fill the circle', async () => {
            const { trajectory } = await captureFrom(pieOptions(), (proxy) => toggleSector(proxy, 0, false));
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[56.9]': {
                        startAngle: 'constant',
                        endAngle: { during: 'update', expect: ['progresses', 'bounded'] },
                        outerRadius: { during: 'update', expect: ['increases', 'progresses', 'bounded'] },
                    },
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: 'any',
                        outerRadius: { during: 'update', expect: ['increases', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous, spanClosesToCircle] }
            );
            expectCalloutsStartHidden(trajectory);

            const android = spans(trajectory, 'series[0]/sector[56.9]');
            expect(android[0], 'Android span before hide').toBeGreaterThan(3);
            expectMonotonic(android, 'decreasing');
            expect(android.at(-1), 'Android final span').toBeLessThanOrEqual(0.02);
            const ios = spans(trajectory, 'series[0]/sector[22.5]');
            expectMonotonic(ios, 'increasing');
            expect(ios.at(-1)! - ios[0], 'iOS span growth').toBeGreaterThan(0.5);
            // The freed callout-label room must actually grow the outer radius, not sit constant while
            // only the spans reflow (a wildcard 'increases' passes vacuously on a held radius).
            const outerRadius = radii(trajectory, 'series[0]/sector[56.9]');
            expect(outerRadius.at(-1)! - outerRadius[0], 'outer radius growth on hide').toBeGreaterThan(5);
        });

        // "Legend toggle on" — the reverse: re-showing a hidden Android grows its span back from zero
        // while the survivors shrink to make room. Starts from a settled hidden pre-state via `setup`.
        it('legend show: the re-shown sector grows from zero while survivors shrink', async () => {
            const { trajectory } = await captureFrom(
                pieOptions(),
                (proxy) => toggleSector(proxy, 0, true),
                (proxy) => toggleSector(proxy, 0, false)
            );
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[56.9]': {
                        startAngle: 'constant',
                        endAngle: { during: 'update', expect: ['progresses', 'bounded'] },
                        outerRadius: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] },
                    },
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: 'any',
                        outerRadius: { during: 'update', expect: ['decreases', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous, spanClosesToCircle] }
            );
            expectCalloutsStartHidden(trajectory);

            const android = spans(trajectory, 'series[0]/sector[56.9]');
            expect(android[0], 'Android span while hidden').toBeLessThanOrEqual(0.02);
            expectMonotonic(android, 'increasing');
            expect(android.at(-1), 'Android final span').toBeGreaterThan(3);
            // The reclaimed callout-label room must actually shrink the outer radius back down.
            const outerRadius = radii(trajectory, 'series[0]/sector[56.9]');
            expect(outerRadius[0] - outerRadius.at(-1)!, 'outer radius shrink on show').toBeGreaterThan(5);
        });

        // Donut initial load: identical span sweep to the pie, but with a persistent cutout — the inner
        // and outer radii hold at their donut values throughout, so only the angular span animates.
        it('donut: initial load sweeps spans while the cutout radii hold', async () => {
            const proxy = AgCharts.create(donutOptions());
            chart = deproxy(proxy);
            const sampleScene = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampleScene);
            await frames.runToEnd(proxy);
            const sectorKeys = sectorEntries(sampleScene()).map(([key]) => key);
            expect(sectorKeys).toHaveLength(6);

            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[*]': {
                        startAngle: 'any',
                        endAngle: { during: 'initial', expect: ['progresses', 'bounded'] },
                    },
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous] }
            );
            expectCalloutsStartHidden(trajectory);

            // The cutout is real and holds: inner radius stays well above zero on every frame.
            for (const frame of trajectory) {
                for (const [key, props] of sectorEntries(frame)) {
                    expect(props.innerRadius, `${key} innerRadius`).toBeGreaterThan(50);
                }
            }
            for (const key of sectorKeys) {
                const sectorSpans = spans(trajectory, key);
                expect(sectorSpans[0], `${key} span at frame 0`).toBeLessThanOrEqual(0.02);
                expectMonotonic(sectorSpans, 'increasing');
                expectProgresses(sectorSpans);
            }
        });

        // Donut data update: the spans reshape exactly as the pie's, and the cutout survives — the inner
        // and outer radii tween by a small margin (progresses/bounded) without ever collapsing the hole.
        it('donut: updating data reshapes spans while the cutout survives', async () => {
            const { trajectory } = await captureFrom(donutOptions(), (proxy) =>
                proxy.update(donutOptions(doubleIos(DATA_MARKET_SHARE)))
            );
            const cutoutTweens: SceneNodeExpectation = {
                innerRadius: { during: 'update', expect: ['progresses', 'bounded'] },
                outerRadius: { during: 'update', expect: ['progresses', 'bounded'] },
            };
            expectSceneTrajectory(
                trajectory,
                {
                    'series[0]/sector[22.5]': {
                        startAngle: { during: 'update', expect: ['progresses', 'bounded'] },
                        endAngle: 'any',
                        ...cutoutTweens,
                    },
                    'series[0]/sector[56.9]': {
                        startAngle: 'constant',
                        endAngle: { during: 'update', expect: ['progresses', 'bounded'] },
                        ...cutoutTweens,
                    },
                    'series[0]/sector[*]': { startAngle: 'any', endAngle: 'any', ...cutoutTweens },
                    // The donut's inner-circle marker resizes by a couple of pixels with the cutout.
                    'series[0]/background/marker[*]': 'any',
                    ...calloutRefade,
                },
                { frameInvariants: [sectorsContiguous, spanClosesToCircle] }
            );
            expectCalloutsStartHidden(trajectory);

            for (const frame of trajectory) {
                for (const [key, props] of sectorEntries(frame)) {
                    expect(props.innerRadius, `${key} innerRadius`).toBeGreaterThan(50);
                }
            }
            const ios = spans(trajectory, 'series[0]/sector[22.5]');
            expectMonotonic(ios, 'increasing');
            expectProgresses(ios);
            expect(ios.at(-1)! - ios[0], 'iOS span growth').toBeGreaterThan(0.5);
        });

        // Endpoint sanity guards: the animated route must settle at exactly the pixels a snapped
        // (skipAnimations) render of the same options produces, in both directions.
        it('sanity: update-data endpoints match static renders', async () => {
            const before = pieOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: doubleIos(DATA_MARKET_SHARE),
            });
        });

        it('sanity: remove-data endpoints match static renders', async () => {
            const before = pieOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: dropLastTwo(DATA_MARKET_SHARE),
            });
        });

        it('sanity: add-data endpoints match static renders', async () => {
            const before = pieOptions(dropLastTwo(DATA_MARKET_SHARE));
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), proxy, before, {
                ...before,
                data: [...DATA_MARKET_SHARE],
            });
        });
    });

    describe('#create', () => {
        test('zerosum pie', async () => {
            chart = await createChart({
                ...options,
                data: [{ value: 0 }, { value: 0 }],
                series: [{ type: 'pie', angleKey: 'value' }],
            });
            await compare();
        });

        test('normalises bigint angle data without error (AG-16608)', async () => {
            // The angle normalise post-processor maps the domain span with Number factors; a bigint
            // angleKey column previously threw 'Cannot mix BigInt and other types'. The same values as
            // bigint must render identically and emit no warnings.
            const numberData = [
                { label: 'A', value: 4159000 },
                { label: 'B', value: 97000 },
                { label: 'C', value: 456000 },
                { label: 'D', value: 1215000 },
            ];
            const makeSeries = (data: object[]): AgPieSeriesOptions[] => [
                { type: 'pie', data, angleKey: 'value', calloutLabelKey: 'label', sectorLabelKey: 'value' },
            ];

            chart = await createChart({ ...options, series: makeSeries(numberData) });
            const numberImage = ctx.snapshot();
            chart.destroy();

            // Without the fix the post-processor throws and the chart logs a console.error 'update error'
            // (a stale canvas would let an image comparison alone pass spuriously, so assert that too).
            const errorSpy = vi.spyOn(console, 'error');
            const bigintData = numberData.map((d) => ({ ...d, value: BigInt(d.value) }));
            chart = await createChart({ ...options, series: makeSeries(bigintData) });
            const bigintImage = ctx.snapshot();

            expect(errorSpy).not.toHaveBeenCalled();
            expect(bigintImage).toMatchImage(numberImage);
            errorSpy.mockRestore();
        });
    });

    describe('#validation', () => {
        test('missing data warning', async () => {
            chart = await createChart({
                ...options,
                data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
                series: [{ type: 'pie', calloutLabelKey: 'cat', angleKey: 'dog', sectorLabelKey: 'fox' }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [PieSeries-1 / calloutLabelKey] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - no value was found for the key 'dog' on 3 data elements",
  ],
  [
    "AG Charts - no value was found for the key 'cat' on 1 data element",
  ],
  [
    "AG Charts - no value was found for the key 'fox' on 4 data elements",
  ],
]
`);
        });

        test('null callout label key warning', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { label: 'A', value: 10 },
                    { label: null, value: 20 },
                    { label: 'B', value: 15 },
                ],
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label' }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelKey] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelValue] ignored:",
    "[null]",
  ],
]
`);
        });
    });

    describe('null category key', () => {
        it('should reject null category key with warning', async () => {
            const opts: AgChartOptions = examples.PIE_NULL_ANGLE_KEY_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelKey] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / calloutLabelValue] ignored:",
    "[null]",
  ],
]
`);
            await compare();
        });

        it('should accept null category key when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.PIE_NULL_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should reject undefined category key with warning', async () => {
            const opts: AgChartOptions = examples.PIE_UNDEFINED_CATEGORY_KEY_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [undefined] for [PieSeries-1 / calloutLabelKey] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - invalid value of type [undefined] for [PieSeries-1 / calloutLabelValue] ignored:",
    "[undefined]",
  ],
]
`);
            await compare();
        });

        it('should accept undefined category key when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.PIE_UNDEFINED_CATEGORY_KEY_ALLOWED_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
            await compare();
        });

        it('should treat null and undefined as distinct categories when allowNullKeys is true', async () => {
            const opts: AgChartOptions = examples.PIE_NULL_AND_UNDEFINED_KEYS_EXAMPLE;
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - legend item '' has multiple fill colours, this may cause unexpected behaviour.",
  ],
]
`);
            await compare();
        });

        it('should call calloutLabel formatter with null value when allowNullKeys is true', async () => {
            const calloutLabelFormatter = vi.fn((params: any) =>
                params.value === null ? 'Unknown' : String(params.value)
            );
            const opts: AgChartOptions = {
                data: [
                    { asset: null, amount: 60000 },
                    { asset: 'Bonds', amount: 40000 },
                ],
                series: [
                    {
                        type: 'pie',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        calloutLabel: { formatter: calloutLabelFormatter },
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareTestOptions(opts);

            chart = await createChart(opts);

            expect(calloutLabelFormatter).toHaveBeenCalled();
            const callWithNull = calloutLabelFormatter.mock.calls.find((c: any[]) => c[0]?.value === null);
            expect(callWithNull).toBeDefined();
        });

        it('should render formatted callout label for null category when allowNullKeys is true', async () => {
            const opts: AgChartOptions = {
                data: [
                    { asset: null, amount: 60000 },
                    { asset: 'Bonds', amount: 40000 },
                ],
                series: [
                    {
                        type: 'pie',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        calloutLabel: {
                            formatter: (params: any) => (params.value === null ? 'Unknown' : String(params.value)),
                        },
                        allowNullKeys: true,
                    } as any,
                ],
            };
            prepareTestOptions(opts);

            chart = await createChart(opts);

            await compare();
        });
    });

    describe('pattern fill', () => {
        it('should render pie series with default pattern fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 20, dog: 31 },
                    { cat: 3, fox: 11, dog: 30 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [{ type: 'pattern' }, { type: 'pattern' }, { type: 'pattern' }, { type: 'pattern' }],
                    },
                ],
            });
            await compare(undefined, PATTERN_SNAPSHOT_DEFAULTS);
        });

        it('should render pie series with pattern fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 20, dog: 31 },
                    { cat: 3, fox: 11, dog: 30 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'pattern',
                                pattern: 'hearts',
                                fill: 'red',
                                stroke: 'red',
                                backgroundFill: 'cyan',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 1,
                                width: 60,
                                height: 60,
                            },
                            {
                                type: 'pattern',
                                pattern: 'stars',
                                fill: 'cyan',
                                stroke: 'blue',
                                backgroundFill: 'yellow',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 1,
                                width: 20,
                                height: 20,
                            },
                            {
                                type: 'pattern',
                                pattern: 'circles',
                                fill: 'cyan',
                                stroke: 'blue',
                                backgroundFill: 'yellow',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 2,
                                width: 50,
                                height: 50,
                            },
                            {
                                type: 'pattern',
                                fill: 'cyan',
                                stroke: 'blue',
                                backgroundFill: 'yellow',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 2,
                                path: 'M 0 17.83 V 0 h 17.83 a 3 3 0 0 1 -5.66 2 H 5.9 A 5 5 0 0 1 2 5.9 v 6.27 a 3 3 0 0 1 -2 5.66 Z m 0 18.34 a 3 3 0 0 1 2 5.66 v 6.27 A 5 5 0 0 1 5.9 52 h 6.27 a 3 3 0 0 1 5.66 0 H 0 V 36.17 Z M 36.17 52 a 3 3 0 0 1 5.66 0 h 6.27 a 5 5 0 0 1 3.9 -3.9 v -6.27 a 3 3 0 0 1 0 -5.66 V 52 H 36.17 Z M 0 31.93 v -9.78 a 5 5 0 0 1 3.8 0.72 l 4.43 -4.43 a 3 3 0 1 1 1.42 1.41 L 5.2 24.28 a 5 5 0 0 1 0 5.52 l 4.44 4.43 a 3 3 0 1 1 -1.42 1.42 L 3.8 31.2 a 5 5 0 0 1 -3.8 0.72 Z m 52 -14.1 a 3 3 0 0 1 0 -5.66 V 5.9 A 5 5 0 0 1 48.1 2 h -6.27 a 3 3 0 0 1 -5.66 -2 H 52 v 17.83 Z m 0 14.1 a 4.97 4.97 0 0 1 -1.72 -0.72 l -4.43 4.44 a 3 3 0 1 1 -1.41 -1.42 l 4.43 -4.43 a 5 5 0 0 1 0 -5.52 l -4.43 -4.43 a 3 3 0 1 1 1.41 -1.41 l 4.43 4.43 c 0.53 -0.35 1.12 -0.6 1.72 -0.72 v 9.78 Z M 22.15 0 h 9.78 a 5 5 0 0 1 -0.72 3.8 l 4.44 4.43 a 3 3 0 1 1 -1.42 1.42 L 29.8 5.2 a 5 5 0 0 1 -5.52 0 l -4.43 4.44 a 3 3 0 1 1 -1.41 -1.42 l 4.43 -4.43 a 5 5 0 0 1 -0.72 -3.8 Z m 0 52 c 0.13 -0.6 0.37 -1.19 0.72 -1.72 l -4.43 -4.43 a 3 3 0 1 1 1.41 -1.41 l 4.43 4.43 a 5 5 0 0 1 5.52 0 l 4.43 -4.43 a 3 3 0 1 1 1.42 1.41 l -4.44 4.43 c 0.36 0.53 0.6 1.12 0.72 1.72 h -9.78 Z m 9.75 -24 a 5 5 0 0 1 -3.9 3.9 v 6.27 a 3 3 0 1 1 -2 0 V 31.9 a 5 5 0 0 1 -3.9 -3.9 h -6.27 a 3 3 0 1 1 0 -2 h 6.27 a 5 5 0 0 1 3.9 -3.9 v -6.27 a 3 3 0 1 1 2 0 v 6.27 a 5 5 0 0 1 3.9 3.9 h 6.27 a 3 3 0 1 1 0 2 H 31.9 Z',
                                width: 50,
                                height: 50,
                            },
                            {
                                type: 'pattern',
                                pattern: 'crosses',
                                fill: 'orange',
                                stroke: 'red',
                                backgroundFill: 'cyan',
                                backgroundFillOpacity: 0.6,
                                fillOpacity: 1,
                                strokeWidth: 1,
                                padding: 5,
                                width: 40,
                                height: 40,
                            },
                        ],
                    } as AgPieSeriesOptions,
                ],
            });
            await compare(undefined, looserSnapshotDefaults(0.08));
        });
    });

    describe('gradient fill', () => {
        it('should render pie series with a default radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                            },
                        ],
                    },
                ],
            });
            await compare();
        });

        it('should render pie series with a radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
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
                        ],
                    },
                ],
            });
            await compare();
        });

        it('should render pie series with a mix of radial gradient and string fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
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
                            'blue',
                        ],
                    },
                ],
            });
            await compare();
        });

        it('should render pie series with an item bound linear gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
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
                        ],
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render pie series with a series bound linear gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
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
                        ],
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render pie series with a series bound radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        angleKey: 'fox',
                        radiusKey: 'cat',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                gradient: 'radial',
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
                        ],
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });

        it('should render pie series with an item bound radial gradient fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        angleKey: 'fox',
                        radiusKey: 'cat',
                        sectorLabelKey: 'fox',
                        fills: [
                            {
                                type: 'gradient',
                                /* @ts-expect-error internal option */
                                gradient: 'radial',
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
                        ],
                    } as AgPieSeriesOptions,
                ],
            });
            await compare();
        });
    });

    describe('itemStyler', () => {
        it('complex fills', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        itemStyler: (params) => {
                            if (params.datum.fox === 20) return { fill: { type: 'gradient' } };
                            if (params.datum.fox === 10) return { fill: { type: 'pattern' } };
                            if (params.datum.fox === 15) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.datum.fox === 17) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                        },
                    },
                ],
            });
            await compare();
        });

        it('complex fills over default fill', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: ['red'],
                        itemStyler: (params) => {
                            if (params.datum.fox === 20) return { fill: { type: 'gradient' } };
                            if (params.datum.fox === 10) return { fill: { type: 'pattern' } };
                            if (params.datum.fox === 15) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.datum.fox === 17) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                                };
                            }
                        },
                    },
                ],
            });
            await compare();
        });

        it('complex fills over default gradient', async () => {
            chart = await createChart({
                ...options,
                data: [
                    { cat: 1, fox: 20, dog: 37 },
                    { cat: 3, fox: 10, dog: 32 },
                    { cat: 7, fox: 15, dog: 35 },
                    { cat: 8, fox: 17, dog: 36 },
                ],
                series: [
                    {
                        type: 'pie',
                        radiusKey: 'dog',
                        angleKey: 'fox',
                        sectorLabelKey: 'fox',
                        fills: [{ type: 'gradient' }],
                        itemStyler: (params) => {
                            if (params.datum.fox === 20) return { fill: { type: 'gradient' } };
                            if (params.datum.fox === 10) return { fill: { type: 'pattern' } };
                            if (params.datum.fox === 15) return { fill: { type: 'pattern', pattern: 'squares' } };
                            if (params.datum.fox === 17) {
                                return {
                                    fill: { type: 'gradient', colorStops: [{ color: 'pink' }, { color: 'orange' }] },
                                };
                            }
                        },
                    },
                ],
            });
            await compare();
        });
    });

    describe('nodeClick', () => {
        const clicks: string[] = [];
        const doubleClicks: string[] = [];
        const legendClicks: (string | number)[] = [];

        const nodeClickOptions: AgPolarChartOptions = {
            data: [
                { asset: 'Stocks', amount: 5 },
                { asset: 'Cash', amount: 5 },
                { asset: 'Bonds', amount: 0 }, // AG-12321 - nodeClick not triggered for datums after a zero value.
                { asset: 'Real Estate', amount: 5 },
                { asset: 'Commodities', amount: 5 },
            ],
            series: [
                {
                    type: 'pie',
                    angleKey: 'amount',
                    legendItemKey: 'asset',
                    listeners: {
                        seriesNodeClick: (event) => {
                            clicks.push(event.datum.asset);
                        },
                        seriesNodeDoubleClick: (event) => {
                            doubleClicks.push(event.datum.asset);
                        },
                    },
                },
            ],
            legend: {
                listeners: {
                    legendItemClick: (event) => {
                        legendClicks.push(event.itemId);
                    },
                },
            },
        };

        beforeEach(async () => {
            chart = await createChart(nodeClickOptions);
            clicks.splice(0, clicks.length);
            doubleClicks.splice(0, doubleClicks.length);
            legendClicks.splice(0, legendClicks.length);
        });

        describe('should fire a nodeClick event for each visible sector', () => {
            test('mouse', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await tapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(clicks).toEqual(['Stocks', 'Cash', 'Real Estate', 'Commodities']);
                expect(doubleClicks).toHaveLength(0);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should fire a nodeDoubleClick event for each visible sector', () => {
            test('mouse', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleClickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterPieSectors(chart)) {
                    await waitForChartStability(chart);
                    await doubleTapAction(x, y)(chart);
                }
            });

            afterEach(() => {
                expect(doubleClicks).toEqual(['Stocks', 'Cash', 'Real Estate', 'Commodities']);
                expect(clicks).toHaveLength(8);
                expect(legendClicks).toHaveLength(0);
            });
        });

        describe('should not fire series events for legend clicks', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await tapAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            });

            afterEach(() => {
                expect(doubleClicks).toHaveLength(0);
                expect(clicks).toHaveLength(0);
                expect(legendClicks).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
            });
        });
    });

    describe('AG-14232 legend toggling', () => {
        beforeEach(async () => {
            chart = await createChart({
                data: [
                    { name: 'Pizza', value: 3 },
                    { name: 'Cake', value: 4 },
                    { name: 'Quiche', value: 5 },
                ],
                series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'name' }],
            });
        });
        describe('click', () => {
            test('mouse', async () => {
                for (const { x, y, text } of iterLegendMarkerLabels(chart)) {
                    await clickAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-click-${text}`);
                    await clickAction(x, y)(chart);
                }
            });
            test('touch', async () => {
                for (const { x, y, text } of iterLegendMarkerLabels(chart)) {
                    await tapAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-click-${text}`);
                    await tapAction(x, y)(chart);
                }
            });
        });
        describe('dblclick', () => {
            test('mouse', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await doubleClickAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-All`);
                }
            });
            test('touch', async () => {
                for (const { x, y } of iterLegendMarkerLabels(chart)) {
                    await doubleTapAction(x, y)(chart);
                    await compare(`pie-series-test-ts-pie-series-legend-All`);
                }
            });
        });
    });

    describe('AG-16665 downloaded image excludes hidden sectors', () => {
        let chartProxy: AgChartProxy;

        beforeEach(async () => {
            const testOptions: AgPolarChartOptions = prepareTestOptions({
                data: [
                    { name: 'A (deselected)', value: 10 },
                    { name: 'B', value: 20 },
                    { name: 'C', value: 30 },
                ],
                series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'name' }],
            });
            chartProxy = AgCharts.create(testOptions) as AgChartProxy;
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);
        });

        test('should exclude hidden sectors from downloaded image', async () => {
            // Get first legend item coordinates
            const [{ x, y }] = [...iterLegendMarkerLabels(chart)];

            // Hide sector by clicking legend item
            await clickAction(x, y)(chart);
            await waitForChartStability(chart);

            // Take snapshot of current chart state (with hidden sector)
            const reference = ctx.snapshot();

            // Get downloaded image
            const canvasCount = ctx.getActiveCanvasInstances().length;
            const imageURL = await chartProxy.getImageDataURL();
            const imagePNGData = Buffer.from(imageURL.split(',')[1], 'base64');
            expect(imagePNGData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

            // Verify downloaded image matches current chart (both should have hidden sector)
            const imageRaw = ctx.getActiveCanvasInstances()[canvasCount];
            expect(imageRaw.getContext('2d').getImageData(0, 0, imageRaw.width, imageRaw.height)).toMatchImage(
                reference
            );
        });
    });

    describe('applyTransaction', () => {
        let chartProxy: AgChartProxy;
        let pieSeries: PieSeries;

        beforeEach(async () => {
            OptionsGraph.clearValueCache();
            const transactionOptions = prepareTestOptions({
                theme: {
                    palette: {
                        fills: ['red', 'green'],
                        strokes: ['black'],
                    },
                },
                data: [
                    { food: 'Pizza', value: 3 },
                    { food: 'Cake', value: 4 },
                ],
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'food' }],
            });
            chartProxy = AgCharts.create(transactionOptions);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            pieSeries = classCast(chart.series[0], PieSeries);
        });

        afterEach(() => {
            chartProxy = undefined!;
            pieSeries = undefined!;
        });

        test('reprocesses palette entries for new data', async () => {
            expect(pieSeries.properties.fills).toEqual(['red', 'green']);

            await chartProxy.applyTransaction({
                add: [
                    { food: 'Quiche', value: 5 },
                    { food: 'Salad', value: 2 },
                ],
            });
            await waitForChartStability(chart);

            const nodeData = pieSeries.getNodeData() ?? [];
            expect(pieSeries.properties.fills).toEqual(['red', 'green', 'red', 'green']);
            expect(nodeData).toHaveLength(4);
            expect(nodeData.map((datum) => datum.sectorFormat.fill)).toEqual(['red', 'green', 'red', 'green']);
        });

        test('removes data items correctly', async () => {
            const initialData = chartProxy.getOptions().data!;
            expect(initialData).toHaveLength(2);
            const initialNodeData = pieSeries.getNodeData() ?? [];
            expect(initialNodeData).toHaveLength(2);

            const itemToRemove = initialData[0];
            await chartProxy.applyTransaction({
                remove: [itemToRemove],
            });
            await waitForChartStability(chart);

            const updatedOptions = chartProxy.getOptions();
            expect(updatedOptions.data).toBeDefined();
            expect(updatedOptions.data!).toHaveLength(1);
            expect(updatedOptions.data!).not.toContainEqual(itemToRemove);

            const nodeData = pieSeries.getNodeData() ?? [];
            expect(nodeData).toHaveLength(1);
        });
    });

    // AG-8724 - Allow hiding zero value sectors in legend
    describe('hideZeroValueSectorsInLegend', () => {
        const data = [
            { id: 'a', value: 4 },
            { id: 'b', value: 0 },
            { id: 'c', value: 5 },
        ];
        const series: AgPieSeriesOptions[] = [
            {
                type: 'pie' as const,
                angleKey: 'value',
                calloutLabelKey: 'id',
            },
        ];
        const opts = prepareTestOptions({
            data,
            series,
        });

        it('should display legend item for zero value sectors when `hideZeroValueSectorsInLegend` is not supplied in the options', async () => {
            chart = await createChart(opts);
            await compare();
        });
        it('should hide legend item for zero value sectors when `hideZeroValueSectorsInLegend` is set to `true`', async () => {
            opts.series[0] = { ...series[0], hideZeroValueSectorsInLegend: true };

            chart = await createChart(opts);
            await compare();
        });
    });

    // AG-13953 - an invalid value shouldn't affect other segments or the legend
    describe('with invalid values', () => {
        it('should render correctly', async () => {
            const invalidDataOptions: AgPolarChartOptions = {
                data: [
                    { asset: 'Stocks', amount: 60000 },
                    { asset: 'Bonds', amount: 40000 },
                    { asset: 'Cash', amount: 7000 },
                    { asset: 'Real Estate', amount: null },
                    { asset: 'Commodities', amount: 3000 },
                ],
                title: {
                    text: 'Portfolio Composition',
                },
                series: [
                    {
                        type: 'pie',
                        angleKey: 'amount',
                        calloutLabelKey: 'asset',
                        sectorLabelKey: 'amount',
                    },
                ],
            };

            chart = await createChart(invalidDataOptions);
            await compare();

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / angleRaw] ignored:",
    "[null]",
  ],
  [
    "AG Charts - invalid value of type [object] for [PieSeries-1 / sectorLabelValue] ignored:",
    "[null]",
  ],
]
`);
        });
    });

    describe('AG-11672 calloutLine.itemStyler', () => {
        type D = { name: string; size: number };
        type C = undefined;
        type M = MockPieCalloutLineItemStyler<D, C>;
        let itemStyler: ReturnType<typeof newFreezableMock<D, C, M>>;
        beforeEach(async () => {
            itemStyler = newFreezableMock<D, C, M>((p) => {
                if (p.datum.name === 'Abu Dhabi') {
                    return { color: 'black' };
                }
                if (p.datum.name === 'Dublin') {
                    return { length: 100 };
                }
                if (p.datum.name === 'Paris') {
                    return { strokeWidth: 30 };
                }
                if (p.datum.name === 'Tokyo') {
                    return { strokeWidth: 15, color: '#00ff00' };
                }
                if (p.datum.name === 'Zurich') {
                    return { length: 125, strokeWidth: 20 };
                }
            });
            const opts: AgChartOptions<{ name: string; size: number }, undefined> = {
                data: [
                    { name: 'Abu Dhabi', size: 1 },
                    { name: 'Amsterdam', size: 1 },
                    { name: 'Barcelona', size: 1 },
                    { name: 'Berlin', size: 1 },
                    { name: 'Brussels', size: 1 },
                    { name: 'Cairo', size: 1 },
                    { name: 'Dublin', size: 1 },
                    { name: 'Hanoi', size: 1 },
                    { name: 'Kyiv', size: 1 },
                    { name: 'London', size: 1 },
                    { name: 'Madrid', size: 1 },
                    { name: 'New York', size: 1 },
                    { name: 'Paris', size: 1 },
                    { name: 'Rome', size: 1 },
                    { name: 'San Francisco', size: 1 },
                    { name: 'Tokyo', size: 1 },
                    { name: 'Zurich', size: 1 },
                ],
                series: [
                    {
                        type: 'pie',
                        angleKey: 'size',
                        calloutLabelKey: 'name',
                        calloutLine: {
                            colors: ['#9a1212', '#129a12', '#12129a'],
                            length: 50,
                            strokeWidth: 5,
                            itemStyler: itemStyler.frozen,
                        },
                    },
                ],
            };
            chart = await createChart(opts);
        });
        test('calls', () => {
            expect(itemStyler.mock.mock.calls).toMatchSnapshot();
        });
        test('image', async () => {
            await compare();
        });
    });

    // CRT-1053: Pie sectors with non-string fills (patterns/gradients) should not render black
    // during animation. The fix conditionally excludes fill from animation properties when
    // the fill is not a plain colour string.
    describe('CRT-1053 pattern fill animation', () => {
        const animate = spyOnAnimationManager();

        const PIE_PATTERN_DATA = [
            { label: 'A', value: 30 },
            { label: 'B', value: 25 },
            { label: 'C', value: 20 },
            { label: 'D', value: 15 },
        ];

        // Intermediate ratios are load-bearing here: this is a paint regression (fills rendering black
        // mid-interpolation), which the geometry trajectory harness cannot observe — only rendered
        // pixels catch it, so the full ratio sweep is retained rather than trimmed to endpoints.
        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`should render pattern fills (not black) at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const opts: AgChartOptions = {
                    data: PIE_PATTERN_DATA,
                    series: [
                        {
                            type: 'pie',
                            angleKey: 'value',
                            calloutLabelKey: 'label',
                            fills: [{ type: 'pattern' }, { type: 'pattern' }, { type: 'pattern' }, { type: 'pattern' }],
                        } as AgPieSeriesOptions,
                    ],
                };
                prepareTestOptions(opts);

                chart = AgCharts.create(opts) as any;
                await waitForChartStability(chart);

                await compare(undefined, PATTERN_SNAPSHOT_DEFAULTS);
            });
        }

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`should render gradient fills (not black) at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const opts: AgChartOptions = {
                    data: PIE_PATTERN_DATA,
                    series: [
                        {
                            type: 'pie',
                            angleKey: 'value',
                            calloutLabelKey: 'label',
                            fills: [
                                { type: 'gradient' },
                                { type: 'gradient' },
                                { type: 'gradient' },
                                { type: 'gradient' },
                            ],
                        } as AgPieSeriesOptions,
                    ],
                };
                prepareTestOptions(opts);

                chart = AgCharts.create(opts) as any;
                await waitForChartStability(chart);

                await compare();
            });
        }
    });

    describe('crossfiltering', () => {
        const angleFilterData = [
            { label: 'A', angle: 10, angleFilter: 20 },
            { label: 'B', angle: 5, angleFilter: 15 },
            { label: 'C', angle: 8, angleFilter: 12 },
        ];

        it('angleKey less than angleFilterKey', async () => {
            chart = await createChart({
                ...options,
                data: angleFilterData,
                series: [
                    {
                        type: 'pie',
                        angleKey: 'angle',
                        angleFilterKey: 'angleFilter',
                        calloutLabelKey: 'label',
                    } as AgPieSeriesOptions,
                ],
            });
            await waitForChartStability(chart);

            await compare();
        });

        it('angleKey greater than angleFilterKey', async () => {
            const data = [
                { label: 'A', angle: 20, angleFilter: 10 },
                { label: 'B', angle: 15, angleFilter: 5 },
                { label: 'C', angle: 12, angleFilter: 8 },
            ];
            chart = await createChart({
                ...options,
                data,
                series: [
                    {
                        type: 'pie',
                        angleKey: 'angle',
                        angleFilterKey: 'angleFilter',
                        calloutLabelKey: 'label',
                    } as AgPieSeriesOptions,
                ],
            });
            await waitForChartStability(chart);

            await compare();
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
});
