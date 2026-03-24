import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgRangesButtonValueSource } from 'ag-charts-types';

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

    // CRT-705: When the ranges module is disabled, the `isDropdown` state must be reset so
    // that re-enabling the module starts from a clean state. Without this, the button toolbar
    // may remain hidden if the module was in dropdown mode when disabled.
    describe('enable/disable state reset (CRT-705)', () => {
        it('should reset isDropdown state when ranges is disabled', async () => {
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
                        { label: '50%', value: [5, 15] },
                        { label: 'All', value: [0, 19] },
                    ],
                    // Force dropdown mode via public API (simulates container too small for buttons)
                    dropdown: { visible: 'always' },
                },
            } as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const rangesModule = chartInstance.modulesManager.getModule('ranges') as any;
            expect(rangesModule).toBeDefined();
            expect(rangesModule.isDropdown).toBe(true);

            // Disable ranges via update — isDropdown should be reset
            await chart.update({ ...options, ranges: { ...(options as any).ranges, enabled: false } } as any);
            await waitForChartStability(chart);

            expect(rangesModule.isDropdown).toBeUndefined();
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
                            value: (
                                _start: Date | number,
                                _end: Date | number,
                                _windowStart: Date | number,
                                _windowEnd: Date | number,
                                source: AgRangesButtonValueSource
                            ): [Date | number | undefined, Date | number | undefined] => {
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
});
