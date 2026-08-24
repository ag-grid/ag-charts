import type { Mock } from 'vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ModuleRegistry, type PresetModuleDefinition } from 'ag-charts-core';
import type {
    AgBarSeriesOptions,
    AgChartInstance,
    AgChartOptions,
    AgChartTheme,
    AgChartThemeName,
    AgChartThemePalette,
    AgColorType,
    AgCssColorOrRef,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { VERSION } from '../../version';
import { sanitizeThemeModules } from '../factory/processModuleOptions';
import {
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import type { ChartTheme } from '../themes/chartTheme';
import { __clearChartThemeCacheForTests, getChartTheme, themes } from './themes';

describe('themes.ts', () => {
    describe('theme validation', () => {
        setupMockConsole();
        setupMockCanvas();

        const getPalette = (themeName: AgChartThemeName): AgChartThemePalette | undefined => {
            const ctr = themes[themeName];
            if (ctr !== undefined) {
                return ctr().palette;
            }
        };

        const getActualPalette = (chart: AgChartInstance) => {
            let result = undefined;
            for (const series of deproxy(chart).chartOptions.processedOptions.series ?? []) {
                result ??= { fills: [] as AgColorType[], strokes: [] as AgCssColorOrRef[] };

                expect(series.type).toEqual('bar');
                const barseries = series as AgBarSeriesOptions;
                if (barseries.fill !== undefined) {
                    result.fills.push(barseries.fill);
                }
                if (barseries.stroke !== undefined) {
                    result.strokes.push(barseries.stroke);
                }
            }
            return result;
        };

        const opts: AgChartOptions = {
            ...prepareTestOptions({}),
            data: [
                {
                    n: 'A',
                    v0: 4.2,
                    v1: 5.6,
                    v2: 8.6,
                    v3: 8.1,
                    v4: 6.4,
                    v5: 1.3,
                    v6: 6.4,
                    v7: 1.3,
                    v8: 2.2,
                    v9: 8.7,
                },
                {
                    n: 'B',
                    v0: 1.8,
                    v1: 7.1,
                    v2: 8.4,
                    v3: 1.3,
                    v4: 6.8,
                    v5: 5.5,
                    v6: 2.7,
                    v7: 4.8,
                    v8: 4.8,
                    v9: 5.2,
                },
                {
                    n: 'C',
                    v0: 7.1,
                    v1: 7.4,
                    v2: 1.9,
                    v3: 9.8,
                    v4: 1.3,
                    v5: 4.4,
                    v6: 8.3,
                    v7: 9.5,
                    v8: 1.3,
                    v9: 0.9,
                },
                {
                    n: 'D',
                    v0: 3.5,
                    v1: 9.2,
                    v2: 4.2,
                    v3: 2.5,
                    v4: 6.3,
                    v5: 4.4,
                    v6: 5.9,
                    v7: 2.2,
                    v8: 6.8,
                    v9: 0.1,
                },
                { n: 'E', v0: 9, v1: 2.8, v2: 1.9, v3: 7.4, v4: 5.9, v5: 8.1, v6: 0.6, v7: 7.6, v8: 3, v9: 3.4 },
            ],
            series: [
                { type: 'bar', xKey: 'n', yKey: 'v0', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v1', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v2', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v3', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v4', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v5', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v6', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v7', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v8', stacked: true },
                { type: 'bar', xKey: 'n', yKey: 'v9', stacked: true },
            ],
        };

        it('should show 1 warning for invalid theme type', async () => {
            const chart = AgCharts.create({
                ...opts,
                theme: true as unknown as AgChartTheme,
            });
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`theme\` cannot be set to \`true\`; expecting a keyword such as 'ag-default', 'ag-default-dark', 'ag-sheets', 'ag-sheets-dark', 'ag-polychroma', 'ag-polychroma-dark', 'ag-vivid', 'ag-vivid-dark', 'ag-material', 'ag-material-dark', 'ag-financial' or 'ag-financial-dark' or an object, ignoring.",
  ],
]
`);
        });

        test('missing strokes', async () => {
            const chart = AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: 'ag-default-dark',
                    palette: {
                        fills: ['#5C2983', '#0076C5', '#21B372', '#FDDE02', '#F76700', '#D30018'],
                    },
                },
            });
            await waitForChartStability(chart);

            expect(getActualPalette(chart)?.strokes).toEqual(getPalette('ag-default-dark')?.strokes);
        });

        test('missing fills', async () => {
            const chart = AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: 'ag-default-dark',
                    palette: {
                        strokes: ['black'],
                    },
                },
            });
            await waitForChartStability(chart);

            expect(getActualPalette(chart)?.fills).toEqual(getPalette('ag-default-dark')?.fills);
        });

        it('should show 3 warnings for invalid types', async () => {
            const chart = AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: Number.NaN,
                    palette: 'foobar',
                    overrides: true,
                } as unknown as AgChartTheme,
            });
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`theme.baseTheme\` cannot be set to \`NaN\`; expecting a string or an object, ignoring.",
  ],
  [
    "AG Charts - Option \`theme.overrides\` cannot be set to \`true\`; expecting an object, ignoring.",
  ],
  [
    "AG Charts - Option \`theme.palette\` cannot be set to \`"foobar"\`; expecting an object, ignoring.",
  ],
]
`);
        });

        it('should show 2 warnings for invalid types - palette', async () => {
            const chart = AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: 'ag-default-dark',
                    palette: {
                        fills: 'red',
                        strokes: 'black',
                    } as unknown as AgChartThemePalette,
                },
            });
            await waitForChartStability(chart);

            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`theme.palette.fills\` cannot be set to \`"red"\`; expecting a supported color string (hex, rgb(), hsl(), oklch() or a CSS color name) or a color object array, ignoring.",
                ],
                [
                  "AG Charts - Option \`theme.palette.strokes\` cannot be set to \`"black"\`; expecting a supported color string (hex, rgb(), hsl(), oklch() or a CSS color name) array, ignoring.",
                ],
              ]
            `);
        });
    });

    describe('theme caching across repeat chart creates', () => {
        it('returns the same ChartTheme instance for repeated identical option references', () => {
            const themeOptions = {
                overrides: {
                    line: { series: { stroke: 'rgb(124, 255, 178)', strokeWidth: 2 } },
                },
            };

            const first = getChartTheme(themeOptions);
            const second = getChartTheme(themeOptions);
            const third = getChartTheme(themeOptions);

            expect(second).toBe(first);
            expect(third).toBe(first);
        });

        it('returns the same sanitized ChartTheme instance for repeated calls with the same theme', () => {
            const theme = getChartTheme({
                overrides: {
                    line: { series: { stroke: 'rgb(124, 255, 178)', strokeWidth: 2 } },
                },
            });

            const first = sanitizeThemeModules(theme);
            const second = sanitizeThemeModules(theme);
            const third = sanitizeThemeModules(theme);

            expect(second).toBe(first);
            expect(third).toBe(first);
        });
    });

    describe('theme cache debug logging with "theme" selector', () => {
        setupMockConsole({ includeAllLevels: true });

        beforeEach(() => {
            (globalThis as any).agChartsDebug = 'theme';
        });

        afterEach(() => {
            delete (globalThis as any).agChartsDebug;
        });

        function themeCacheLogs() {
            return (console.log as Mock).mock.calls.filter((args) => args[0] === '[CACHE] ChartTheme');
        }

        it('logs a cache miss on first access and a cache hit on the second access for the same reference', () => {
            const themeOptions = {
                overrides: {
                    line: { series: { stroke: 'rgb(10, 20, 30)', strokeWidth: 3 } },
                },
            };

            getChartTheme(themeOptions);
            getChartTheme(themeOptions);

            const logs = themeCacheLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0][1]).toBe('miss');
            expect(logs[1][1]).toBe('hit');
        });

        it('logs a cache hit when sparklines sharing the same theme reference resolve to the same cached instance', () => {
            const theme = {
                overrides: {
                    line: { series: { stroke: 'rgb(20, 100, 255)' } },
                },
            };

            const first = getChartTheme(theme, undefined, 'sparkline');
            const second = getChartTheme(theme, undefined, 'sparkline');

            // The preset key must partition the cache without defeating it.
            expect(second).toBe(first);

            const logs = themeCacheLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0][1]).toBe('miss');
            expect(logs[1][1]).toBe('hit');
        });

        it('does not log a cache hit when different theme object references are used', () => {
            getChartTheme({ overrides: { line: { series: { stroke: 'red' } } } });
            getChartTheme({ overrides: { line: { series: { stroke: 'red' } } } });

            const logs = themeCacheLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0][1]).toBe('miss');
            expect(logs[1][1]).toBe('miss');
        });
    });

    // Heap/finalizer timing can be flaky - retry to keep the signal reliable.
    describe('theme cache memory', { retry: 5 }, () => {
        async function collectGarbage() {
            for (let i = 0; i < 10; i++) {
                globalThis.gc?.();
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }

        it('releases resolved themes once their inline theme options object is unreferenced', async () => {
            const total = 20;
            const collected = new Set<number>();
            const registry = new FinalizationRegistry<number>((id) => collected.add(id));

            for (let i = 0; i < total; i++) {
                // Fresh options object per iteration, mirroring per-chart inline themes; keep no
                // strong reference to the input or the resolved theme so both are collectable.
                let themeOptions: AgChartTheme | undefined = {
                    baseTheme: 'ag-default',
                    overrides: { line: { series: { strokeWidth: i } } },
                };
                registry.register(getChartTheme(themeOptions), i);
                themeOptions = undefined;
            }

            await collectGarbage();

            expect(collected.size).toBe(total);
        });
    });

    // A preset's `themeTemplate` is baked into the `ChartTheme` instance, so both caches must key on the
    // preset name, or the first chart on a page decides the template for every later one.
    describe('theme caching across presets', () => {
        setupMockConsole();

        const PRESET_STROKE_WIDTH = 99;

        beforeAll(() => {
            ModuleRegistry.register({
                type: 'preset',
                name: 'test-preset',
                version: VERSION,
                options: {},
                create: (options: unknown) => options,
                themeTemplate: { line: { series: { strokeWidth: PRESET_STROKE_WIDTH } } },
            } as PresetModuleDefinition<unknown>);

            ModuleRegistry.register({
                type: 'preset',
                name: 'test-preset-with-base',
                version: VERSION,
                options: {},
                create: (options: unknown) => options,
                baseTheme: 'ag-vivid',
            } as PresetModuleDefinition<unknown>);
        });

        beforeEach(() => {
            __clearChartThemeCacheForTests();
        });

        const lineStrokeWidth = (theme: ChartTheme) =>
            (theme.config as { line?: { series?: { strokeWidth?: number } } }).line?.series?.strokeWidth;

        it('resolves a stock theme name to a different instance per preset', () => {
            const withPreset = getChartTheme('ag-vivid', undefined, 'test-preset');
            const withoutPreset = getChartTheme('ag-vivid');

            expect(withPreset).not.toBe(withoutPreset);
            expect(lineStrokeWidth(withPreset)).toBe(PRESET_STROKE_WIDTH);
            expect(lineStrokeWidth(withoutPreset)).not.toBe(PRESET_STROKE_WIDTH);
        });

        it('resolves the default theme to a different instance per preset', () => {
            const withPreset = getChartTheme(undefined, undefined, 'test-preset');
            const withoutPreset = getChartTheme(undefined);

            expect(withPreset).not.toBe(withoutPreset);
            expect(lineStrokeWidth(withPreset)).toBe(PRESET_STROKE_WIDTH);
            expect(lineStrokeWidth(withoutPreset)).not.toBe(PRESET_STROKE_WIDTH);
        });

        it('resolves an inline theme object to a different instance per preset', () => {
            const themeOptions: AgChartTheme = { baseTheme: 'ag-vivid' };

            const withPreset = getChartTheme(themeOptions, undefined, 'test-preset');
            const withoutPreset = getChartTheme(themeOptions);

            expect(withPreset).not.toBe(withoutPreset);
            expect(lineStrokeWidth(withPreset)).toBe(PRESET_STROKE_WIDTH);
            expect(lineStrokeWidth(withoutPreset)).not.toBe(PRESET_STROKE_WIDTH);
        });

        it('is independent of which preset resolved the theme value first', () => {
            const presetFirst = getChartTheme('ag-material', undefined, 'test-preset');
            const plainSecond = getChartTheme('ag-material');

            __clearChartThemeCacheForTests();

            const plainFirst = getChartTheme('ag-material');
            const presetSecond = getChartTheme('ag-material', undefined, 'test-preset');

            expect(lineStrokeWidth(presetFirst)).toBe(PRESET_STROKE_WIDTH);
            expect(lineStrokeWidth(presetSecond)).toBe(PRESET_STROKE_WIDTH);
            expect(lineStrokeWidth(plainSecond)).not.toBe(PRESET_STROKE_WIDTH);
            expect(lineStrokeWidth(plainFirst)).not.toBe(PRESET_STROKE_WIDTH);
        });

        it('keeps a preset base theme when the user theme is rejected as invalid', () => {
            const invalid = getChartTheme(true, undefined, 'test-preset-with-base');
            const base = getChartTheme('ag-vivid', undefined, 'test-preset-with-base');

            expect(invalid.palette.fills).toEqual(base.palette.fills);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`theme\` cannot be set to \`true\`; expecting a keyword such as 'ag-default', 'ag-default-dark', 'ag-sheets', 'ag-sheets-dark', 'ag-polychroma', 'ag-polychroma-dark', 'ag-vivid', 'ag-vivid-dark', 'ag-material', 'ag-material-dark', 'ag-financial' or 'ag-financial-dark' or an object, ignoring.",
                ],
              ]
            `);
        });

        it('still returns one shared instance per theme value and preset pair', () => {
            expect(getChartTheme('ag-sheets', undefined, 'test-preset')).toBe(
                getChartTheme('ag-sheets', undefined, 'test-preset')
            );
            expect(getChartTheme('ag-sheets')).toBe(getChartTheme('ag-sheets'));
        });
    });
});
