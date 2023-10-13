import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartInstance, AgScatterSeriesTooltipRendererParams } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    hoverAction,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgEnterpriseCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

const SERIES_CANADA = {
    data: [
        { month: 'Jan', temperature: 12.5, temperatureLower: 10.0, temperatureUpper: 15.0 },
        { month: 'Feb', temperature: 13.0, temperatureLower: 11.5, temperatureUpper: 15.5 },
        { month: 'Mar', temperature: 15.5, temperatureLower: 13.0, temperatureUpper: 18.0 },
        { month: 'Apr', temperature: 18.0, temperatureLower: 16.5, temperatureUpper: 19.5 },
        { month: 'May', temperature: 21.5, temperatureLower: 19.0, temperatureUpper: 24.0 },
        { month: 'Jun', temperature: 24.0, temperatureLower: 22.5, temperatureUpper: 26.0 },
        { month: 'Jul', temperature: 26.5, temperatureLower: 24.0, temperatureUpper: 29.0 },
        { month: 'Aug', temperature: 25.0, temperatureLower: 22.5, temperatureUpper: 28.0 },
        { month: 'Sep', temperature: 23.5, temperatureLower: 21.0, temperatureUpper: 27.0 },
        { month: 'Oct', temperature: 20.0, temperatureLower: 17.5, temperatureUpper: 22.5 },
        { month: 'Nov', temperature: 16.5, temperatureLower: 14.0, temperatureUpper: 19.0 },
        { month: 'Dec', temperature: 13.0, temperatureLower: 11.5, temperatureUpper: 15.5 },
    ],
    xKey: 'month',
    yKey: 'temperature',
    yName: 'Canada',
    errorBar: { yLowerKey: 'temperatureLower', yUpperKey: 'temperatureUpper' },
};

const SERIES_AUSTRALIA = {
    data: [
        { month: 'Jan', temperature: 8.0, temperatureLower: 6.5, temperatureUpper: 10.0 },
        { month: 'Feb', temperature: 8.5, temperatureLower: 7.0, temperatureUpper: 10.5 },
        { month: 'Mar', temperature: 10.0, temperatureLower: 8.5, temperatureUpper: 12.0 },
        { month: 'Apr', temperature: 12.0, temperatureLower: 10.5, temperatureUpper: 13.5 },
        { month: 'May', temperature: 14.5, temperatureLower: 13.0, temperatureUpper: 16.0 },
        { month: 'Jun', temperature: 16.5, temperatureLower: 15.0, temperatureUpper: 18.0 },
        { month: 'Jul', temperature: 18.0, temperatureLower: 16.5, temperatureUpper: 19.5 },
        { month: 'Aug', temperature: 17.0, temperatureLower: 15.5, temperatureUpper: 18.5 },
        { month: 'Sep', temperature: 15.5, temperatureLower: 14.0, temperatureUpper: 17.0 },
        { month: 'Oct', temperature: 12.5, temperatureLower: 11.0, temperatureUpper: 14.0 },
        { month: 'Nov', temperature: 10.0, temperatureLower: 8.5, temperatureUpper: 11.5 },
        { month: 'Dec', temperature: 8.5, temperatureLower: 7.0, temperatureUpper: 10.0 },
    ],
    xKey: 'month',
    yKey: 'temperature',
    yName: 'Australia',
    visible: true,
    errorBar: { yLowerKey: 'temperatureLower', yUpperKey: 'temperatureUpper' },
};

