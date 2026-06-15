import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgRangesButtonValueFunctionParams, AgRangesButtonValueSource } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

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
