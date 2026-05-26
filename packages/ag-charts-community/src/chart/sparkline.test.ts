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
    deproxy,
    extractImageData,
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
        await waitForChartStability(chartInstance);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
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
    });
});