const EXTENDING_BARS = [
    // Same data as Canada, but with Jan & Jul changed to test errorBar.ts's
    // ability to extend the domain for error values.
    { month: 'Jan', temperature: 12.5, temperatureLower: 2.0, temperatureUpper: 15.0 },
    { month: 'Feb', temperature: 13.0, temperatureLower: 11.5, temperatureUpper: 15.5 },
    { month: 'Mar', temperature: 15.5, temperatureLower: 13.0, temperatureUpper: 18.0 },
    { month: 'Apr', temperature: 18.0, temperatureLower: 16.5, temperatureUpper: 19.5 },
    { month: 'May', temperature: 21.5, temperatureLower: 19.0, temperatureUpper: 24.0 },
    { month: 'Jun', temperature: 24.0, temperatureLower: 22.5, temperatureUpper: 26.0 },
    { month: 'Jul', temperature: 26.5, temperatureLower: 24.0, temperatureUpper: 40.0 },
    { month: 'Aug', temperature: 25.0, temperatureLower: 22.5, temperatureUpper: 28.0 },
    { month: 'Sep', temperature: 23.5, temperatureLower: 21.0, temperatureUpper: 27.0 },
    { month: 'Oct', temperature: 20.0, temperatureLower: 17.5, temperatureUpper: 22.5 },
    { month: 'Nov', temperature: 16.5, temperatureLower: 14.0, temperatureUpper: 19.0 },
    { month: 'Dec', temperature: 13.0, temperatureLower: 11.5, temperatureUpper: 15.5 },
];

const FEWER_MONTHS = [
    // Same data as Canada, but with few months for test cap lengthRatio better
    { month: 'Jan', temperature: 12.5, temperatureLower: 10.0, temperatureUpper: 15.0 },
    { month: 'Apr', temperature: 18.0, temperatureLower: 16.5, temperatureUpper: 19.5 },
    { month: 'Jul', temperature: 26.5, temperatureLower: 24.0, temperatureUpper: 29.0 },
    { month: 'Oct', temperature: 20.0, temperatureLower: 17.5, temperatureUpper: 22.5 },
];

const SERIES_BOYLESLAW = {
    type: 'scatter',
    data: [
        { volume: 0.5, volumeLower: 0.45, volumeUpper: 0.55, pressure: 9.5, pressureLower: 10.3, pressureUpper: 8.7 },
        { volume: 1.0, volumeLower: 0.9, volumeUpper: 1.1, pressure: 8.1, pressureLower: 8.9, pressureUpper: 7.4 },
        { volume: 1.5, volumeLower: 1.35, volumeUpper: 1.65, pressure: 6.8, pressureLower: 7.5, pressureUpper: 6.2 },
        { volume: 2.0, volumeLower: 1.8, volumeUpper: 2.2, pressure: 5.5, pressureLower: 5.9, pressureUpper: 5.0 },
        { volume: 2.5, volumeLower: 2.25, volumeUpper: 2.75, pressure: 4.2, pressureLower: 4.7, pressureUpper: 3.8 },
        { volume: 3.0, volumeLower: 2.7, volumeUpper: 3.3, pressure: 3.1, pressureLower: 3.5, pressureUpper: 2.8 },
        { volume: 3.5, volumeLower: 3.15, volumeUpper: 3.85, pressure: 2.0, pressureLower: 2.3, pressureUpper: 1.8 },
        { volume: 4.0, volumeLower: 3.6, volumeUpper: 4.4, pressure: 1.2, pressureLower: 1.4, pressureUpper: 1.1 },
    ],
    xKey: 'volume',
    yKey: 'pressure',
    errorBar: {
        xLowerKey: 'volumeLower',
        xUpperKey: 'volumeUpper',
        yLowerKey: 'pressureLower',
        yUpperKey: 'pressureUpper',
    },
};

