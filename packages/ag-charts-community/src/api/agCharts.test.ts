import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { getDocument } from 'ag-charts-core';
import type { AgChartInstance, AgChartOptions, AgLineSeriesOptions, AgSparklineOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { deproxy, prepareTestOptions, resetMockConsole, setupMockCanvas, setupMockConsole } from '../chart/test/utils';

describe('AgCharts', () => {
    setupMockConsole({ includeAllLevels: true });

    setupMockCanvas();
    let chart: AgChartInstance;
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        document.body.removeChild(container);
    });

    function expectCachedLogs() {
        expect(console.log).toHaveBeenCalledWith('ChartOptions.isFastPathDelta() - fast path possible.');
        expect(console.log).not.toHaveBeenCalledWith(
            '[CACHE] ChartTheme',
            'miss',
            'createChartTheme',
            expect.any(Object)
        );
    }

    function expectNonCachedLogs() {
        expect(console.log).toHaveBeenCalledWith('ChartOptions.slowSetup()');
        expect(console.log).toHaveBeenCalledWith('[CACHE] ChartTheme', 'miss', 'createChartTheme', expect.anything());
    }

    function expectPoolCreationLogs() {
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Pool[name=sparkline]: Created instance'),
            expect.any(Object)
        );
    }

    function expectPoolReleaseLogs() {
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Pool[name=sparkline]: Returned instance'),
            expect.any(Object)
        );
    }

    function expectPoolReuseLogs() {
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Pool[name=sparkline]: Re-used instance'),
            expect.any(Object)
        );
    }

    function expectNoPoolActivityLogs() {
        expect(console.log).not.toHaveBeenCalledWith(expect.stringMatching(/Pool\[name=.*\]/), expect.any(Object));
    }

    beforeEach(() => {
        (window as any).agChartsDebug = ['perf', 'pool', 'dev'];
    });

    afterEach(() => {
        delete (window as any).agChartsDebug;
    });

    describe('sparkline optimisations', () => {
        const sparklineOptions = {
            width: 200,
            height: 50,
            data: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
        };

        const fastSettings = {
            width: sparklineOptions.width + 100,
            height: sparklineOptions.height + 50,
            data: sparklineOptions.data.toReversed(),
            container: () => getDocument().createElement('div'),
        };

        describe('#__createSparkline', () => {
            it('should use pooling by default', async () => {
                const options = { ...sparklineOptions };
                prepareTestOptions(options, container);

                const sparkline = AgCharts.__createSparkline(options);
                await sparkline.waitForUpdate();

                expectPoolCreationLogs();
            });

            it('should use slow setup by default', async () => {
                const options = { ...sparklineOptions };
                prepareTestOptions(options, container);

                const sparkline = AgCharts.__createSparkline(options);
                await sparkline.waitForUpdate();

                expectNonCachedLogs();
            });

            it('should use fast setup for re-used instances', async () => {
                const options = { ...sparklineOptions };
                prepareTestOptions(options, container);

                const sparkline = AgCharts.__createSparkline(options);
                await sparkline.waitForUpdate();

                resetMockConsole();
                sparkline.destroy();
                expectPoolReleaseLogs();

                resetMockConsole();
                const sparkline2 = AgCharts.__createSparkline(options);
                await sparkline2.waitForUpdate();

                expectPoolReuseLogs();
                expectCachedLogs();
            });
        });

        describe('for update()', () => {
            for (const property in fastSettings) {
                it(`should use fast setup for ${property} with update()`, async () => {
                    let options = { ...sparklineOptions };
                    prepareTestOptions(options, container);

                    const sparkline = AgCharts.__createSparkline(options);
                    await sparkline.waitForUpdate();

                    resetMockConsole();

                    const propertyValue = fastSettings[property as keyof typeof fastSettings];
                    options = {
                        ...options,
                        [property]: propertyValue instanceof Function ? propertyValue() : propertyValue,
                    };

                    await sparkline.update(options);

                    expectCachedLogs();
                    expectNoPoolActivityLogs();
                });
            }
        });

        describe('for updateDelta()', () => {
            for (const property in fastSettings) {
                it(`should use fast setup for ${property} with updateDelta()`, async () => {
                    const options = { ...sparklineOptions };
                    prepareTestOptions(options, container);

                    const sparkline = AgCharts.__createSparkline(options);
                    await sparkline.waitForUpdate();

                    resetMockConsole();

                    const propertyValue = fastSettings[property as keyof typeof fastSettings];
                    const update = {
                        [property]: propertyValue instanceof Function ? propertyValue() : propertyValue,
                    };

                    await sparkline.updateDelta(update);

                    expectCachedLogs();
                    expectNoPoolActivityLogs();
                });
            }
        });
    });

    describe('option mutability', () => {
        it('should handle deep options mutations', async () => {
            const options = {
                data: [
                    { month: 'January', max: 8.5, min: 2.6 },
                    { month: 'February', max: 10.4, min: 3.0 },
                    { month: 'March', max: 10.9, min: 4.7 },
                    { month: 'April', max: 13.7, min: 5.0 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'min',
                        interpolation: { type: 'smooth' },
                    },
                ],
            } satisfies AgChartOptions;

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await chart.waitForUpdate();

            expect(chart.getOptions().series?.[0]).toStrictEqual({
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'smooth' },
            });

            options.series[0].interpolation = { type: 'smooth', tension: 1 } as any;
            await chart.update(options);
            await chart.waitForUpdate();

            expect(chart.getOptions().series?.[0]).toStrictEqual({
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'smooth', tension: 1 },
            });

            options.series[0].interpolation = { type: 'linear' } as any;
            await chart.update(options);

            expect(chart.getOptions().series?.[0]).toStrictEqual({
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'linear' },
            });
        });

        it('should handle deep options enablement mutations', async () => {
            const options = {
                data: [
                    { month: 'January', max: 8.5, min: 2.6 },
                    { month: 'February', max: 10.4, min: 3.0 },
                    { month: 'March', max: 10.9, min: 4.7 },
                    { month: 'April', max: 13.7, min: 5.0 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'month',
                        yKey: 'min',
                        marker: {
                            enabled: false,
                            fill: { type: 'gradient' },
                            stroke: 'blue',
                        },
                    },
                ],
            } satisfies AgChartOptions;

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await chart.waitForUpdate();
            const realChart = deproxy(chart);

            let series = realChart.getChartOptions().processedOptions.series?.[0] as AgLineSeriesOptions;
            expect(series.marker).toMatchObject({
                enabled: false,
            });

            options.series[0].marker.enabled = true as any;
            await chart.update(options);

            series = realChart.getChartOptions().processedOptions.series?.[0] as AgLineSeriesOptions;
            expect(series.marker).toMatchObject({
                enabled: true,
                fill: { type: 'gradient' },
                stroke: 'blue',
            });

            options.series[0].marker.enabled = false;
            await chart.update(options);

            series = realChart.getChartOptions().processedOptions.series?.[0] as AgLineSeriesOptions;
            expect(series.marker).toMatchObject({
                enabled: false,
            });
        });

        it('should handle disabled preset nested options', async () => {
            const options: AgSparklineOptions = {
                width: 200,
                height: 50,
                data: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
                marker: { enabled: false, fill: { type: 'gradient' } }, // Previously failed due to dev mode + user option mutation bug.
            };
            prepareTestOptions(options, container);

            const sparkline = AgCharts.__createSparkline(options);
            await sparkline.waitForUpdate();
        });
    });
});
