import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgErrorBarFormatterParams,
    AgErrorBarOptions,
    AgScatterSeriesOptions,
    AgScatterSeriesTooltipRendererParams,
} from 'ag-charts-community';
import {
    Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    computeLegendBBox,
    extractImageData,
    getCursor,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

export type ErrorBarFormatter = NonNullable<AgErrorBarOptions['formatter']>;
export type ErrorBarCapFormatter = NonNullable<NonNullable<AgErrorBarOptions['cap']>['formatter']>;

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

const SERIES_ALTERNATE_NAMES = {
    ...SERIES_AUSTRALIA,
    // Same data as Australia, but with alternate names for error bar keys
    data: [
        { month: 'Jan', temperature: 8.0, lower: 6.5, upper: 10.0 },
        { month: 'Feb', temperature: 8.5, lower: 7.0, upper: 10.5 },
        { month: 'Mar', temperature: 10.0, lower: 8.5, upper: 12.0 },
        { month: 'Apr', temperature: 12.0, lower: 10.5, upper: 13.5 },
        { month: 'May', temperature: 14.5, lower: 13.0, upper: 16.0 },
        { month: 'Jun', temperature: 16.5, lower: 15.0, upper: 18.0 },
        { month: 'Jul', temperature: 18.0, lower: 16.5, upper: 19.5 },
        { month: 'Aug', temperature: 17.0, lower: 15.5, upper: 18.5 },
        { month: 'Sep', temperature: 15.5, lower: 14.0, upper: 17.0 },
        { month: 'Oct', temperature: 12.5, lower: 11.0, upper: 14.0 },
        { month: 'Nov', temperature: 10.0, lower: 8.5, upper: 11.5 },
        { month: 'Dec', temperature: 8.5, lower: 7.0, upper: 10.0 },
    ],
    errorBar: { yLowerKey: 'lower', yUpperKey: 'upper' },
};

const AUSTRALIA_AND_CANADA_DATA = [
    { month: 'Jan', aus: 8.0, ausLo: 6.5, ausHi: 10.0, can: 12.5, canLo: 10.0, canHi: 15.0 },
    { month: 'Feb', aus: 8.5, ausLo: 7.0, ausHi: 10.5, can: 13.0, canLo: 11.5, canHi: 15.5 },
    { month: 'Mar', aus: 10.0, ausLo: 8.5, ausHi: 12.0, can: 15.5, canLo: 13.0, canHi: 18.0 },
    { month: 'Apr', aus: 12.0, ausLo: 10.5, ausHi: 13.5, can: 18.0, canLo: 16.5, canHi: 19.5 },
    { month: 'May', aus: 14.5, ausLo: 13.0, ausHi: 16.0, can: 21.5, canLo: 19.0, canHi: 24.0 },
    { month: 'Jun', aus: 16.5, ausLo: 15.0, ausHi: 18.0, can: 24.0, canLo: 22.5, canHi: 26.0 },
    { month: 'Jul', aus: 18.0, ausLo: 16.5, ausHi: 19.5, can: 26.5, canLo: 24.0, canHi: 29.0 },
    { month: 'Aug', aus: 17.0, ausLo: 15.5, ausHi: 18.5, can: 25.0, canLo: 22.5, canHi: 28.0 },
    { month: 'Sep', aus: 15.5, ausLo: 14.0, ausHi: 17.0, can: 23.5, canLo: 21.0, canHi: 27.0 },
    { month: 'Oct', aus: 12.5, ausLo: 11.0, ausHi: 14.0, can: 20.0, canLo: 17.5, canHi: 22.5 },
    { month: 'Nov', aus: 10.0, ausLo: 8.5, ausHi: 11.5, can: 16.5, canLo: 14.0, canHi: 19.0 },
    { month: 'Dec', aus: 8.5, ausLo: 7.0, ausHi: 10.0, can: 13.0, canLo: 11.5, canHi: 15.5 },
];

const SERIES_BOYLESLAW: AgScatterSeriesOptions = {
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
    setupMockConsole();

    let chart: Chart;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart.destroy();
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const getItemCoords = (itemIndex: number): { x: number; y: number } => {
        const series = chart['series'][0] as any;
        const item = series['contextNodeData'].nodeData[itemIndex];
        return series.rootGroup.inverseTransformPoint(item.midPoint.x, item.midPoint.y);
    };

    it('should render 1 line series as expected', async () => {
        chart = await createEnterpriseChart({ series: [{ ...SERIES_CANADA, type: 'line' }] });
        await compare();
    });

    it('should render 1 bar series as expected', async () => {
        chart = await createEnterpriseChart({ series: [{ ...SERIES_CANADA, type: 'bar' }] });
        await compare();
    });

    it('should render 2 line series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [
                { ...SERIES_CANADA, type: 'line' },
                { ...SERIES_AUSTRALIA, type: 'line' },
            ],
        });
        await compare();
    });

    it('should render 2 bar series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [
                { ...SERIES_CANADA, type: 'bar' },
                { ...SERIES_AUSTRALIA, type: 'bar' },
            ],
        });
        await compare();
    });

    it('should render 2 bar series with alternate key names as expected', async () => {
        chart = await createEnterpriseChart({
            series: [
                { ...SERIES_CANADA, type: 'bar' },
                { ...SERIES_ALTERNATE_NAMES, type: 'bar' },
            ],
        });
        await compare();
    });

    it('should render vertical grouped bar series as expected', async () => {
        chart = await createEnterpriseChart({
            data: AUSTRALIA_AND_CANADA_DATA,
            series: [
                {
                    type: 'bar',
                    stackGroup: 'myGroup',
                    xKey: 'month',
                    yKey: 'can',
                    yName: 'Canada',
                    errorBar: { yLowerKey: 'canLo', yUpperKey: 'canHi' },
                },
                {
                    type: 'bar',
                    stackGroup: 'myGroup',
                    xKey: 'month',
                    yKey: 'aus',
                    yName: 'Australia',
                    errorBar: { yLowerKey: 'ausLo', yUpperKey: 'ausHi' },
                },
            ],
        });
        await compare();
    });

    it('should render horizontal grouped bar series as expected', async () => {
        chart = await createEnterpriseChart({
            data: AUSTRALIA_AND_CANADA_DATA,
            series: [
                {
                    type: 'bar',
                    stackGroup: 'myGroup',
                    xKey: 'month',
                    yKey: 'can',
                    yName: 'Canada',
                    direction: 'horizontal',
                    errorBar: { yLowerKey: 'canLo', yUpperKey: 'canHi' },
                },
                {
                    type: 'bar',
                    stackGroup: 'myGroup',
                    xKey: 'month',
                    yKey: 'aus',
                    yName: 'Australia',
                    direction: 'horizontal',
                    errorBar: { yLowerKey: 'ausLo', yUpperKey: 'ausHi' },
                },
            ],
        });
        await compare();
    });

    it('should render horizontal bar series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [
                { ...SERIES_CANADA, type: 'bar', direction: 'horizontal' },
                { ...SERIES_AUSTRALIA, type: 'bar', direction: 'horizontal' },
            ],
        });
        await compare();
    });

    it('should render both errorbars on scatter series as expected', async () => {
        chart = await createEnterpriseChart({ series: [SERIES_BOYLESLAW] });
        await compare();
    });

    it('should render both errorbars on continuous line series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [{ ...SERIES_BOYLESLAW, type: 'line' }],
            axes: [
                { type: 'number', position: 'left' },
                { type: 'number', position: 'bottom' },
            ],
        });
        await compare();
    });

    it('should extend Y axis on line series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [{ ...SERIES_CANADA, data: EXTENDING_BARS }],
        });
        await compare();
    });

    it('should extend Y axis on vertical bar series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [{ ...SERIES_CANADA, type: 'bar', data: EXTENDING_BARS }],
        });
        await compare();
    });

    it('should extend X axis on horizontal bar series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [{ ...SERIES_CANADA, type: 'bar', direction: 'horizontal', data: EXTENDING_BARS }],
        });
        await compare();
    });

    it('should apply stroke styling to whiskers and cap as expected', async () => {
        chart = await createEnterpriseChart({
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

    it('should apply line dash styling to whiskers and cap as expected', async () => {
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    data: FEWER_MONTHS,
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        lineDash: [5],
                        lineDashOffset: 2,
                    },
                },
            ],
        });
        await compare();
    });

    it('should override cap styling as expected', async () => {
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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
        chart = await createEnterpriseChart({
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

    it('should use marker strokeWidth for cap lengthRatio', async () => {
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_BOYLESLAW,
                    marker: { size: 80, strokeWidth: 60 },
                    data: [
                        { volume: 2, volumeLower: 1, volumeUpper: 3, pressure: 2, pressureLower: 1, pressureUpper: 3 },
                    ],
                },
            ],
        });
        await compare();
    });

    it('should render caps over highlight', async () => {
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'bar',
                    data: FEWER_MONTHS,
                    errorBar: { ...SERIES_CANADA.errorBar, strokeWidth: 10, cap: { lengthRatio: 1 } },
                },
            ],
        });

        const { x, y } = getItemCoords(2);
        await hoverAction(x, y)(chart);
        await compare();
    });

    it('should dim opacity on highlight', async () => {
        chart = await createEnterpriseChart({
            series: [{ ...SERIES_CANADA }, { ...SERIES_AUSTRALIA, highlightStyle: { series: { dimOpacity: 0.3 } } }],
        });

        // Highlight Canada (Australia should be dimmed)
        const { x, y } = getItemCoords(2);
        await hoverAction(x, y)(chart);
        await compare();

        // Unhighlight Canada (Australia opacity to should be restored)
        await hoverAction(0, 0)(chart);
        await compare();
    });

    it('should render default tooltips', async () => {
        chart = await createEnterpriseChart({ series: [SERIES_BOYLESLAW] });

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(document.querySelectorAll('.ag-chart-tooltip')).toMatchSnapshot();
    });

    it('AG-10525 should render tooltips with no errorbars', async () => {
        const { data, xKey, yKey } = SERIES_AUSTRALIA;
        chart = await createEnterpriseChart({ data, series: [{ type: 'line', xKey, yKey }] });

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(document.querySelectorAll('.ag-chart-tooltip')).toMatchSnapshot();
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

        chart = await createEnterpriseChart({
            series: [{ ...SERIES_BOYLESLAW, errorBar: { ...expectedParams }, tooltip: { renderer } }],
        });

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

        chart = await createEnterpriseChart({
            series: [{ ...SERIES_BOYLESLAW, errorBar: { ...expectedParams }, tooltip: { renderer } }],
        });

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(actualParams['xLowerName']).toBe(expectedParams.xLowerKey);
        expect(actualParams['xUpperName']).toBe(expectedParams.xUpperKey);
        expect(actualParams['yLowerName']).toBe(expectedParams.yLowerKey);
        expect(actualParams['yUpperName']).toBe(expectedParams.yUpperKey);
    });

    it('should toggle visibility as expected', async () => {
        chart = await createEnterpriseChart({
            series: [
                { ...SERIES_CANADA, type: 'line' },
                { ...SERIES_AUSTRALIA, type: 'line' },
            ],
        });

        const { x = 0, y = 0, width = 0 } = computeLegendBBox(chart);

        // Hide Canada
        await clickAction(x, y)(chart);
        await compare();

        // Show Canada
        await clickAction(x, y)(chart);
        await compare();

        // Hide Australia
        await clickAction(x + width - 1, y)(chart);
        await compare();
    });

    it('should apply formatter as expected', async () => {
        const whisker_formatter: ErrorBarFormatter = (params) => {
            let color = undefined;
            switch (params.datum[params.xKey]) {
                case 'Jan':
                    return { cap: { length: 40 } };
                case 'Feb':
                    return { cap: { lengthRatio: 0.5 } };
                case 'Apr':
                case 'May':
                case 'Jun':
                    color = 'blue';
                    break;
                case 'Jul':
                case 'Aug':
                case 'Sep':
                    color = 'green';
                    break;
                case 'Oct':
                case 'Nov':
                case 'Dec':
                    color = 'gold';
                    break;
            }
            return { stroke: color };
        };
        const cap_formatter: ErrorBarCapFormatter = (params) => {
            switch (params.datum[params.xKey]) {
                case 'Jan':
                case 'Feb':
                case 'Mar':
                case 'Apr':
                case 'May':
                case 'Jun':
                    return { strokeWidth: 10 };
                case 'Nov':
                    return { length: 50 };
                case 'Dec':
                    return { lengthRatio: 0.5 };
            }
        };
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_CANADA,
                    marker: { size: 25 },
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        strokeWidth: 3,
                        formatter: whisker_formatter,
                        cap: { formatter: cap_formatter },
                    },
                },
            ],
        });
        await compare();
    });

    it('should set formatter highlighted param as expected', async () => {
        const whiskerResult: boolean[] = [];
        const capResult: boolean[] = [];
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_CANADA,
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        formatter: (param: AgErrorBarFormatterParams) => {
                            whiskerResult.push(param.highlighted);
                            return {};
                        },
                        cap: {
                            formatter: (param: AgErrorBarFormatterParams) => {
                                capResult.push(param.highlighted);
                                return {};
                            },
                        },
                    },
                },
            ],
        });

        // Check formatter initialisation
        const allfalse = [false, false, false, false, false, false, false, false, false, false, false, false];
        expect(whiskerResult).toStrictEqual(allfalse);
        expect(capResult).toStrictEqual(allfalse);
        whiskerResult.length = 0;
        capResult.length = 0;

        // Hover over an error bar
        const { x, y } = getItemCoords(4);
        await hoverAction(x, y - 20)(chart);
        await waitForChartStability(chart);
        expect(whiskerResult).toStrictEqual([true]);
        expect(capResult).toStrictEqual([true]);
        whiskerResult.length = 0;
        capResult.length = 0;

        // Hover over nothing
        await hoverAction(0, 0)(chart);
        await waitForChartStability(chart);
        expect(whiskerResult).toStrictEqual([false]);
        expect(capResult).toStrictEqual([false]);
    });

    it('should use correct cursor', async () => {
        chart = await createEnterpriseChart({
            tooltip: { range: 2 },
            series: [{ ...SERIES_BOYLESLAW, cursor: 'grab' }],
        });

        const { x, y } = getItemCoords(4);

        // Hover over an error bar
        await hoverAction(x, y - 20)(chart);
        await waitForChartStability(chart);
        expect(getCursor(chart)).toBe('grab');

        // Hover over nothing
        await hoverAction(x, y - 100)(chart);
        await waitForChartStability(chart);
        expect(getCursor(chart)).toBe('default');
    });
});
