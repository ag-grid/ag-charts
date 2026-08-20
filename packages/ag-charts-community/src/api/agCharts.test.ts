import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getDocument } from 'ag-charts-core';
import type { AgChartInstance, AgChartOptions, AgLineSeriesOptions, AgSparklineOptions } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import {
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
} from '../chart/test/utils';

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
        container.remove();
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
        (globalThis as any).agChartsDebug = ['perf', 'pool', 'dev'];
    });

    afterEach(() => {
        delete (globalThis as any).agChartsDebug;
    });

    describe('sparkline optimisations', () => {
        const sparklineOptions: AgSparklineOptions = {
            type: 'line',
            width: 200,
            height: 50,
            data: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
        };

        const fastSettings = {
            width: sparklineOptions.width! + 100,
            height: sparklineOptions.height! + 50,
            data: sparklineOptions.data!.toReversed(),
            container: () => getDocument().createElement('div'),
            // A `context` change must stay on the fast path: the Grid cell renderer passes
            // a fresh per-row `context` on every `update()`, and slow setup would negate it.
            context: { row: 1, cellData: 0.42 },
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
                    { month: 'February', max: 10.4, min: 3 },
                    { month: 'March', max: 10.9, min: 4.7 },
                    { month: 'April', max: 13.7, min: 5 },
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
                    { month: 'February', max: 10.4, min: 3 },
                    { month: 'March', max: 10.9, min: 4.7 },
                    { month: 'April', max: 13.7, min: 5 },
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

        it('should re-resolve theme params on every update() of a reused options object', async () => {
            const options = {
                data: [
                    { month: 'January', min: 2.6 },
                    { month: 'February', min: 3 },
                ],
                series: [{ type: 'line', xKey: 'month', yKey: 'min' }],
                theme: { params: { accentColor: '#ff0000' } },
            } satisfies AgChartOptions;

            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await chart.waitForUpdate();
            const realChart = deproxy(chart);

            expect(realChart.getChartOptions().themeParameters.accentColor).toBe('#ff0000');

            options.theme.params.accentColor = '#00ff00';
            await chart.update(options);
            await chart.waitForUpdate();

            expect(realChart.getChartOptions().themeParameters.accentColor).toBe('#00ff00');

            options.theme.params.accentColor = '#0000ff';
            await chart.update(options);
            await chart.waitForUpdate();

            expect(realChart.getChartOptions().themeParameters.accentColor).toBe('#0000ff');
        });

        it('should handle disabled preset nested options', async () => {
            const options: AgSparklineOptions = {
                type: 'line',
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

    describe('itemStyler unsupported color formats', () => {
        function findFill(node: any, target: string): boolean {
            if (node?.fill === target) return true;
            if (typeof node?.children === 'function') {
                return node.children().some((child: any) => findFill(child, target));
            }
            return false;
        }

        // Styler results are validated at the `callbackDefs` layer, which runs the generic `color`
        // validator over each returned property, so the container is irrelevant to the outcome.
        it('warns once and drops an itemStyler fill in an unsupported color format', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 'a', y: 1 },
                    { x: 'b', y: 2 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: () => ({ fill: 'lab(50% 40 59.5)' }),
                    },
                ],
            };
            prepareTestOptions(options, container);

            chart = AgCharts.create(options);
            await chart.waitForUpdate();

            expectWarningsCalls().toEqual([
                [
                    expect.stringMatching(
                        /Callback `series\[0]\.itemStyler` returned an invalid property `series\[0]\.itemStyler\.fill`: `"lab\(50% 40 59\.5\)"`/
                    ),
                ],
            ]);

            const realChart = deproxy(chart);
            for (const series of realChart.series as any[]) {
                expect(findFill(series.contentGroup, 'lab(50% 40 59.5)')).toBe(false);
            }
        });

        it('still warns and drops the color when the chart has no container', async () => {
            const options: AgChartOptions = {
                data: [{ x: 'a', y: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: () => ({ fill: 'lab(50% 40 59.5)' }),
                    },
                ],
            };
            prepareTestOptions(options);
            options.container = undefined;

            chart = AgCharts.create(options);
            await chart.waitForUpdate();

            expectWarningsCalls().toEqual([
                [
                    expect.stringMatching(
                        /Callback `series\[0]\.itemStyler` returned an invalid property `series\[0]\.itemStyler\.fill`: `"lab\(50% 40 59\.5\)"`/
                    ),
                ],
            ]);
        });
    });
    describe('invalid options', () => {
        const expectedError =
            /^AG Charts - AgCharts\.create\(\) requires a non-empty options object; a minimal chart specifies a `container` and `series` \(or `data`\)\./;

        it('throws a descriptive error when called with no argument', () => {
            expect(() => (AgCharts.create as any)()).toThrowError(expectedError);
        });

        it.each([
            ['undefined', undefined],
            ['null', null],
            ['a number', 3],
            ['a string', 'abc'],
            ['an empty string', ''],
            ['an empty array', []],
            ['an empty object', {}],
        ])('throws a descriptive error for %s', (_name, options) => {
            expect(() => AgCharts.create(options as any)).toThrowError(expectedError);
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it('names the value it received', () => {
            expect(() => AgCharts.create(3 as any)).toThrowError(/Received a number \(3\)\.$/);
            expect(() => AgCharts.create('abc' as any)).toThrowError(/Received a string \('abc'\)\.$/);
            expect(() => AgCharts.create([] as any)).toThrowError(/Received an array\.$/);
            expect(() => AgCharts.create({} as any)).toThrowError(/Received an empty object\.$/);
            expect(() => AgCharts.create(null as any)).toThrowError(/Received null\.$/);
            expect(() => AgCharts.create(undefined as any)).toThrowError(/Received undefined\.$/);
        });

        it.each([
            ['createFinancialChart', () => AgCharts.createFinancialChart(undefined as any)],
            ['createGauge', () => AgCharts.createGauge(undefined as any)],
            ['createQuadrantChart', () => AgCharts.createQuadrantChart(undefined as any)],
            ['__createSparkline', () => AgCharts.__createSparkline(undefined as any)],
        ])('names %s in the error it throws', (methodName, call) => {
            expect(call).toThrowError(
                new RegExp(`^AG Charts - AgCharts\\.${methodName}\\(\\) requires a non-empty options object`)
            );
        });

        it('rejects a sparkline whose only option is `pool`', () => {
            expect(() => AgCharts.__createSparkline({ pool: true } as any)).toThrowError(
                /^AG Charts - AgCharts\.__createSparkline\(\) requires a non-empty options object/
            );
        });

        it('does not throw for a non-empty object that is missing `container` or `series`', async () => {
            // The guard rejects arguments that cannot be options; per-option problems stay on the
            // existing warn-and-continue path, and `container` is optional by design.
            expect(() => (chart = AgCharts.create({ foo: true } as any))).not.toThrow();
            await chart.waitForUpdate();

            expectWarningsCalls().toEqual([[expect.stringMatching(/Unknown option `foo`/)]]);
        });

        it('still creates a chart from valid options', async () => {
            const options: AgChartOptions = {
                container,
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await chart.waitForUpdate();

            expect(deproxy(chart).series).toHaveLength(1);
        });
    });
});
