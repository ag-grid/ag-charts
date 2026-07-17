import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AgCharts } from '../api/agCharts';
import { __clearStructuralCacheForTests } from '../module/optionsStructuralCache';
import type { Chart } from './chart';
import { __clearSanitizedThemeCacheForTests } from './factory/processModuleOptions';
import { __clearChartThemeCacheForTests } from './mapping/themes';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Sparkline', () => {
    setupMockConsole();

    let chart: Chart | undefined;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas({ width: 200, height: 100 });

    const compare = async (chartInstance: Chart, options?: MatchImageSnapshotOptions) => {
        await compareImageSnapshot(chartInstance, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
    };

    describe('unhighlightDelay', () => {
        it('should have unhighlightDelay set to 0 for sparklines (CRT-1012)', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            // Sparklines should have immediate unhighlight (no delay) to avoid laggy tooltips
            expect(chart.ctx.highlightManager.unhighlightDelay).toBe(0);
        });
    });

    describe('itemStyler', () => {
        it('Handles bar series', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'bar',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
                itemStyler({ first, last, min, max }) {
                    if (first) {
                        return { fill: 'red' };
                    } else if (last) {
                        return { fill: 'blue' };
                    } else if (min) {
                        return { fill: 'green' };
                    } else if (max) {
                        return { fill: 'yellow' };
                    }
                    return { fill: 'gray' };
                },
            });
            chart = deproxy(instance);

            await compare(chart);
        });

        it('Handles line series', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
                marker: {
                    enabled: true,
                    size: 6,
                    itemStyler({ first, last, min, max }) {
                        if (first) {
                            return { fill: 'red' };
                        } else if (last) {
                            return { fill: 'blue' };
                        } else if (min) {
                            return { fill: 'green' };
                        } else if (max) {
                            return { fill: 'yellow' };
                        }
                        return { fill: 'gray' };
                    },
                },
            });
            chart = deproxy(instance);

            await compare(chart);
        });

        it('Handles area series', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'area',
                data: [2, 3, 4, 1, 2],
                width: 200,
                height: 100,
                marker: {
                    enabled: true,
                    size: 6,
                    itemStyler({ first, last, min, max }) {
                        if (first) {
                            return { fill: 'red' };
                        } else if (last) {
                            return { fill: 'blue' };
                        } else if (min) {
                            return { fill: 'green' };
                        } else if (max) {
                            return { fill: 'yellow' };
                        }
                        return { fill: 'gray' };
                    },
                },
            });
            chart = deproxy(instance);

            await compare(chart);
        });
    });

    describe('optimisation probes (AG-17227)', () => {
        // These tests assert that the perf-critical caches and shared-resource registries
        // are actually being hit for sparklines. They use the `agChartsDebug` selector to
        // capture lightweight probe messages emitted at each optimisation boundary; if a
        // refactor stops the optimisation from triggering (different cache key shape,
        // wrong mode flag, etc.), the probe count changes and the test fails loudly.

        setupMockConsole({ includeAllLevels: true });

        let extraCharts: Chart[];

        beforeEach(() => {
            __clearStructuralCacheForTests();
            __clearSanitizedThemeCacheForTests();
            __clearChartThemeCacheForTests();
            (globalThis as any).agChartsDebug = ['opts', 'theme'];
            extraCharts = [];
        });

        afterEach(() => {
            for (const c of extraCharts) c.destroy();
            delete (globalThis as any).agChartsDebug;
        });

        const probeCalls = (prefix: string, label: string) =>
            (console.log as Mock).mock.calls.filter((args) => args[0] === prefix && args[1] === label);

        const createSparkline = (overrides: object = {}) => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [1, 2, 3, 4, 5],
                width: 200,
                height: 100,
                ...overrides,
            });
            const c = deproxy(instance);
            extraCharts.push(c);
            return c;
        };

        it('hits the structural options cache when a second sparkline shares the same option shape', async () => {
            const a = createSparkline({ data: [1, 2, 3, 4, 5] });
            await waitForChartStability(a);
            createSparkline({ data: [10, 20, 30, 40, 50] }); // same shape, different values

            // Caches reset in beforeEach — expect a cold miss followed by a hit.
            expect(probeCalls('[CACHE] StructuralOptions', 'miss').length).toBe(1);
            expect(probeCalls('[CACHE] StructuralOptions', 'hit').length).toBe(1);
        });

        it('hits the sanitized-theme cache when sparklines share a theme reference', async () => {
            const a = createSparkline();
            await waitForChartStability(a);
            createSparkline({ data: [9, 8, 7, 6, 5] });

            // Two charts on the default theme reference resolve through the same cached
            // ChartTheme, so the sanitized-theme cache must report at least one hit.
            expect(probeCalls('[CACHE] SanitizedTheme', 'hit').length).toBeGreaterThanOrEqual(1);
        });

        it('shares the global DOM listener registry across sparklines on the same Window', async () => {
            const a = createSparkline();
            await waitForChartStability(a);
            const b = createSparkline();
            await waitForChartStability(b);

            const firsts = probeCalls('[REGISTRY] DOMManager.globalListeners', 'first-subscribe');
            const shareds = probeCalls('[REGISTRY] DOMManager.globalListeners', 'shared-subscribe');
            // While both charts are alive, exactly one Window-level entry exists.
            expect(firsts.length).toBe(1);
            expect(shareds.length).toBeGreaterThanOrEqual(1);
        });

        it('shares the devicePixelRatio observer across sparklines on the same Window', async () => {
            const a = createSparkline();
            await waitForChartStability(a);
            const b = createSparkline();
            await waitForChartStability(b);

            const firsts = probeCalls('[REGISTRY] PixelRatioObserver.shared', 'first-subscribe');
            const shareds = probeCalls('[REGISTRY] PixelRatioObserver.shared', 'shared-subscribe');
            expect(firsts.length).toBe(1);
            expect(shareds.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('structural cache (AG-17227)', () => {
        it('does not alias data across cache-hit instances with same shape, different values', async () => {
            const baseOptions = { type: 'line' as const, width: 200, height: 100 };
            const instanceA = AgCharts.__createSparkline({ ...baseOptions, data: [1, 2, 3, 4, 5] });
            const chartA = deproxy(instanceA);
            await waitForChartStability(chartA);

            const instanceB = AgCharts.__createSparkline({ ...baseOptions, data: [10, 20, 30, 40, 50] });
            const chartB = deproxy(instanceB);
            await waitForChartStability(chartB);

            const aData = chartA.chartOptions.processedOptions.data as Array<{ y: number }>;
            const bData = chartB.chartOptions.processedOptions.data as Array<{ y: number }>;
            expect(aData).not.toBe(bData);
            expect(aData.map((d) => d.y)).toEqual([1, 2, 3, 4, 5]);
            expect(bData.map((d) => d.y)).toEqual([10, 20, 30, 40, 50]);

            chartB.destroy();
            chart = chartA;
        });

        it('does not alias context across cache-hit instances with same shape, different context', async () => {
            const baseOptions = { type: 'line' as const, width: 200, height: 100, data: [1, 2, 3] };
            const contextA = { row: 1, cellValue: 'A' };
            const contextB = { row: 2, cellValue: 'B' };

            const instanceA = AgCharts.__createSparkline({ ...baseOptions, context: contextA });
            const chartA = deproxy(instanceA);
            await waitForChartStability(chartA);

            const instanceB = AgCharts.__createSparkline({ ...baseOptions, context: contextB });
            const chartB = deproxy(instanceB);
            await waitForChartStability(chartB);

            expect(chartA.context).toBe(contextA);
            expect(chartB.context).toBe(contextB);

            chartB.destroy();
            chart = chartA;
        });

        it('does not alias container across cache-hit instances with same shape, different container', async () => {
            const baseOptions = { type: 'line' as const, width: 200, height: 100, data: [1, 2, 3] };
            const containerA = document.createElement('div');
            const containerB = document.createElement('div');
            document.body.append(containerA, containerB);

            const instanceA = AgCharts.__createSparkline({ ...baseOptions, container: containerA });
            const chartA = deproxy(instanceA);
            await waitForChartStability(chartA);

            const instanceB = AgCharts.__createSparkline({ ...baseOptions, container: containerB });
            const chartB = deproxy(instanceB);
            await waitForChartStability(chartB);

            expect(chartA.container).toBe(containerA);
            expect(chartB.container).toBe(containerB);

            chartB.destroy();
            containerA.remove();
            containerB.remove();
            chart = chartA;
        });
    });

    describe('chart-level context propagation (AG-17227)', () => {
        // JSDOM cannot canvas-pick, so a synthesised hover never reaches the renderer;
        // invoking `formatTooltip` directly mirrors what hover would otherwise trigger.
        const invokeTooltipRenderer = (c: Chart) => {
            const series = c.series[0] as any;
            const tooltip = series.properties.tooltip;
            const params: any = {
                datum: { x: 0, y: 1 },
                xKey: 'x',
                yKey: 'y',
                xValue: 0,
                yValue: 1,
                seriesId: series.id,
                title: undefined,
                color: undefined,
            };
            tooltip.formatTooltip([series.properties, series.ctx.chartService], { data: [] }, params);
        };

        it('passes chart-level context to tooltip.renderer params', async () => {
            const seen: unknown[] = [];
            const userContext = { tag: 'row-42' };
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [1, 2, 3],
                width: 200,
                height: 100,
                context: userContext,
                tooltip: {
                    renderer: (params) => {
                        seen.push(params.context);
                        return { content: String(params.yValue) };
                    },
                },
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            invokeTooltipRenderer(chart);

            expect(seen.length).toBeGreaterThan(0);
            for (const ctxValue of seen) {
                expect(ctxValue).toBe(userContext);
            }
        });

        it('does not alias context between sparklines sharing a user renderer reference', async () => {
            const seen: unknown[] = [];
            const renderer = (params: any) => {
                seen.push(params.context);
                return { content: String(params.yValue) };
            };

            const contextA = { tag: 'row-A' };
            const contextB = { tag: 'row-B' };

            const baseOptions = {
                type: 'line' as const,
                data: [1, 2, 3],
                width: 200,
                height: 100,
                tooltip: { renderer },
            };

            // A shared renderer reference must not let one chart's context leak into the
            // other's, whether or not the structural cache or memoised wrapper is shared.
            const instanceA = AgCharts.__createSparkline({ ...baseOptions, context: contextA });
            const chartA = deproxy(instanceA);
            await waitForChartStability(chartA);

            const instanceB = AgCharts.__createSparkline({ ...baseOptions, context: contextB });
            const chartB = deproxy(instanceB);
            await waitForChartStability(chartB);

            invokeTooltipRenderer(chartA);
            const seenForA = seen.length;
            invokeTooltipRenderer(chartB);

            expect(seen.length).toBeGreaterThan(seenForA);
            for (let i = 0; i < seenForA; i++) expect(seen[i]).toBe(contextA);
            for (let i = seenForA; i < seen.length; i++) expect(seen[i]).toBe(contextB);

            chartB.destroy();
            chart = chartA;
        });
    });

    describe('default tooltip content (AG-17227)', () => {
        // The preset must produce a useful default tooltip without a user `renderer`
        // function, which would otherwise poison the structural-cache key for the Grid case.

        const renderDefaultTooltip = (c: Chart, datum: any, xKey: string, yKey: string) => {
            const series = c.series[0] as any;
            const tooltip = series.properties.tooltip;
            const xValue = datum[xKey];
            const yValue = datum[yKey];
            const params: any = {
                datum,
                xKey,
                yKey,
                xValue,
                yValue,
                seriesId: series.id,
                title: undefined,
                color: undefined,
            };
            return tooltip.formatTooltip([series.properties, series.ctx.chartService], { data: [] }, params);
        };

        it('omits the synthesised x index from number-array data', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [10, 20, 30],
                width: 200,
                height: 100,
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            // sparklineDataPreset maps numbers to { x: index, y: value } with datumKey: 'y'.
            const result: any = renderDefaultTooltip(chart, { x: 1, y: 20 }, 'x', 'y');
            const html = JSON.stringify(result);
            expect(html).toContain('20');
            expect(html).not.toContain('1 20'); // would indicate the synthesised index leaked through
        });

        it('includes the x value for tuple-array data', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [
                    [0, 10],
                    [1, 20],
                ],
                width: 200,
                height: 100,
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            // tuple data → datumKey: 'datum' (preserved original tuple). xValue is real.
            const result: any = renderDefaultTooltip(chart, { x: 1, y: 20, datum: [1, 20] }, 'x', 'y');
            const html = JSON.stringify(result);
            expect(html).toContain('1 20');
        });

        it('includes the x value for user-supplied xKey on object data', async () => {
            const instance = AgCharts.__createSparkline({
                type: 'line',
                xKey: 'date',
                yKey: 'value',
                data: [
                    { date: 'Jan', value: 10 },
                    { date: 'Feb', value: 20 },
                ],
                width: 200,
                height: 100,
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            // object data with user xKey → datumKey undefined. xValue is real.
            const result: any = renderDefaultTooltip(chart, { date: 'Feb', value: 20 }, 'date', 'value');
            const html = JSON.stringify(result);
            expect(html).toContain('Feb 20');
        });

        it('omits the x value when a user renderer supplies only a title', async () => {
            // Regression (AG-17227): a title-only renderer must not let the default content
            // leak the x value into the value slot — the Grid suppressed x when a title was set.
            const instance = AgCharts.__createSparkline({
                type: 'line',
                data: [
                    [0, 10],
                    [1, 20],
                ],
                width: 200,
                height: 100,
                tooltip: {
                    renderer: () => ({ title: 'sym' }),
                },
            });
            chart = deproxy(instance);
            await waitForChartStability(chart);

            const result: any = renderDefaultTooltip(chart, { x: 1, y: 20, datum: [1, 20] }, 'x', 'y');
            const html = JSON.stringify(result);
            expect(html).toContain('sym');
            expect(html).toContain('20');
            expect(html).not.toContain('1 20'); // x suppressed because a title was supplied
        });
    });
});
