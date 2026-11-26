import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ModuleDefinition, ModuleRegistry, SizeMonitor, enterpriseRegistry, getDocument } from 'ag-charts-core';
import type {
    AgChartInstance,
    AgChartOptions,
    AgChartTheme,
    AgLineSeriesOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { BarSeriesModule } from '../chart/series/cartesian/barSeriesModule';
import { LineSeriesModule } from '../chart/series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../chart/series/cartesian/scatterSeriesModule';
import { PieSeriesModule } from '../chart/series/polar/pieSeriesModule';
import { setAgChartsDebug } from '../chart/test/seriesAccessors';
import {
    createChart,
    deproxy,
    expectErrorsCalls,
    expectWarningsCalls,
    prepareTestOptions,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../chart/test/utils';
import { getManagerSizeMonitor } from '../dom/test/domAccessors';
import { CategoryAxisModule } from '../module/axis-modules/categoryAxisModule';
import { NumberAxisModule } from '../module/axis-modules/numberAxisModule';
import { fakeComputedStyle, invalidOption } from '../module/test/moduleAccessors';

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
        if (chart != null) {
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

    let restoreAgChartsDebug: () => void;

    beforeEach(() => {
        restoreAgChartsDebug = setAgChartsDebug(['perf', 'pool', 'dev']);
    });

    afterEach(() => {
        restoreAgChartsDebug();
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
            // The Grid cell renderer passes a fresh per-row `context` on every `update()`, so it must stay on the fast path.
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

    // `injectStyles` is read when the proxy first builds a chart, and pinned for the life of the proxy.
    describe('injectStyles', () => {
        const CHANGED = (mode: boolean) =>
            `AG Charts - injectStyles cannot be changed after the chart is created; it stays ${mode}.`;
        const MISSING_ENTERPRISE =
            'AG Charts - injectStyles is false, but the AG Charts stylesheet is not loaded. Add ag-charts-enterprise/css/ag-charts-enterprise.css to the page.';
        const GOOGLE_FONTS =
            "AG Charts - loadGoogleFonts has no effect when injectStyles is false. Load the fonts from the page's own stylesheet.";

        const barOptions = (extra: Partial<AgChartOptions> = {}): AgChartOptions =>
            prepareTestOptions(
                {
                    data: [{ x: 'A', y: 1, v: 3 }],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                    ...extra,
                } as AgChartOptions,
                container
            );
        const pieOptions = (extra: Partial<AgChartOptions> = {}): AgChartOptions =>
            prepareTestOptions(
                { data: [{ x: 'A', v: 3 }], series: [{ type: 'pie', angleKey: 'v' }], ...extra } as AgChartOptions,
                container
            );
        const styleCount = () => document.querySelectorAll('style').length;
        const modeOf = (instance: AgChartInstance<any>) => deproxy(instance).ctx.domManager.injectStyles;
        const warnCount = (text: string) =>
            (console.warn as Mock).mock.calls.filter(([message]) => message === text).length;
        const sparklineOptions = (extra: Record<string, unknown> = {}): AgSparklineOptions => {
            const options = prepareTestOptions<AgSparklineOptions>(
                { type: 'line', width: 200, height: 50, data: [0.1, 0.2, 0.3] },
                container
            );
            return Object.assign(options, extra);
        };
        // jsdom loads no stylesheet, so without this a static chart reports the stylesheet it needs as missing.
        let computedStyleSpy: Mock | undefined;
        beforeEach(() => {
            const real = globalThis.getComputedStyle.bind(globalThis);
            computedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((el, pseudo) => {
                const style = real(el, pseudo);
                return new Proxy(style, {
                    get(target, prop) {
                        if (prop === 'getPropertyValue') {
                            return (name: string) =>
                                name === '--ag-charts-css-loaded' ? '1' : target.getPropertyValue(name);
                        }
                        const value = Reflect.get(target, prop);
                        return typeof value === 'function' ? value.bind(target) : value;
                    },
                });
            }) as unknown as Mock;
        });
        afterEach(() => {
            computedStyleSpy?.mockRestore();
            // Only the warnings these tests assert on are expected; the console mock fails the test on any other.
            const expected = new Set([CHANGED(true), CHANGED(false), GOOGLE_FONTS, MISSING_ENTERPRISE]);
            const unexpected = (console.warn as Mock).mock.calls.filter(([message]) => !expected.has(message));
            (console.warn as Mock).mockClear();
            expect(unexpected).toEqual([]);
        });

        // The pool's debug log carries the chart itself, which a failed assertion would try to print in full.
        const poolEvents = () =>
            (console.log as Mock).mock.calls
                .map(([message]) => String(message))
                .filter((message) => message.startsWith('Pool['))
                .map((message) => message.replace(/ \(.*$/, ''));

        it.each([
            { injectStyles: undefined, mode: true },
            { injectStyles: true, mode: true },
            { injectStyles: false, mode: false },
        ])('resolves $injectStyles to $mode', async ({ injectStyles, mode }) => {
            const before = styleCount();

            chart = await createChart(barOptions({ injectStyles }));

            expect(modeOf(chart)).toBe(mode);
            // Static adds nothing anywhere. Injecting may add nothing too: the document keeps the styles an
            // earlier chart injected, so only the static side is asserted.
            if (!mode) expect(styleCount()).toBe(before);
        });

        it('resolves the mode from the theme when the option is unset', async () => {
            const options = barOptions();
            const theme = options.theme as AgChartTheme;
            theme.overrides = { ...theme.overrides, common: { injectStyles: false } };

            chart = await createChart(options);

            expect(modeOf(chart)).toBe(false);
        });

        it('keeps the mode when an update changes the chart type', async () => {
            chart = await createChart(barOptions({ injectStyles: false }));
            const before = styleCount();
            const first = deproxy(chart);

            // Omitting the option resolves to `true`, which the pin overrides, silently.
            await chart.update(pieOptions());

            expect(deproxy(chart)).not.toBe(first);
            expect(modeOf(chart)).toBe(false);
            expect(styleCount()).toBe(before);
            expect(warnCount(CHANGED(false))).toBe(0);
        });

        it('keeps a static mode when the update asks for the other one, warning once', async () => {
            chart = await createChart(barOptions({ injectStyles: false }));
            const before = styleCount();

            await chart.update(pieOptions({ injectStyles: true }));
            await chart.update(pieOptions({ injectStyles: true }));
            await chart.updateDelta({ injectStyles: true });

            expect(modeOf(chart)).toBe(false);
            expect(styleCount()).toBe(before);
            expect(warnCount(CHANGED(false))).toBe(1);
        });

        it('keeps an injecting mode when the update asks for static, warning once', async () => {
            chart = await createChart(barOptions());

            await chart.update(pieOptions({ injectStyles: false }));
            await chart.updateDelta({ injectStyles: false });

            expect(modeOf(chart)).toBe(true);
            expect(warnCount(CHANGED(true))).toBe(1);
        });

        it('is silent when an update repeats the pinned value', async () => {
            chart = await createChart(barOptions({ injectStyles: false }));

            await chart.update(barOptions({ injectStyles: false }));
            await chart.updateDelta({ injectStyles: false });

            expect(warnCount(CHANGED(false))).toBe(0);
            expect(warnCount(CHANGED(true))).toBe(0);
        });

        it('warns once that loadGoogleFonts has no effect, and loads no fonts', async () => {
            const options = barOptions({ injectStyles: false, loadGoogleFonts: true });
            const theme = options.theme as AgChartTheme;
            theme.params = { ...theme.params, fontFamily: { googleFont: 'Roboto' } };
            chart = await createChart(options);
            await chart.update(options);

            expect(warnCount(GOOGLE_FONTS)).toBe(1);
            expect(
                Array.from(document.querySelectorAll('style')).some((el) => el.textContent?.includes('@import'))
            ).toBe(false);
        });

        describe('for pooled sparklines', () => {
            it('does not reuse a pooled chart across modes', async () => {
                // Park a chart in the injecting pool, which a static chart must not take.
                AgCharts.__createSparkline(sparklineOptions()).destroy();
                resetMockConsole();

                const sparkline = AgCharts.__createSparkline(sparklineOptions({ injectStyles: false }));
                chart = sparkline as AgChartInstance<any>;
                await sparkline.waitForUpdate();

                expect(modeOf(sparkline)).toBe(false);
                const events = poolEvents();
                expect(events).not.toContain('Pool[name=sparkline]: Re-used instance');
                expect(events.filter((event) => event.startsWith('Pool[name=sparkline|static]: '))).toEqual([
                    expect.stringMatching(/: (Created|Re-used) instance$/),
                ]);
            });

            it('releases and re-obtains when the theme sets another mode on create', async () => {
                AgCharts.__createSparkline(sparklineOptions()).destroy();
                resetMockConsole();
                const options = sparklineOptions();
                const theme = options.theme as AgChartTheme;
                theme.overrides = { ...theme.overrides, common: { injectStyles: false } };

                const sparkline = AgCharts.__createSparkline(options);
                chart = sparkline as AgChartInstance<any>;
                await sparkline.waitForUpdate();

                expect(modeOf(sparkline)).toBe(false);
                // The injecting chart taken from its pool for the raw option went back, and a static one was used.
                const events = poolEvents();
                expect(events).toContain('Pool[name=sparkline]: Returned instance to free pool');
                expect(events).toContainEqual(
                    expect.stringMatching(/^Pool\[name=sparkline\|static\]: (Created|Re-used) instance$/)
                );
            });

            it('never releases or re-obtains on update, whatever the value', async () => {
                const sparkline = AgCharts.__createSparkline(sparklineOptions({ injectStyles: false }));
                chart = sparkline as AgChartInstance<any>;
                await sparkline.waitForUpdate();
                resetMockConsole();

                await sparkline.update(sparklineOptions({ injectStyles: true }));
                await sparkline.updateDelta({ injectStyles: true });

                expectNoPoolActivityLogs();
                expect(modeOf(sparkline)).toBe(false);
                expect(warnCount(CHANGED(false))).toBe(1);
            });
        });

        describe('a stylesheet check for a sparkline attached after its updates settled', () => {
            afterEach(() => {
                vi.restoreAllMocks();
            });

            // The enterprise marker is checked by no other test in this file, so the document has no earlier check.
            it('warns once for a fixed-size chart with no stylesheet', async () => {
                computedStyleSpy?.mockRestore();
                enterpriseRegistry.styles = '.enterprise {}';
                const sizeCallbacks: Array<(size: { width: number; height: number }) => void> = [];
                vi.spyOn(SizeMonitor.prototype, 'observe').mockImplementation((_el, callback) => {
                    sizeCallbacks.push(callback as (typeof sizeCallbacks)[number]);
                });
                const detached = document.createElement('div');
                const sparkline = AgCharts.__createSparkline(
                    sparklineOptions({ injectStyles: false, container: detached })
                );
                chart = sparkline as AgChartInstance<any>;
                await sparkline.waitForUpdate();
                expect(warnCount(MISSING_ENTERPRISE)).toBe(0);

                // Nothing updates the chart after this attach: its size is fixed, so `parentResize` returns early.
                document.body.append(detached);
                for (const onSize of sizeCallbacks) onSize({ width: 200, height: 50 });
                await sparkline.waitForUpdate();
                await waitForChartStability(chart);

                expect(warnCount(MISSING_ENTERPRISE)).toBe(1);
                detached.remove();
                enterpriseRegistry.styles = undefined;
            });
        });

        describe('detached clones', () => {
            afterEach(() => {
                enterpriseRegistry.styles = undefined;
            });

            // The check runs once per root and marker; no other test here checks the enterprise marker, so an
            // earlier check of the document cannot hide one on the clone.
            it.each(['getImageDataURL', 'download'] as const)(
                '%s in static mode neither checks for a stylesheet nor warns',
                async (method) => {
                    computedStyleSpy?.mockRestore();
                    enterpriseRegistry.styles = '.enterprise {}';
                    const wrapperReads = vi.spyOn(globalThis, 'getComputedStyle');
                    const detached = document.createElement('div');
                    chart = AgCharts.create({ ...barOptions({ injectStyles: false }), container: detached });
                    await waitForChartStability(chart);
                    expect(detached.isConnected).toBe(false);
                    const before = styleCount();
                    // `download()` saves a file through an anchor click, which jsdom does not implement.
                    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

                    await chart[method]({ width: 200, height: 150 });

                    click.mockRestore();
                    expect(
                        wrapperReads.mock.calls.filter(
                            ([el]) => el instanceof Element && el.classList.contains('ag-charts-wrapper')
                        )
                    ).toHaveLength(0);
                    expect(styleCount()).toBe(before);
                    wrapperReads.mockRestore();
                }
            );
        });
    });

    describe('chart instance', () => {
        it('serialises without exposing the internal chart', async () => {
            const options: AgChartOptions = {
                data: [{ x: 'A', y: 1 }],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            };
            chart = await createChart(options);

            expect(() => JSON.stringify(chart)).not.toThrow();
            expect(Object.keys(chart)).not.toContain('chart');
        });
    });

    describe('option mutability', () => {
        it('should handle deep options mutations', async () => {
            const lineSeries: AgLineSeriesOptions = {
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'smooth' },
            };
            const options: AgChartOptions = {
                data: [
                    { month: 'January', max: 8.5, min: 2.6 },
                    { month: 'February', max: 10.4, min: 3 },
                    { month: 'March', max: 10.9, min: 4.7 },
                    { month: 'April', max: 13.7, min: 5 },
                ],
                series: [lineSeries],
            };

            chart = await createChart(options);
            prepareTestOptions(options);

            expect(chart.getOptions().series?.[0]).toStrictEqual({
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'smooth' },
            });

            lineSeries.interpolation = { type: 'smooth', tension: 1 };
            await chart.update(options);
            await chart.waitForUpdate();

            expect(chart.getOptions().series?.[0]).toStrictEqual({
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'smooth', tension: 1 },
            });

            lineSeries.interpolation = { type: 'linear' };
            await chart.update(options);

            expect(chart.getOptions().series?.[0]).toStrictEqual({
                type: 'line',
                xKey: 'month',
                yKey: 'min',
                interpolation: { type: 'linear' },
            });
        });

        it('should handle deep options enablement mutations', async () => {
            const marker: NonNullable<AgLineSeriesOptions['marker']> = {
                enabled: false,
                fill: { type: 'gradient' },
                stroke: 'blue',
            };
            const options: AgChartOptions = {
                data: [
                    { month: 'January', max: 8.5, min: 2.6 },
                    { month: 'February', max: 10.4, min: 3 },
                    { month: 'March', max: 10.9, min: 4.7 },
                    { month: 'April', max: 13.7, min: 5 },
                ],
                series: [{ type: 'line', xKey: 'month', yKey: 'min', marker }],
            };

            chart = await createChart(options);
            prepareTestOptions(options);
            const realChart = deproxy(chart);

            let series = realChart.getChartOptions().processedOptions.series?.[0] as AgLineSeriesOptions;
            expect(series.marker).toMatchObject({
                enabled: false,
            });

            marker.enabled = true;
            await chart.update(options);

            series = realChart.getChartOptions().processedOptions.series?.[0] as AgLineSeriesOptions;
            expect(series.marker).toMatchObject({
                enabled: true,
                fill: { type: 'gradient' },
                stroke: 'blue',
            });

            marker.enabled = false;
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

            chart = await createChart(options);
            prepareTestOptions(options);
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
                marker: { enabled: false, fill: { type: 'gradient' } },
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

        // Bespoke: the first chart is attached to the per-test `container` and the second has no container, which
        // `createChart` would override.
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
            for (const series of realChart.series) {
                expect(findFill(series.contentGroup, 'lab(50% 40 59.5)')).toBe(false);
            }
        });

        it('adds light-dark() advice when an itemStyler returns a light-dark() fill', async () => {
            const options: AgChartOptions = {
                data: [{ x: 'a', y: 1 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        itemStyler: () => ({ fill: 'light-dark(red, blue)' }),
                    },
                ],
            };
            prepareTestOptions(options, container);

            chart = AgCharts.create(options);
            await chart.waitForUpdate();

            expectWarningsCalls().toEqual([
                [
                    expect.stringMatching(
                        /Callback `series\[0]\.itemStyler` returned an invalid property `series\[0]\.itemStyler\.fill`: `"light-dark\(red, blue\)"`; expecting .*\. light-dark\(\) is not supported .*use CSS variables or separate light and dark themes instead, ignoring\.$/
                    ),
                ],
            ]);
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

        // Bespoke: these tests create from invalid or unprepared options and assert on errors raised during `create()`.
        // Reported, not thrown: `create()` must still hand back an instance the caller can destroy.
        it.each([
            ['no argument', undefined],
            ['undefined', undefined],
            ['null', null],
            ['a number', 3],
            ['a string', 'abc'],
            ['an empty string', ''],
            ['an empty array', []],
            ['an empty object', {}],
        ])('logs a descriptive error for %s and still returns an instance', (_name, options) => {
            expect(() => (chart = AgCharts.create(invalidOption(options)))).not.toThrow();
            expect(chart).toBeDefined();
            expectErrorsCalls().toEqual([[expect.stringMatching(expectedError)]]);
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('names the value it received', () => {
            const received = (options: unknown) => {
                chart = AgCharts.create(invalidOption(options));
                chart.destroy();
                const [[message]] = (console.error as Mock).mock.calls;
                (console.error as Mock).mockClear();
                return message;
            };
            expect(received(3)).toMatch(/Received a number \(3\)\.$/);
            expect(received('abc')).toMatch(/Received a string \('abc'\)\.$/);
            expect(received([])).toMatch(/Received an array\.$/);
            expect(received({})).toMatch(/Received an empty object\.$/);
            expect(received(null)).toMatch(/Received null\.$/);
            expect(received(undefined)).toMatch(/Received undefined\.$/);
            (chart as unknown) = undefined;
        });

        it('records the error as a validation issue the overlay can show', () => {
            chart = AgCharts.create(invalidOption(undefined));
            expectErrorsCalls().toHaveLength(1);
            const { validations } = deproxy(chart).ctx;
            validations.setShowOverlayOn(['error']);
            expect(validations.hasVisibleIssues()).toBe(true);
            expect(validations.getVisibleIssues().error).toEqual([
                { severity: 'error', message: expect.stringMatching(/^AgCharts\.create\(\) requires a non-empty/) },
            ]);
        });

        // Framework wrappers merge their own `container` in before delegating, so both `undefined` and `3` arrive as a valid `{ container }` object.
        it('reports the caller the wrapper names, via __validateOptionsArgument', () => {
            const wrapperOptions = AgCharts.__validateOptionsArgument<object | undefined>(
                undefined,
                'AgCharts `options` prop'
            );
            chart = AgCharts.create(invalidOption({ ...wrapperOptions, container }));
            expectErrorsCalls().toEqual([
                [
                    expect.stringMatching(
                        /^AG Charts - AgCharts `options` prop requires a non-empty options object.*Received undefined\.$/
                    ),
                ],
            ]);
        });

        it('reports a wrapper prop that turns invalid on update', async () => {
            chart = AgCharts.create({ container, data: [{ x: 'a', y: 1 }] } as AgChartOptions);
            await chart.waitForUpdate();
            expectWarningsCalls();

            const wrapperOptions = AgCharts.__validateOptionsArgument<object | undefined>(
                invalidOption(3),
                'AgCharts `options` prop'
            );
            await chart.update({ ...wrapperOptions, container } as AgChartOptions);

            expectErrorsCalls().toEqual([
                [expect.stringMatching(/^AG Charts - AgCharts `options` prop requires a non-empty options object/)],
            ]);
        });

        it('leaves a usable options object untouched', () => {
            const options = { container: null };
            expect(AgCharts.__validateOptionsArgument(options, 'AgCharts `options` prop')).toBe(options);
        });

        // The enterprise presets are unregistered in this community-only registry, so each also reports
        // the module the caller needs before its entry point can do anything.
        it.each([
            [
                'createFinancialChart',
                () => AgCharts.createFinancialChart(invalidOption(undefined)),
                ['FinancialChartModule'],
            ],
            [
                'createGauge',
                () => AgCharts.createGauge(invalidOption(undefined)),
                ['LinearGaugeModule, // or RadialGaugeModule'],
            ],
            [
                'createQuadrantChart',
                () => AgCharts.createQuadrantChart(invalidOption(undefined)),
                ['QuadrantChartModule'],
            ],
            [
                'createVolumeProfileChart',
                () => AgCharts.createVolumeProfileChart(invalidOption(undefined)),
                ['FinancialChartModule'],
            ],
            ['__createSparkline', () => AgCharts.__createSparkline(invalidOption(undefined)), []],
        ])('names %s in the error it reports', (methodName, call, missingModules) => {
            expect(() => (chart = call() as AgChartInstance)).not.toThrow();
            expectErrorsCalls().toEqual([
                ...missingModules.map((moduleId) => [expect.stringContaining(moduleId)]),
                [
                    expect.stringMatching(
                        new RegExp(`^AG Charts - AgCharts\\.${methodName}\\(\\) requires a non-empty options object`)
                    ),
                ],
            ]);
            // Consume the unapplied-preset warning so teardown's clean-console check holds.
            expectWarningsCalls();
        });

        it('rejects a sparkline whose only option is `pool`', () => {
            chart = AgCharts.__createSparkline(invalidOption({ pool: true })) as AgChartInstance;
            expectErrorsCalls().toEqual([
                [
                    expect.stringMatching(
                        /^AG Charts - AgCharts\.__createSparkline\(\) requires a non-empty options object/
                    ),
                ],
            ]);
            expectWarningsCalls();
        });

        it('does not throw for a non-empty object that is missing `container` or `series`', async () => {
            // `container` is optional by design; per-option problems stay on the warn-and-continue path.
            expect(() => (chart = AgCharts.create(invalidOption({ foo: true })))).not.toThrow();
            await chart.waitForUpdate();

            expectWarningsCalls().toEqual([[expect.stringMatching(/Unknown option `foo`/)]]);
        });

        it('still creates a chart from valid options', async () => {
            const options: AgChartOptions = {
                container,
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };
            chart = await createChart(options);

            expect(deproxy(chart).series).toHaveLength(1);
        });
    });
    describe('no registered series module for the lead series type', () => {
        // Restore by value: re-registering a bundle drops anything registered at collection time.
        async function withOnlyRegistered(modules: ModuleDefinition[], run: () => void | Promise<void>) {
            const registeredModules = [...ModuleRegistry.listModules()];
            ModuleRegistry.reset();
            ModuleRegistry.registerModules(modules);
            try {
                await run();
            } finally {
                ModuleRegistry.reset();
                ModuleRegistry.registerModules(registeredModules);
            }
        }

        function withOnlyBarRegistered(run: () => void | Promise<void>) {
            return withOnlyRegistered([BarSeriesModule, CategoryAxisModule, NumberAxisModule], run);
        }

        function takeErrorMessages() {
            const errorMock = console.error as Mock;
            const messages = errorMock.mock.calls.map(([message]) => String(message));
            errorMock.mockClear();
            return messages;
        }

        // No series survive, yet the captions and chart-level defaults are resolved and applied.
        function expectEmptyChartWithDefaults(title: string) {
            const chartInstance = deproxy(chart);
            expect(chartInstance.series).toHaveLength(0);
            expect(chartInstance.ctx.chartState.getValue('options', 'title')?.text).toBe(title);
            expect(chartInstance.ctx.chartState.getValue('options', 'padding')).toBeDefined();
            expect(chartInstance.ctx.chartState.getValue('options', 'touch')).toBeDefined();
        }

        function axisTypesByDirection() {
            return Object.fromEntries(deproxy(chart).axes.map((axis) => [axis.direction, axis.type]));
        }

        // Bespoke: these tests create from unprepared options inside a swapped module registry and assert on what
        // `create()` reports, which `createChart` would alter.
        it('falls back to a registered series type when no series are provided', async () => {
            await withOnlyBarRegistered(async () => {
                expect(
                    () => (chart = AgCharts.create({ container, title: { text: 'Implicit' } } as AgChartOptions))
                ).not.toThrow();
                await chart.waitForUpdate();
            });

            expect(console.error).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expectEmptyChartWithDefaults('Implicit');
            expect(axisTypesByDirection()).toEqual({ x: 'category', y: 'number' });
        });

        it('renders the requested captions and default axes for an empty series array', async () => {
            await withOnlyBarRegistered(async () => {
                chart = AgCharts.create({
                    container,
                    title: { text: 'Empty' },
                    subtitle: { text: 'No series' },
                    data: [{ x: 'a', y: 1 }],
                    series: [],
                } as AgChartOptions);
                await chart.waitForUpdate();
            });

            expect(console.error).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expectEmptyChartWithDefaults('Empty');
            expect(deproxy(chart).ctx.chartState.getValue('options', 'subtitle')?.text).toBe('No series');
            expect(axisTypesByDirection()).toEqual({ x: 'category', y: 'number' });
        });

        it('creates a standalone chart when only a standalone series type is registered and no series are provided', async () => {
            await withOnlyRegistered([PieSeriesModule], async () => {
                expect(() => (chart = AgCharts.create({ container, series: [] } as AgChartOptions))).not.toThrow();
                await chart.waitForUpdate();
            });

            expect(console.error).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(deproxy(chart).getChartType()).toBe('standalone');
        });

        it('renders a series-less chart without reporting a series module when none is registered', async () => {
            await withOnlyRegistered([CategoryAxisModule, NumberAxisModule], async () => {
                expect(
                    () => (chart = AgCharts.create({ container, title: { text: 'Implicit' } } as AgChartOptions))
                ).not.toThrow();
                await chart.waitForUpdate();
            });

            expect(console.error).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expectEmptyChartWithDefaults('Implicit');
            expect(axisTypesByDirection()).toEqual({ x: 'category', y: 'number' });
        });

        it('gives a series-less chart the cartesian default axes whichever series modules are registered', async () => {
            await withOnlyRegistered([ScatterSeriesModule, CategoryAxisModule, NumberAxisModule], async () => {
                chart = AgCharts.create({ container, series: [] } as AgChartOptions);
                await chart.waitForUpdate();
            });

            expect(console.error).not.toHaveBeenCalled();
            expect(axisTypesByDirection()).toEqual({ x: 'category', y: 'number' });
        });

        it('applies only the common theme overrides to a series-less chart', async () => {
            chart = AgCharts.create({
                container,
                series: [],
                theme: {
                    overrides: { common: { background: { fill: 'blue' } }, line: { background: { fill: 'red' } } },
                },
            } as AgChartOptions);
            await chart.waitForUpdate();

            expect(deproxy(chart).ctx.chartState.getValue('options', 'background').fill).toBe('blue');
        });

        it('reports an explicit series type with no module and renders an empty chart', async () => {
            await withOnlyBarRegistered(async () => {
                expect(
                    () =>
                        (chart = AgCharts.create({
                            container,
                            title: { text: 'Explicit' },
                            data: [{ x: 'a', y: 1 }],
                            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                        } as AgChartOptions))
                ).not.toThrow();
                await chart.waitForUpdate();
            });

            const messages = takeErrorMessages();
            expect(messages.some((m) => m.includes('LineSeriesModule'))).toBe(true);
            expect(messages).toHaveLength(1);
            expectEmptyChartWithDefaults('Explicit');
        });

        it('reports an enterprise series type with no module and renders an empty chart', async () => {
            expect(
                () =>
                    (chart = AgCharts.create({
                        container,
                        title: { text: 'Enterprise' },
                        data: [{ month: 'Jan', region: 'North', revenue: 130 }],
                        series: [{ type: 'heatmap', xKey: 'month', yKey: 'region', colorKey: 'revenue' }],
                    } as AgChartOptions))
            ).not.toThrow();
            await chart.waitForUpdate();

            const messages = takeErrorMessages();
            expect(messages.some((m) => m.includes('HeatmapSeriesModule'))).toBe(true);
            expect(messages).toHaveLength(1);
            expectEmptyChartWithDefaults('Enterprise');
        });

        it('applies the latest options once the module is registered and a refresh is requested', async () => {
            await withOnlyBarRegistered(async () => {
                chart = AgCharts.create({
                    container,
                    data: [{ x: 'a', y: 1 }],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                } as AgChartOptions);
                await chart.waitForUpdate();

                await chart.update({
                    container,
                    data: [{ x: 'a', y: 1 }],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                } as AgChartOptions);
                takeErrorMessages();
                expect(deproxy(chart).series).toHaveLength(0);

                ModuleRegistry.registerModules([LineSeriesModule]);
                deproxy(chart).ctx.eventsHub.emit('chart:request-refresh', null);
                await chart.waitForUpdate();
            });

            expect(deproxy(chart).series.map((s) => s.type)).toEqual(['line']);
        });

        it('still renders a series type that is registered', async () => {
            let created: AgChartInstance | undefined;
            await withOnlyBarRegistered(() => {
                created = AgCharts.create({
                    container,
                    data: [{ x: 'a', y: 1 }],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                } as AgChartOptions);
            });
            chart = created!;
            await chart.waitForUpdate();

            expect(deproxy(chart).series).toHaveLength(1);
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    it('adds no CSS variable watcher for an incomplete var() value in a title', async () => {
        chart = await createChart({
            title: { text: 'var(--x, rgb(1,2,3) junk{} .testMarker{})' },
            data: [{ x: 'a', y: 1 }],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        } as AgChartOptions);

        expect(document.querySelectorAll('[data-variable-name]')).toHaveLength(0);
    });

    it('adds no CSS variable watcher for a complete var() value in a title', async () => {
        vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue(fakeComputedStyle({ '--brand': '#00ff00' }));
        chart = await createChart({
            title: { text: 'var(--brand)' },
            data: [{ x: 'a', y: 1 }],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        } as AgChartOptions);

        expect(document.querySelectorAll('[data-variable-name]')).toHaveLength(0);
        expect(deproxy(chart).chartOptions.processedCSSVariables).toEqual({});
    });

    describe('CSS variables left out of a styler result on a detached container', () => {
        // jsdom cannot validate a `var()` returned from a callback, so the result is handed to the options graph the
        // way the series hand it theirs.
        async function attachAfterStylerResult(stylerResult: object) {
            const detached = document.createElement('div');
            chart = AgCharts.create({
                container: detached,
                width: 300,
                height: 200,
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            } as AgChartOptions);
            await chart.waitForUpdate();

            const { domManager, eventsHub, optionsGraphService } = deproxy(chart).ctx;
            const refresh = vi.fn();
            eventsHub.on('chart:request-refresh', refresh);
            const remeasure = vi.spyOn(getManagerSizeMonitor(domManager), 'refresh');

            optionsGraphService.resolvePartial(['series', '0'], stylerResult);
            document.body.append(detached);
            // The attach MutationObserver detects the insertion; the transition re-measures the container.
            await vi.waitFor(() => expect(remeasure).toHaveBeenCalledWith(detached));
            detached.remove();

            return refresh;
        }

        it('requests one refresh on attach, so the styler is evaluated against the attached container', async () => {
            const refresh = await attachAfterStylerResult({ fill: 'var(--attach-undefined)' });

            expect(refresh).toHaveBeenCalledTimes(1);
        });

        it('requests no refresh on attach when the styler result has no unresolvable variable', async () => {
            const refresh = await attachAfterStylerResult({ fill: 'red' });

            expect(refresh).not.toHaveBeenCalled();
        });
    });
});
