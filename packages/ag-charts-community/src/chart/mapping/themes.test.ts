import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartOptions, AgChartTheme, AgChartThemePalette } from '../../options/agChartOptions';
import { AgCharts } from '../agChartV2';
import type { Chart } from '../chart';
import { prepareTestOptions, waitForChartStability } from '../test/utils';

expect.extend({ toMatchImageSnapshot });

/* eslint-disable no-console */
describe('ThemesValidation', () => {
    beforeEach(() => {
        console.warn = jest.fn();
    });

    const opts: AgChartOptions = {
        ...prepareTestOptions({}),
        data: [
            { label: 'Android', v1: 5.67, v2: 8.63, v3: 8.14, v4: 6.45, v5: 1.37 },
            { label: 'iOS', v1: 7.01, v2: 8.04, v3: 1.338, v4: 6.78, v5: 5.45 },
            { label: 'BlackBerry', v1: 7.54, v2: 1.98, v3: 9.88, v4: 1.38, v5: 4.44 },
            { label: 'Symbian', v1: 9.27, v2: 4.21, v3: 2.53, v4: 6.31, v5: 4.44 },
            { label: 'Windows', v1: 2.8, v2: 1.908, v3: 7.48, v4: 5.29, v5: 8.8 },
        ],
        series: [
            { type: 'bar', xKey: 'label', yKey: 'v1', stacked: true, yName: 'Reliability' },
            { type: 'bar', xKey: 'label', yKey: 'v2', stacked: true, yName: 'Ease of use' },
            { type: 'bar', xKey: 'label', yKey: 'v3', stacked: true, yName: 'Performance' },
            { type: 'bar', xKey: 'label', yKey: 'v4', stacked: true, yName: 'Price' },
            { type: 'bar', xKey: 'label', yKey: 'v5', stacked: true, yName: 'Market share' },
        ],
    };

    it('should show 1 warning for invalid theme type', async () => {
        const chart = AgCharts.create({
            ...opts,
            theme: true as unknown as AgChartTheme,
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith('AG Charts - invalid theme value type boolean, expected object.');
    });

    it('should show 1 warning for missing strokes', async () => {
        const chart = AgCharts.create({
            ...opts,
            theme: {
                baseTheme: 'ag-default-dark',
                palette: {
                    fills: ['#5C2983', '#0076C5', '#21B372', '#FDDE02', '#F76700', '#D30018'],
                } as AgChartThemePalette,
            },
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith('AG Charts - theme.overrides.strokes must be a defined array');
    });

    it('should show 1 warning for missing fills', async () => {
        const chart = AgCharts.create({
            ...opts,
            theme: {
                baseTheme: 'ag-default-dark',
                palette: {
                    strokes: ['black'],
                } as AgChartThemePalette,
            },
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(1);
        expect(console.warn).toBeCalledWith('AG Charts - theme.overrides.fills must be a defined array');
    });

    it('should show 3 warnings for invalid types', async () => {
        const chart = AgCharts.create({
            ...opts,
            theme: {
                baseTheme: NaN,
                palette: 'foobar',
                overrides: true,
            } as unknown as AgChartTheme,
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(3);
        expect(console.warn).nthCalledWith(1, 'AG Charts - invalid theme.baseTheme type number, expected string.');
        expect(console.warn).nthCalledWith(2, 'AG Charts - invalid theme.overrides type boolean, expected object.');
        expect(console.warn).nthCalledWith(3, 'AG Charts - invalid theme.palette type string, expected object.');
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
        }) as Chart;
        await waitForChartStability(chart);

        expect(console.warn).toBeCalledTimes(2);
        expect(console.warn).nthCalledWith(1, 'AG Charts - theme.overrides.fills must be a defined array');
        expect(console.warn).nthCalledWith(2, 'AG Charts - theme.overrides.strokes must be a defined array');
    });
});
/* eslint-enable no-console */
