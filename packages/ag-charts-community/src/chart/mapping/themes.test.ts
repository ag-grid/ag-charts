import { describe, expect, it } from '@jest/globals';

import { AgCharts } from '../../api/agCharts';
import type {
    AgBarSeriesOptions,
    AgChartOptions,
    AgChartTheme,
    AgChartThemeName,
    AgChartThemePalette,
} from '../../options/agChartOptions';
import type { Chart } from '../chart';
import {
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { themesMap } from './themes';

describe('themes module', () => {
    setupMockConsole();

    const getPalette = (themeName: AgChartThemeName): AgChartThemePalette | undefined => {
        const ctr = themesMap.get(themeName);
        if (ctr !== undefined) {
            return ctr().palette;
        }
    };

    const getActualPalette = (chart: Chart) => {
        let result = undefined;
        for (const series of deproxy(chart).processedOptions.series ?? []) {
            result ??= { fills: [] as string[], strokes: [] as string[] };

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

    const opts: AgChartOptions = prepareTestOptions({
        data: [
            { n: 'A', v0: 4.2, v1: 5.6, v2: 8.6, v3: 8.1, v4: 6.4, v5: 1.3, v6: 6.4, v7: 1.3, v8: 2.2, v9: 8.7 },
            { n: 'B', v0: 1.8, v1: 7.1, v2: 8.4, v3: 1.3, v4: 6.8, v5: 5.5, v6: 2.7, v7: 4.8, v8: 4.8, v9: 5.2 },
            { n: 'C', v0: 7.1, v1: 7.4, v2: 1.9, v3: 9.8, v4: 1.3, v5: 4.4, v6: 8.3, v7: 9.5, v8: 1.3, v9: 0.9 },
            { n: 'D', v0: 3.5, v1: 9.2, v2: 4.2, v3: 2.5, v4: 6.3, v5: 4.4, v6: 5.9, v7: 2.2, v8: 6.8, v9: 0.1 },
            { n: 'E', v0: 9.0, v1: 2.8, v2: 1.9, v3: 7.4, v4: 5.9, v5: 8.1, v6: 0.6, v7: 7.6, v8: 3.0, v9: 3.4 },
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
    });

    it('should show 1 warning for invalid theme type', async () => {
        const chart = deproxy(
            AgCharts.create({
                ...opts,
                theme: true as unknown as AgChartTheme,
            })
        );
        await waitForChartStability(chart);

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option theme cannot be set to [true]; expecting a keyword such as 'ag-default', 'ag-default-dark', 'ag-sheets', 'ag-sheets-dark', 'ag-polychroma', and 2 more or 'ag-material-dark' or an object, ignoring.",
  ],
  [
    "AG Charts - invalid theme value type boolean, expected object or string.",
  ],
]
`);
    });

    test('missing strokes', async () => {
        const chart = deproxy(
            AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: 'ag-default-dark',
                    palette: {
                        fills: ['#5C2983', '#0076C5', '#21B372', '#FDDE02', '#F76700', '#D30018'],
                    } as AgChartThemePalette,
                },
            })
        );
        await waitForChartStability(chart);

        expect(getActualPalette(chart)?.strokes).toEqual(getPalette('ag-default-dark')?.strokes);
    });

    test('missing fills', async () => {
        const chart = deproxy(
            AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: 'ag-default-dark',
                    palette: {
                        strokes: ['black'],
                    } as AgChartThemePalette,
                },
            })
        );
        await waitForChartStability(chart);

        expect(getActualPalette(chart)?.fills).toEqual(getPalette('ag-default-dark')?.fills);
    });

    it('should show 3 warnings for invalid types', async () => {
        const chart = deproxy(
            AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: NaN,
                    palette: 'foobar',
                    overrides: true,
                } as unknown as AgChartTheme,
            })
        );
        await waitForChartStability(chart);

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option theme.baseTheme cannot be set to [NaN]; expecting a keyword such as 'ag-default', 'ag-default-dark', 'ag-sheets', 'ag-sheets-dark', 'ag-polychroma', and 2 more or 'ag-material-dark' or an object, ignoring.",
  ],
  [
    "AG Charts - Option theme.overrides cannot be set to [true]; expecting an object, ignoring.",
  ],
  [
    "AG Charts - Option theme.palette cannot be set to ["foobar"]; expecting an object, ignoring.",
  ],
  [
    "AG Charts - invalid theme value type object, expected object or string.",
  ],
]
`);
    });

    it('should show 2 warnings for invalid types - palette', async () => {
        const chart = deproxy(
            AgCharts.create({
                ...opts,
                theme: {
                    baseTheme: 'ag-default-dark',
                    palette: {
                        fills: 'red',
                        strokes: 'black',
                    } as unknown as AgChartThemePalette,
                },
            })
        );
        await waitForChartStability(chart);

        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option theme.palette.fills cannot be set to ["red"]; expecting a string array, ignoring.",
  ],
  [
    "AG Charts - Option theme.palette.strokes cannot be set to ["black"]; expecting a string array, ignoring.",
  ],
  [
    "AG Charts - invalid theme value type object, expected object or string.",
  ],
]
`);
    });
});
