import { afterEach, describe, expect, it } from 'vitest';

import type { AgLinearGaugeLabelPlacement, AgLinearGaugeOptions } from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    GALLERY_EXAMPLES,
    type SceneNodeGeometry,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectSceneTrajectory,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgNumericValue } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('LinearGaugeSeries', () => {
    setupMockConsole();
    let chart: any;

    const EXAMPLE_OPTIONS: AgLinearGaugeOptions = {
        ...(GALLERY_EXAMPLES.SIMPLE_LINEAR_GAUGE_EXAMPLE.options as any),
        bar: {
            fills: [{ color: '#27ae60' }, { color: '#f1c40f' }, { color: '#d35400' }],
        },
    };

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('basic chart', () => {
        it('should render a gauge', async () => {
            const options: AgLinearGaugeOptions = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    // The initial-load reveal, asserted over the whole animation trajectory (see the
    // animation-trajectory-tests rule) rather than as per-ratio image snapshots. The value bar sweeps
    // open by growing its clip window along the gauge's main axis during the initial phase; every other
    // node (the background scale bar, ticks, labels) holds constant. This exercises the shared harness'
    // Rect clip reader (clipX0/clipY0/clipX1/clipY1) — the only per-frame signal of the sweep, since the
    // drawn path collapses while the rect is clipped.
    describe('initial animation', () => {
        const frames = spyOnAnimationFrames();

        const VALUE_BAR = 'series[0]/rect[value-0]';

        it.each(['horizontal', 'vertical'] as const)(
            'value bar reveals by growing its clip window along the %s main axis',
            async (direction) => {
                const options: AgLinearGaugeOptions = { ...EXAMPLE_OPTIONS, direction };
                prepareEnterpriseTestOptions(options);

                const proxy = AgCharts.createGauge(options);
                chart = deproxy(proxy);
                const sampler = createSceneGeometrySampler(proxy);
                // Capture immediately (the internal settle only waits for layout) so the reveal is
                // preserved; captureUpdate would runToEnd first and consume the sweep before sampling.
                const trajectory = await frames.captureAnimationFrames(proxy, sampler);
                await frames.runToEnd(proxy);

                const start = trajectory[0].get(VALUE_BAR);
                const end = trajectory.at(-1)!.get(VALUE_BAR);
                expect(start, 'value bar sampled at frame 0').toBeDefined();
                expect(end, 'value bar sampled at final frame').toBeDefined();

                // Anti-vacuity: the clip window is collapsed to zero main-axis extent at frame 0 and full
                // at the end, so the directional clip spec below cannot pass on a flat trajectory.
                const mainAxisClipExtent = (s: SceneNodeGeometry) =>
                    direction === 'horizontal' ? s.clipX1 - s.clipX0 : s.clipY1 - s.clipY0;
                expect(mainAxisClipExtent(start!)).toBeCloseTo(0, 3);
                expect(mainAxisClipExtent(end!)).toBeGreaterThan(100);

                const grows = { during: 'initial', expect: ['increases', 'progresses', 'bounded'] } as const;
                const shrinks = { during: 'initial', expect: ['decreases', 'progresses', 'bounded'] } as const;

                // Horizontal grows the right clip edge (clipX1) and the width rightward; vertical grows
                // upward, so the top clip edge (clipY0) and the bar's y both shrink while height grows.
                // visible flips 0->1 as the collapsed bar becomes drawable. Every unnamed property (the
                // static clip edges, x, opacity, and every other node) defaults to constant.
                const valueBarSpec =
                    direction === 'horizontal'
                        ? { clipX1: grows, width: grows, visible: 'any' as const }
                        : { clipY0: shrinks, y: shrinks, height: grows, visible: 'any' as const };

                expectSceneTrajectory(trajectory, { [VALUE_BAR]: valueBarSpec });
            }
        );
    });

    describe.each(['horizontal', 'vertical'] as const)('series labels (%s)', (direction) => {
        it.each([
            'inside-start',
            'outside-start',
            'inside-end',
            'outside-end',
            'inside-center',
            'bar-inside',
            'bar-inside-end',
            'bar-outside-end',
            'bar-end',
        ] as AgLinearGaugeLabelPlacement[])('should render label at placement %s', async (placement) => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                direction,
                label: {
                    enabled: true,
                    placement,
                    color: '#888',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it.each([
            'inside-start',
            'outside-start',
            'inside-end',
            'outside-end',
            'inside-center',
            'bar-inside',
            'bar-inside-end',
            'bar-outside-end',
            'bar-end',
        ] as AgLinearGaugeLabelPlacement[])('should render multi-line labels at placement %s', async (placement) => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                direction,
                label: {
                    text: 'Hello\nWorld!',
                    enabled: true,
                    placement,
                    color: '#888',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('fills', () => {
        it('should render custom discrete, fills with explicit stops', async () => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [
                        { color: '#0f0', stop: 20 },
                        { color: '#ff0', stop: 40 },
                        { color: '#f00', stop: 60 },
                    ],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it('should render custom discrete, fills with implicit stops', async () => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [{ color: '#0f0' }, { color: '#ff0' }, { color: '#f00' }],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it('should render custom discrete, fills with implicit end stops', async () => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [{ color: '#0f0', stop: 50 }, { color: '#ff0' }, { color: '#f00' }],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });

        it('should render custom discrete, fills with implicit start stops', async () => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                value: 100,
                bar: {
                    fills: [{ color: '#0f0' }, { color: '#ff0' }, { color: '#f00', stop: 50 }, { color: '#f0f' }],
                    fillMode: 'discrete',
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('when in development mode', () => {
        beforeEach(() => {
            (globalThis as any).agChartsDebug = ['dev'];
        });

        afterEach(() => {
            delete (globalThis as any).agChartsDebug;
        });

        it('should not error when creating gauge with disabled nested options', async () => {
            const options: AgLinearGaugeOptions = {
                ...EXAMPLE_OPTIONS,
                segmentation: {
                    enabled: false,
                    // AG-14117 - Failed with  TypeError: Cannot delete property 'interval' of #<Object> previously.
                    interval: { count: 10 },
                },
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.createGauge(options));
            await compare();
        });
    });

    describe('AG-15830 hover over label', () => {
        it('should not throw exceptions', async () => {
            const options: AgLinearGaugeOptions = {
                type: 'linear-gauge',
                direction: 'horizontal',
                title: { text: 'Performance Level' },
                value: 55,
                scale: { min: 0, max: 100 },
                label: { placement: 'inside-end' },
                tooltip: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));

            await waitForChartStability(chart);
            await hoverAction(750, 320)(chart);
            expect(0).toBe(0); // do nothing (just check MockConsole warn/error output).
        });
    });

    describe('CRT-1126 line target hover region', () => {
        it('should highlight the line when hovered but not in empty space away from it', async () => {
            const options: AgLinearGaugeOptions = {
                type: 'linear-gauge',
                direction: 'horizontal',
                value: 55,
                scale: { min: 0, max: 100 },
                targets: [{ value: 90, shape: 'line' }],
                tooltip: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));
            await waitForChartStability(chart);

            const series = chart.series[0];
            const lineNode = [...series.targetSelection.nodes()][0];
            const lineBBox = _ModuleSupport.Transformable.toCanvas(lineNode);
            const lineCx = lineBBox.x + lineBBox.width / 2;
            const lineCy = lineBBox.y + lineBBox.height / 2;
            // The line's local origin maps to this canvas point: empty space above the bar, far
            // enough from the line that it must not register as hovered.
            const emptyX = lineCx - lineNode.translationX + 4;
            const emptyY = lineCy - lineNode.translationY + 4;

            const { highlightManager } = chart.ctx;

            await hoverAction(emptyX, emptyY)(chart);
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            await hoverAction(lineCx, lineCy)(chart);
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeDefined();
        });
    });

    describe('keyboard navigation (CRT-1124)', () => {
        // Options that reproduce the bug: a segmented bar (so nodeData.length > 1 in contextNodeData)
        // combined with enough targets that a Right→Right sequence lands on target index 2 before Up.
        // Layer 0 (datumUnion) is always a SINGLE focusable node regardless of segmentation;
        // layer 1 (targetSelection) has one node per target.
        const SEGMENTED_WITH_TARGETS: AgLinearGaugeOptions = {
            type: 'linear-gauge',
            value: 60,
            scale: { min: 0, max: 100 },
            segmentation: { enabled: true, interval: { count: 5 } },
            targets: [
                { value: 20, text: 'Low' },
                { value: 50, text: 'Mid' },
                { value: 80, text: 'High' },
            ],
        };

        async function setupKeyNavChart(opts: AgLinearGaugeOptions) {
            const options: AgLinearGaugeOptions = { ...opts };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));
            await waitForChartStability(chart);
            return chart;
        }

        // Dispatches a keydown event on the .ag-charts-series-area DOM element, which is the
        // element the seriesAreaManager's seriesWidget listens on.
        function pressArrowOnSeriesArea(key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
            const seriesArea = document.querySelector<HTMLElement>('.ag-charts-series-area');
            if (!seriesArea) throw new Error('series-area element not found');
            seriesArea.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
        }

        // Read the internal focus state written back by updatePickedFocus after each successful pick.
        function getFocusState(c: any) {
            return c.seriesAreaManager.focus as {
                seriesIndex: number;
                datumIndex: number;
                datum: unknown;
            };
        }

        // AC1: repro case — segmented bar + 3 targets.
        // ArrowDown enters the targets layer; ArrowRight×2 moves to target index 2.
        // ArrowUp MUST return focus to layer 0 (the bar) — not get stuck.
        describe('AC1 – ArrowUp from non-first target returns to bar (regression)', () => {
            it('direct pickFocus: ArrowUp with datumIndex=2 in layer 1 resolves to layer 0 at datumIndex 0', async () => {
                const c = await setupKeyNavChart(SEGMENTED_WITH_TARGETS);
                const series = c.series[0];

                // Simulate the exact inputs onArrow produces after Down→Right→Right→Up:
                // focus.seriesIndex was incremented to 1 then back to 0, focus.datumIndex is 2.
                const pick = series.pickFocus({
                    datumIndex: 2,
                    datumIndexDelta: 0,
                    otherIndex: 0, // post-increment: Up moved seriesIndex from 1 → 0
                    otherIndexDelta: -1, // Up
                });

                expect(pick).toBeDefined();
                expect(pick!.otherIndex).toBe(0); // returned to layer 0
                expect(pick!.datumIndex).toBe(0); // reset to 0 on layer change
            });

            it('full pipeline: focus does not get stuck after Down→Right→Right→Up', async () => {
                const c = await setupKeyNavChart(SEGMENTED_WITH_TARGETS);

                // ArrowDown: layer 0 → layer 1, target index 0.
                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);

                // ArrowRight×2: target index 0 → 1 → 2.
                pressArrowOnSeriesArea('ArrowRight');
                await waitForChartStability(c);
                pressArrowOnSeriesArea('ArrowRight');
                await waitForChartStability(c);

                // Verify we are on target index 2 before the Up.
                expect(getFocusState(c).seriesIndex).toBe(1);
                expect(getFocusState(c).datumIndex).toBe(2);

                // ArrowUp: should return to layer 0 (bar).
                pressArrowOnSeriesArea('ArrowUp');
                await waitForChartStability(c);

                expect(getFocusState(c).seriesIndex).toBe(0); // back on layer 0
                expect(getFocusState(c).datumIndex).toBe(0); // reset to 0 on layer change

                // Arrows must remain responsive: one more ArrowDown must move into targets again.
                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);

                expect(getFocusState(c).seriesIndex).toBe(1);
                expect(getFocusState(c).datumIndex).toBe(0);
            });
        });

        // AC2a: first-item path — Down then immediately Up.  Must not regress.
        describe('AC2 – no regression of first-item and single-layer paths', () => {
            it('Down then immediately Up still returns to layer 0', async () => {
                const c = await setupKeyNavChart(SEGMENTED_WITH_TARGETS);

                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);
                expect(getFocusState(c).seriesIndex).toBe(1);

                pressArrowOnSeriesArea('ArrowUp');
                await waitForChartStability(c);
                expect(getFocusState(c).seriesIndex).toBe(0);
                expect(getFocusState(c).datumIndex).toBe(0);
            });

            it('ArrowDown while on a non-first target is a no-op (stays on that target, does not jump to target 0)', async () => {
                const c = await setupKeyNavChart(SEGMENTED_WITH_TARGETS);

                // Move into the targets layer and along to target index 2.
                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);
                pressArrowOnSeriesArea('ArrowRight');
                await waitForChartStability(c);
                pressArrowOnSeriesArea('ArrowRight');
                await waitForChartStability(c);
                expect(getFocusState(c).datumIndex).toBe(2);

                // ArrowDown at the bottom layer clamps back to the same layer — it must NOT
                // reset the target index to 0 (the layer did not actually change).
                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);
                expect(getFocusState(c).seriesIndex).toBe(1);
                expect(getFocusState(c).datumIndex).toBe(2);
            });

            it('direct pickFocus: ArrowUp with datumIndex=0 in layer 1 also resolves to layer 0', async () => {
                const c = await setupKeyNavChart(SEGMENTED_WITH_TARGETS);
                const series = c.series[0];

                const pick = series.pickFocus({
                    datumIndex: 0,
                    datumIndexDelta: 0,
                    otherIndex: 0,
                    otherIndexDelta: -1, // Up from layer 1
                });

                expect(pick).toBeDefined();
                expect(pick!.otherIndex).toBe(0);
                expect(pick!.datumIndex).toBe(0);
            });

            it('single-layer gauge (no targets): ArrowDown and ArrowUp stay on layer 0 without getting stuck', async () => {
                const noTargets: AgLinearGaugeOptions = {
                    type: 'linear-gauge',
                    value: 60,
                    scale: { min: 0, max: 100 },
                    segmentation: { enabled: true, interval: { count: 5 } },
                };
                const c = await setupKeyNavChart(noTargets);

                // ArrowDown: no second layer — must not throw or get stuck.
                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);

                const after = getFocusState(c);
                expect(after.seriesIndex).toBe(0); // clamped: only one layer
                expect(after.datum).toBeDefined(); // a valid datum was found

                // A second ArrowDown must also not throw or get stuck.
                pressArrowOnSeriesArea('ArrowDown');
                await waitForChartStability(c);
                expect(getFocusState(c).datum).toBeDefined();
            });

            it('direct pickFocus: single-layer, ArrowDown returns a defined pick on layer 0', async () => {
                const noTargets: AgLinearGaugeOptions = {
                    type: 'linear-gauge',
                    value: 60,
                    scale: { min: 0, max: 100 },
                    segmentation: { enabled: true, interval: { count: 5 } },
                };
                const c = await setupKeyNavChart(noTargets);
                const series = c.series[0];

                const pick = series.pickFocus({
                    datumIndex: 0,
                    datumIndexDelta: 0,
                    otherIndex: 1, // would go to layer 1, but only layer 0 exists → clamped
                    otherIndexDelta: 1, // Down
                });

                // With only layer 0 available, clamp ensures we stay on layer 0.
                expect(pick).toBeDefined();
                expect(pick!.otherIndex).toBe(0);
            });
        });
    });

    describe('bigint values (AG-16608)', () => {
        // A value beyond Number.MAX_SAFE_INTEGER that would lose precision if narrowed to Number.
        const BIG_VALUE = 9_007_199_254_740_993n;
        const BIG_MAX = 9_007_199_254_740_999n;

        const renderAndGetCaption = async (overrides: Partial<AgLinearGaugeOptions>) => {
            const options: AgLinearGaugeOptions = { ...EXAMPLE_OPTIONS, value: BIG_VALUE, ...overrides };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));
            await waitForChartStability(chart);
            return chart.series[0].getCaptionText();
        };

        it('should render the bigint value label at full precision without throwing', async () => {
            const caption = await renderAndGetCaption({ scale: { min: 0n, max: BIG_MAX } });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with a bigint target without throwing', async () => {
            const caption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX },
                targets: [{ value: BIG_VALUE }],
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with bigint scale.interval (step and values) without throwing', async () => {
            const stepCaption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX, interval: { step: 2_000_000_000_000_000n } },
            });
            expect(stepCaption).toContain(BIG_VALUE.toLocaleString());

            chart.destroy();
            const valuesCaption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX, interval: { values: [0n, 5_000_000_000_000_000n] } },
            });
            expect(valuesCaption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with bigint colour stops without throwing', async () => {
            const caption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX },
                bar: {
                    fills: [
                        { color: '#0f0', stop: 0n },
                        { color: '#f00', stop: BIG_MAX },
                    ],
                    fillMode: 'discrete',
                },
            });
            expect(caption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should render with bigint segmentation (step and values) without throwing', async () => {
            const stepCaption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX },
                segmentation: { enabled: true, interval: { step: 2_000_000_000_000_000n } },
            });
            expect(stepCaption).toContain(BIG_VALUE.toLocaleString());

            chart.destroy();
            const valuesCaption = await renderAndGetCaption({
                scale: { min: 0n, max: BIG_MAX },
                segmentation: { enabled: true, interval: { values: [5_000_000_000_000_000n] } },
            });
            expect(valuesCaption).toContain(BIG_VALUE.toLocaleString());
        });

        it('should pass full-precision bigint tick values to the scale label formatter', async () => {
            const seenValues: AgNumericValue[] = [];
            const options: AgLinearGaugeOptions = {
                type: 'linear-gauge',
                value: BIG_VALUE,
                scale: {
                    min: 9_007_199_254_740_000n,
                    max: 9_007_199_254_741_000n,
                    label: {
                        formatter: ({ value }) => {
                            seenValues.push(value);
                            return `${value}`;
                        },
                    },
                },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.createGauge(options));
            await waitForChartStability(chart);

            expect(seenValues.length).toBeGreaterThan(0);
            expect(seenValues.every((value) => typeof value === 'bigint')).toBe(true);
            expect(
                seenValues.some((value) => typeof value === 'bigint' && value > BigInt(Number.MAX_SAFE_INTEGER))
            ).toBe(true);
        });
    });
});
