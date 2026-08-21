import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { AgChartProxy } from '../chartProxy';
import type { SceneNodeExpectation, ScenePropertyExpectation } from '../test/utils';
import {
    createSceneGeometrySampler,
    expectNoAnimation,
    expectSceneTrajectory,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
} from '../test/utils';

// Axis-focused frame-trajectory tests — per-tick identity across domain changes, label rotation
// and out-of-range culling — with a minimal line series as scaffolding.
describe('CartesianAxis animation', () => {
    setupMockConsole();
    setupMockCanvas();
    const frames = spyOnAnimationFrames();

    let chart: AgChartProxy;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    const slidesLeft = { during: 'update', expect: ['decreases', 'bounded'] } as const;
    // A departing tick must fade all the way to invisible, not merely dim: pin the endpoint at 0 so a
    // fade that stalls part-way (leaving a ghost tick drawn) fails.
    const fadesOut = { during: ['remove', 'update', 'add'], expect: ['decreases', 'bounded'], settlesAt: 0 } as const;
    const fadesIn = { during: 'add', expect: ['increases', 'bounded'], settlesAt: 1 } as const;
    // Expand a generic {slide, ...} tick spec onto a node's actual coordinate props.
    const mapKeyedCoords = (
        spec: Partial<Record<string, ScenePropertyExpectation>>,
        ...coords: string[]
    ): Partial<Record<string, ScenePropertyExpectation>> => {
        const { slide, ...rest } = spec;
        if (slide == null) return rest;
        return { ...rest, ...Object.fromEntries(coords.map((coord) => [coord, slide])) };
    };
    // One spec entry per scene node of a bottom-axis tick: label, tick line and gridline.
    const bottomTick = (
        id: string,
        spec: Partial<Record<string, ScenePropertyExpectation>>
    ): Record<string, SceneNodeExpectation> => ({
        [`axis[bottom]/text[${id}]`]: mapKeyedCoords(spec, 'x'),
        [`axis[bottom]/line[${id}]`]: mapKeyedCoords(spec, 'x1', 'x2'),
        [`axis[bottom]/grid/line[${id}]`]: mapKeyedCoords(spec, 'x1', 'x2'),
    });

    const numberChartOptions = (
        data: Array<{ x: number; y: number }>,
        xAxisExtras: object = {}
    ): AgCartesianChartOptions =>
        prepareTestOptions({
            data,
            series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: false } }],
            axes: {
                x: { type: 'number', position: 'bottom', ...xAxisExtras },
                y: { type: 'number', position: 'left' },
            },
        });

    it('number-axis domain growth slides surviving ticks and swaps the tick set with fades', async () => {
        chart = AgCharts.create(
            numberChartOptions([
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ])
        ) as AgChartProxy;
        await frames.runToEnd(chart);
        const sampleScene = createSceneGeometrySampler(chart);

        // Grow the domain via the axis option so the case stays axis-focused: surviving ticks
        // slide, the stale set fades out, the new set fades in.
        await chart.updateDelta({ axes: { x: { max: 200 } } });
        const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

        // Tick 0 anchors, tick 100 slides to the midpoint; the stale step-20 set slides out
        // fading, the new step-50 set fades in at its final positions.
        expectSceneTrajectory(trajectory, {
            'series[0]/path[stroke]': { width: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] } },
            ...bottomTick('l:100', { slide: slidesLeft }),
            ...bottomTick('l:20', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:40', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:60', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:80', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:50', { opacity: fadesIn }),
            ...bottomTick('l:150', { opacity: fadesIn }),
            ...bottomTick('l:200', { opacity: fadesIn }),
        });
    });

    it('label rotation change interpolates via the shortest arc', async () => {
        const options = numberChartOptions([
            { x: 0, y: 0 },
            { x: 100, y: 100 },
        ]);
        chart = AgCharts.create(options) as AgChartProxy;
        await frames.runToEnd(chart);
        const sampleScene = createSceneGeometrySampler(chart);

        await chart.updateDelta({ axes: { x: { label: { rotation: 45 } } } });
        const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

        const duringUpdate = (
            ...expect_: readonly ('increases' | 'decreases' | 'progresses' | 'bounded')[]
        ): ScenePropertyExpectation => ({ during: 'update', expect: expect_ });

        // The rotated labels shrink the bottom gutter, so the whole plot reflows a few pixels
        // down alongside the rotation tween.
        expectSceneTrajectory(trajectory, {
            'axis[bottom]/text[l:*]': { rotation: duringUpdate('increases', 'progresses', 'bounded') },
            'axis[bottom]/group[*]': { translationY: duringUpdate('decreases', 'bounded') },
            'axis[bottom]/grid/line[*]': { y2: duringUpdate('increases', 'bounded') },
            'axis[left]/text[*]': { y: duringUpdate('decreases', 'bounded') },
            'axis[left]/line[*]': {
                y1: duringUpdate('decreases', 'bounded'),
                y2: duringUpdate('decreases', 'bounded'),
            },
            'axis[left]/grid/line[*]': {
                y1: duringUpdate('decreases', 'bounded'),
                y2: duringUpdate('decreases', 'bounded'),
            },
            'series[0]/path[stroke]': {
                height: duringUpdate('decreases', 'bounded'),
                'top@0': duringUpdate('decreases', 'bounded'),
                'top@1': duringUpdate('decreases', 'bounded'),
                'top@2': duringUpdate('decreases', 'bounded'),
                'top@3': duringUpdate('decreases', 'bounded'),
            },
        });

        // Shortest-arc: the tween settles at +45° (π/4), not the long way round (-315°).
        const finalRotation = trajectory.at(-1)!.get('axis[bottom]/text[l:0]')!.rotation;
        expect(finalRotation).toBeCloseTo(Math.PI / 4, 3);
    });

    it('ticks sliding out of the range are culled mid-flight', async () => {
        chart = AgCharts.create(
            numberChartOptions([
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ])
        ) as AgChartProxy;
        await frames.runToEnd(chart);
        const sampleScene = createSceneGeometrySampler(chart);

        // Pan right: surviving ticks slide left and a tick crossing the range edge must flip
        // invisible. The y-axis is pinned to keep the case bottom-axis-only.
        await chart.updateDelta({ axes: { x: { min: 50, max: 150 }, y: { min: 0, max: 100 } } });
        const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

        expectSceneTrajectory(trajectory, {
            'series[0]/path[stroke]': { x: { during: 'update', expect: ['decreases', 'progresses', 'bounded'] } },
            ...bottomTick('l:60', { slide: slidesLeft }),
            ...bottomTick('l:80', { slide: slidesLeft }),
            ...bottomTick('l:100', { slide: slidesLeft }),
            ...bottomTick('l:0', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:20', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:40', { slide: slidesLeft, opacity: fadesOut }),
            ...bottomTick('l:120', { opacity: fadesIn }),
            ...bottomTick('l:140', { opacity: fadesIn }),
        });

        // Nothing may be drawn outside the range once the pan settles. The axisUtil visibility culling is
        // inert here (Line has only a `y` setter), so only the fade is assertable.
        const lastPresent = [...trajectory].reverse().find((f) => f.has('axis[bottom]/text[l:0]'));
        for (const node of ['text[l:0]', 'line[l:0]', 'grid/line[l:0]']) {
            expect(lastPresent!.get(`axis[bottom]/${node}`)!.opacity).toBe(0);
        }
    });

    it('reversed number-axis domain growth slides ticks in the opposite direction', async () => {
        const options = numberChartOptions(
            [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ],
            { reverse: true }
        );
        chart = AgCharts.create(options) as AgChartProxy;
        await frames.runToEnd(chart);
        const sampleScene = createSceneGeometrySampler(chart);

        await chart.updateDelta({ axes: { x: { max: 200 } } });
        const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

        // Mirror of the unreversed case: tick 100 starts at the range START and slides right. On a
        // reversed-axis domain change the stroke path stays empty until trailing.
        const slidesRight = { during: 'update', expect: ['increases', 'bounded'] } as const;
        const rightTick = (id: string): Record<string, SceneNodeExpectation> => ({
            [`axis[bottom]/text[${id}]`]: { x: slidesRight, opacity: fadesOut },
            [`axis[bottom]/line[${id}]`]: { x1: slidesRight, x2: slidesRight, opacity: fadesOut },
            [`axis[bottom]/grid/line[${id}]`]: { x1: slidesRight, x2: slidesRight, opacity: fadesOut },
        });
        expectSceneTrajectory(trajectory, {
            // Tick 100 survives the step-20 -> step-50 re-tick (value 100 is in both sets), so it
            // slides right at full opacity rather than fading out.
            ...bottomTick('l:100', { slide: slidesRight }),
            ...rightTick('l:20'),
            ...rightTick('l:40'),
            ...rightTick('l:60'),
            ...rightTick('l:80'),
            ...bottomTick('l:50', { opacity: fadesIn }),
            ...bottomTick('l:150', { opacity: fadesIn }),
            ...bottomTick('l:200', { opacity: fadesIn }),
        });
    });

    it('time-axis domain growth re-ticks across the unit change with fades and slides', async () => {
        const day = (n: number) => new Date(2024, 0, n);
        const timeChartOptions = (maxDay: number): AgChartOptions =>
            prepareTestOptions({
                data: [
                    { x: day(1), y: 0 },
                    { x: day(maxDay), y: 100 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: false } }],
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            });

        chart = AgCharts.create(timeChartOptions(8)) as AgChartProxy;
        await frames.runToEnd(chart);
        const sampleScene = createSceneGeometrySampler(chart);

        await chart.updateDelta({
            data: [
                { x: day(1), y: 0 },
                { x: day(91), y: 100 },
            ],
        });
        const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

        // The unit change replaces the whole tick set: day ticks fade out in `remove`, month
        // ticks fade in during `add`.
        const fadeSwap = { during: ['remove', 'update', 'add'], expect: 'bounded' } as const;
        const holds = { during: ['update', 'add'], expect: 'bounded' } as const;
        const lineReticks = { opacity: fadeSwap, x1: holds, x2: holds } as const;
        const morphs = { during: ['remove', 'add'], expect: 'progresses' } as const;
        expectSceneTrajectory(trajectory, {
            'axis[bottom]/text[v:*]': { opacity: fadeSwap, x: holds },
            'axis[bottom]/line[v:*]': lineReticks,
            // The changed point is removed and re-added, so the line dips away and back.
            'series[0]/path[stroke]': {
                x: { during: ['remove', 'add'], expect: ['increases', 'bounded'] },
                y: morphs,
                width: morphs,
                height: morphs,
                'top@1': morphs,
                'top@2': morphs,
                'top@3': morphs,
                'top@4': morphs,
            },
        });

        // The swap must complete: every surviving (month) tick label is fully opaque at the end.
        const finalFrame = trajectory.at(-1)!;
        const monthLabels = [...finalFrame.keys()].filter((k) => /^axis\[bottom\]\/text\[v:/.test(k));
        expect(monthLabels.length).toBeGreaterThan(0);
        for (const key of monthLabels) {
            expect(finalFrame.get(key)!.opacity, key).toBe(1);
        }
    });

    it('resize snaps the axes to the new layout without tweening', async () => {
        const options = numberChartOptions([
            { x: 0, y: 0 },
            { x: 100, y: 100 },
        ]);
        chart = AgCharts.create(options) as AgChartProxy;
        await frames.runToEnd(chart);
        const sampleScene = createSceneGeometrySampler(chart);
        const tickBefore = sampleScene().get('axis[bottom]/text[l:100]')!.x;

        await chart.update({ ...options, width: 400 });
        const trajectory = await frames.captureAnimationFrames(chart, sampleScene);

        expectNoAnimation(trajectory);
        // The resize must have re-laid-out instantly: the end tick is already at its new position
        // on the first captured frame.
        const tickAfter = trajectory[0].get('axis[bottom]/text[l:100]')!.x;
        expect(tickAfter).toBeLessThan(tickBefore - 100);
    });
});
