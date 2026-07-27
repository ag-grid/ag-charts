import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgRangesButtonValueFunctionParams, AgRangesButtonValueSource } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { Ranges } from './ranges';

describe('Ranges', () => {
    setupMockConsole();
    let chart: AgChartInstance;
    setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as any) = undefined;
        }
    });

    describe('toolbar height caching', () => {
        // Exercises the private helper directly: JSDOM reports offsetHeight as 0, so a full-chart
        // test cannot drive the non-zero measurement path this cache is about.
        interface RangesInternals {
            getToolbarHeight(opts: object, toolbar: { getBounds(): { height: number } }): number;
            invalidateToolbarHeightCache(): void;
            isDropdown?: boolean;
            dropdownLabel?: string;
        }
        function createRanges(): RangesInternals {
            return Object.create(Ranges.prototype) as RangesInternals;
        }

        it('measures once and reuses the height while the key is unchanged', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(24);
            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(24);
            expect(toolbar.getBounds).toHaveBeenCalledTimes(1);
        });

        it('re-measures when the resolved options reference changes', () => {
            const ranges = createRanges();
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            ranges.getToolbarHeight({}, toolbar);
            ranges.getToolbarHeight({}, toolbar);

            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });

        it('re-measures when the shown toolbar toggles to the dropdown', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            ranges.isDropdown = false;
            ranges.getToolbarHeight(opts, toolbar);
            ranges.isDropdown = true;
            ranges.getToolbarHeight(opts, toolbar);

            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });

        // Text metrics are not part of the key, so the `font:load` listener must reset the cache;
        // without this a late webfont leaves the height pinned to fallback-font metrics.
        it('re-measures after the cache is invalidated by a font load', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 24 })) };

            ranges.getToolbarHeight(opts, toolbar);
            ranges.invalidateToolbarHeightCache();

            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(24);
            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });

        it('never caches a zero height (toolbar not yet laid out)', () => {
            const ranges = createRanges();
            const opts = {};
            const toolbar = { getBounds: vi.fn(() => ({ height: 0 })) };

            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(0);
            expect(ranges.getToolbarHeight(opts, toolbar)).toBe(0);
            expect(toolbar.getBounds).toHaveBeenCalledTimes(2);
        });
    });

    describe('AG-16886 button value function source parameter', () => {
        it('should pass source parameter to AgRangesButtonValueFunction', async () => {
            const receivedSources: AgRangesButtonValueSource[] = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: ({ source }: AgRangesButtonValueFunctionParams) => {
                                receivedSources.push(source);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // The range-check source should have been received during initial button enablement validation
            expect(receivedSources).toContain('range-check');
        });
    });

    describe('AG-16892 button value function params object', () => {
        it('should pass a params object with the domain and window bounds', async () => {
            const receivedParams: AgRangesButtonValueFunctionParams[] = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: (params: AgRangesButtonValueFunctionParams) => {
                                receivedParams.push(params);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(receivedParams.length).toBeGreaterThan(0);
            const params = receivedParams[0];
            expect(typeof params.start).toBe('number');
            expect(typeof params.end).toBe('number');
            expect(typeof params.windowStart).toBe('number');
            expect(typeof params.windowEnd).toBe('number');
        });
    });

    describe('AG-17538 button value function context parameter', () => {
        interface RangesContext {
            tz: string;
        }

        it('should pass the chart-level context to the value function', async () => {
            const receivedContexts: Array<RangesContext | undefined> = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                context: { tz: 'UTC' },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: ({ context }: AgRangesButtonValueFunctionParams<RangesContext>) => {
                                receivedContexts.push(context);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(receivedContexts.length).toBeGreaterThan(0);
            expect(receivedContexts[0]).toEqual({ tz: 'UTC' });
        });

        it('should pass undefined context when none is configured', async () => {
            const receivedContexts: Array<RangesContext | undefined> = [];

            const options: AgCartesianChartOptions = prepareEnterpriseTestOptions({
                data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: 'Custom',
                            value: ({ context }: AgRangesButtonValueFunctionParams) => {
                                receivedContexts.push(context as RangesContext | undefined);
                                return [5, 15];
                            },
                        },
                    ],
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            expect(receivedContexts.length).toBeGreaterThan(0);
            expect(receivedContexts[0]).toBeUndefined();
        });
    });
});