describe('ErrorBars', () => {
    let chart: AgChartInstance | undefined;
    const ctx = setupMockCanvas();

    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = jest.fn();
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        // eslint-disable-next-line no-console
        expect(console.warn).not.toBeCalled();
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const getItemCoords = (itemIndex: number): { x: number; y: number } => {
        const series = chart['series'][0];
        const item = series['contextNodeData'][0].nodeData[itemIndex];
        return series.rootGroup.inverseTransformPoint(item.midPoint.x, item.midPoint.y);
    };

    const opts = prepareEnterpriseTestOptions({});

    it('should render 1 line series as expected', async () => {
        chart = AgEnterpriseCharts.create({ ...opts, series: [{ ...SERIES_CANADA, type: 'line' }] });
        await compare();
    });

    it('should render 1 bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({ ...opts, series: [{ ...SERIES_CANADA, type: 'bar' }] });
        await compare();
    });

    it('should render 2 line series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                { ...SERIES_CANADA, type: 'line' },
                { ...SERIES_AUSTRALIA, type: 'line' },
            ],
        });
        await compare();
    });

    it('should render 2 bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                { ...SERIES_CANADA, type: 'bar' },
                { ...SERIES_AUSTRALIA, type: 'bar' },
            ],
        });
        await compare();
    });

    it('should render horizontal bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                { ...SERIES_CANADA, type: 'bar', direction: 'horizontal' },
                { ...SERIES_AUSTRALIA, type: 'bar', direction: 'horizontal' },
            ],
        });
        await compare();
    });

    it('should render both errorbars on scatter series as expected', async () => {
        chart = AgEnterpriseCharts.create({ ...opts, series: [SERIES_BOYLESLAW] });
        await compare();
    });

    it('should render both errorbars on continuous line series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [{ ...SERIES_BOYLESLAW, type: 'line' }],
            axes: [
                { type: 'number', position: 'left' },
                { type: 'number', position: 'bottom' },
            ],
        });
        await compare();
    });

    it('should extend Y axis on line series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [{ ...SERIES_CANADA, data: EXTENDING_BARS }],
        });
        await compare();
    });

    it('should extend Y axis on vertical bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [{ ...SERIES_CANADA, type: 'bar', data: EXTENDING_BARS }],
        });
        await compare();
    });

    it('should extend X axis on horizontal bar series as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [{ ...SERIES_CANADA, type: 'bar', direction: 'horizontal', data: EXTENDING_BARS }],
        });
        await compare();
    });

    it('should apply styling to whiskers and cap as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    data: FEWER_MONTHS,
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        stroke: 'rgb(0,0,255)',
                        strokeWidth: 10,
                        strokeOpacity: 0.5,
                    },
                },
            ],
        });
        await compare();
    });

    it('should override cap styling as expected', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    data: FEWER_MONTHS,
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        visible: false,
                        stroke: 'rgb(0,0,255)',
                        strokeWidth: 10,
                        strokeOpacity: 0.25,
                        cap: {
                            visible: true,
                            stroke: 'rgb(0,255,0)',
                            strokeWidth: 20,
                            strokeOpacity: 0.75,
                        },
                    },
                },
            ],
        });
        await compare();
    });

    it('should default to marker size for cap length on line series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'line',
                    marker: { size: 55 },
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4 } },
                },
            ],
        });
        await compare();
    });

    it('should default to marker size for cap length on scatter series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_BOYLESLAW,
                    marker: { size: 55 },
                    errorBar: { ...SERIES_BOYLESLAW.errorBar, cap: { strokeWidth: 4 } },
                },
            ],
        });
        await compare();
    });

    it('should default to half lengthRatio for cap length on bar series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    direction: 'vertical',
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4 } },
                },
            ],
        });
        await compare();
    });

    it('should use marker size for lengthRatio on line series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'line',
                    data: FEWER_MONTHS,
                    marker: { size: 55 },
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, lengthRatio: 0.25 } },
                },
            ],
        });
        await compare();
    });

    it('should use marker size for lengthRatio on scatter series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_BOYLESLAW,
                    marker: { size: 55 },
                    errorBar: { ...SERIES_BOYLESLAW.errorBar, cap: { strokeWidth: 4, lengthRatio: 0.25 } },
                },
            ],
        });
        await compare();
    });

    it('should use bar width for lengthRatio on vertical bar series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    direction: 'vertical',
                    data: FEWER_MONTHS,
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, lengthRatio: 1.0 } },
                },
            ],
        });
        await compare();
    });

    it('should use bar height for lengthRatio on horizontal bar series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    direction: 'horizontal',
                    data: FEWER_MONTHS,
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, lengthRatio: 1.0 } },
                },
            ],
        });
        await compare();
    });

    it('should use absolute cap.length on line series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, length: 75.0 } },
                },
            ],
        });
        await compare();
    });

    it('should use absolute cap.length on bar series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, length: 30.0 } },
                },
            ],
        });
        await compare();
    });

    it('should use absolute cap.length on scatter series', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_BOYLESLAW,
                    errorBar: { ...SERIES_BOYLESLAW.errorBar, cap: { strokeWidth: 4, length: 75.0 } },
                },
            ],
        });
        await compare();
    });

    it('should limit cap.length to bar width', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, length: 100.0 } },
                },
            ],
        });
        await compare();
    });

    it('should favour cap length over cap ratio', async () => {
        chart = AgEnterpriseCharts.create({
            ...opts,
            series: [
                {
                    ...SERIES_BOYLESLAW,
                    type: 'scatter',
                    errorBar: {
                        ...SERIES_BOYLESLAW.errorBar,
                        cap: {
                            strokeWidth: 4,
                            length: 45.0,
                            lengthRatio: 1.0,
                        },
                    },
                },
            ],
        });
        await compare();
    });

    it('should render caps over highlight', async () => {
        chart = deproxy(
            AgEnterpriseCharts.create({
                ...opts,
                series: [
                    {
                        ...SERIES_CANADA,
                        type: 'bar',
                        data: FEWER_MONTHS,
                        errorBar: { ...SERIES_CANADA.errorBar, strokeWidth: 10, cap: { lengthRatio: 1 } },
                    },
                ],
            })
        );
        await waitForChartStability(chart);

        const { x, y } = getItemCoords(2);
        await hoverAction(x, y)(chart);
        await compare();
    });

    it('should provide tooltip params', async () => {
        const expectedParams = {
            xLowerKey: 'volumeLower',
            xUpperKey: 'volumeUpper',
            xLowerName: 'volume lower name',
            xUpperName: 'volume upper name',
            yLowerKey: 'pressureLower',
            yUpperKey: 'pressureUpper',
            yLowerName: 'pressure lower name',
            yUpperName: 'PRESSURE UPPER NAME',
        };
        let actualParams: any = undefined;
        function renderer(params: AgScatterSeriesTooltipRendererParams) {
            actualParams = params;
            return { content: '' };
        }

        chart = deproxy(
            AgEnterpriseCharts.create({
                ...opts,
                series: [{ ...SERIES_BOYLESLAW, errorBar: { ...expectedParams }, tooltip: { renderer } }],
            })
        );
        await waitForChartStability(chart);

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(actualParams['xLowerName']).toBe(expectedParams.xLowerName);
        expect(actualParams['xUpperName']).toBe(expectedParams.xUpperName);
        expect(actualParams['xLowerKey']).toBe(expectedParams.xLowerKey);
        expect(actualParams['xUpperKey']).toBe(expectedParams.xUpperKey);
        expect(actualParams['yLowerName']).toBe(expectedParams.yLowerName);
        expect(actualParams['yUpperName']).toBe(expectedParams.yUpperName);
        expect(actualParams['yLowerKey']).toBe(expectedParams.yLowerKey);
        expect(actualParams['yUpperKey']).toBe(expectedParams.yUpperKey);
    });

    it('should provide keys as default names in tooltip params', async () => {
        const expectedParams = {
            xLowerKey: 'volumeLower',
            xUpperKey: 'volumeUpper',
            yLowerKey: 'pressureLower',
            yUpperKey: 'pressureUpper',
        };
        let actualParams: any = undefined;
        function renderer(params: AgScatterSeriesTooltipRendererParams) {
            actualParams = params;
            return { content: '' };
        }

        chart = deproxy(
            AgEnterpriseCharts.create({
                ...opts,
                series: [{ ...SERIES_BOYLESLAW, errorBar: { ...expectedParams }, tooltip: { renderer } }],
            })
        );
        await waitForChartStability(chart);

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(actualParams['xLowerName']).toBe(expectedParams.xLowerKey);
        expect(actualParams['xUpperName']).toBe(expectedParams.xUpperKey);
        expect(actualParams['yLowerName']).toBe(expectedParams.yLowerKey);
        expect(actualParams['yUpperName']).toBe(expectedParams.yUpperKey);
    });
});
