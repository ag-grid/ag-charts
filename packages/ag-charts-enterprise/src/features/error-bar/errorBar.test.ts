import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgBarSeriesItemStylerParams,
    type AgBarSeriesStyle,
    type AgCartesianChartOptions,
    type AgErrorBarItemStylerParams,
    type AgErrorBarThemeableOptions,
    type AgScatterSeriesOptions,
    type AgScatterSeriesTooltipRendererParams,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_UNHIGHLIGHT_DELAY,
    type MockErrorBarStyler,
    clickAction,
    computeLegendBBox,
    extractImageData,
    getCursor,
    hoverAction,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

const SERIES_CANADA = {
    data: [
        { month: 'Jan', temperature: 12.5, temperatureLower: 10, temperatureUpper: 15 },
        { month: 'Feb', temperature: 13, temperatureLower: 11.5, temperatureUpper: 15.5 },
        { month: 'Mar', temperature: 15.5, temperatureLower: 13, temperatureUpper: 18 },
        { month: 'Apr', temperature: 18, temperatureLower: 16.5, temperatureUpper: 19.5 },
        { month: 'May', temperature: 21.5, temperatureLower: 19, temperatureUpper: 24 },
        { month: 'Jun', temperature: 24, temperatureLower: 22.5, temperatureUpper: 26 },
        { month: 'Jul', temperature: 26.5, temperatureLower: 24, temperatureUpper: 29 },
        { month: 'Aug', temperature: 25, temperatureLower: 22.5, temperatureUpper: 28 },
        { month: 'Sep', temperature: 23.5, temperatureLower: 21, temperatureUpper: 27 },
        { month: 'Oct', temperature: 20, temperatureLower: 17.5, temperatureUpper: 22.5 },
        { month: 'Nov', temperature: 16.5, temperatureLower: 14, temperatureUpper: 19 },
        { month: 'Dec', temperature: 13, temperatureLower: 11.5, temperatureUpper: 15.5 },
    ],
    xKey: 'month',
    yKey: 'temperature',
    yName: 'Canada',
    errorBar: { yLowerKey: 'temperatureLower', yUpperKey: 'temperatureUpper' },
};

const SERIES_AUSTRALIA = {
    data: [
        { month: 'Jan', temperature: 8, temperatureLower: 6.5, temperatureUpper: 10 },
        { month: 'Feb', temperature: 8.5, temperatureLower: 7, temperatureUpper: 10.5 },
        { month: 'Mar', temperature: 10, temperatureLower: 8.5, temperatureUpper: 12 },
        { month: 'Apr', temperature: 12, temperatureLower: 10.5, temperatureUpper: 13.5 },
        { month: 'May', temperature: 14.5, temperatureLower: 13, temperatureUpper: 16 },
        { month: 'Jun', temperature: 16.5, temperatureLower: 15, temperatureUpper: 18 },
        { month: 'Jul', temperature: 18, temperatureLower: 16.5, temperatureUpper: 19.5 },
        { month: 'Aug', temperature: 17, temperatureLower: 15.5, temperatureUpper: 18.5 },
        { month: 'Sep', temperature: 15.5, temperatureLower: 14, temperatureUpper: 17 },
        { month: 'Oct', temperature: 12.5, temperatureLower: 11, temperatureUpper: 14 },
        { month: 'Nov', temperature: 10, temperatureLower: 8.5, temperatureUpper: 11.5 },
        { month: 'Dec', temperature: 8.5, temperatureLower: 7, temperatureUpper: 10 },
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
    { month: 'Jan', temperature: 12.5, temperatureLower: 2, temperatureUpper: 15 },
    { month: 'Feb', temperature: 13, temperatureLower: 11.5, temperatureUpper: 15.5 },
    { month: 'Mar', temperature: 15.5, temperatureLower: 13, temperatureUpper: 18 },
    { month: 'Apr', temperature: 18, temperatureLower: 16.5, temperatureUpper: 19.5 },
    { month: 'May', temperature: 21.5, temperatureLower: 19, temperatureUpper: 24 },
    { month: 'Jun', temperature: 24, temperatureLower: 22.5, temperatureUpper: 26 },
    { month: 'Jul', temperature: 26.5, temperatureLower: 24, temperatureUpper: 40 },
    { month: 'Aug', temperature: 25, temperatureLower: 22.5, temperatureUpper: 28 },
    { month: 'Sep', temperature: 23.5, temperatureLower: 21, temperatureUpper: 27 },
    { month: 'Oct', temperature: 20, temperatureLower: 17.5, temperatureUpper: 22.5 },
    { month: 'Nov', temperature: 16.5, temperatureLower: 14, temperatureUpper: 19 },
    { month: 'Dec', temperature: 13, temperatureLower: 11.5, temperatureUpper: 15.5 },
];

const FEWER_MONTHS = [
    // Same data as Canada, but with few months for test cap lengthRatio better
    { month: 'Jan', temperature: 12.5, temperatureLower: 10, temperatureUpper: 15 },
    { month: 'Apr', temperature: 18, temperatureLower: 16.5, temperatureUpper: 19.5 },
    { month: 'Jul', temperature: 26.5, temperatureLower: 24, temperatureUpper: 29 },
    { month: 'Oct', temperature: 20, temperatureLower: 17.5, temperatureUpper: 22.5 },
];

const SERIES_ALTERNATE_NAMES = {
    ...SERIES_AUSTRALIA,
    // Same data as Australia, but with alternate names for error bar keys
    data: [
        { month: 'Jan', temperature: 8, lower: 6.5, upper: 10 },
        { month: 'Feb', temperature: 8.5, lower: 7, upper: 10.5 },
        { month: 'Mar', temperature: 10, lower: 8.5, upper: 12 },
        { month: 'Apr', temperature: 12, lower: 10.5, upper: 13.5 },
        { month: 'May', temperature: 14.5, lower: 13, upper: 16 },
        { month: 'Jun', temperature: 16.5, lower: 15, upper: 18 },
        { month: 'Jul', temperature: 18, lower: 16.5, upper: 19.5 },
        { month: 'Aug', temperature: 17, lower: 15.5, upper: 18.5 },
        { month: 'Sep', temperature: 15.5, lower: 14, upper: 17 },
        { month: 'Oct', temperature: 12.5, lower: 11, upper: 14 },
        { month: 'Nov', temperature: 10, lower: 8.5, upper: 11.5 },
        { month: 'Dec', temperature: 8.5, lower: 7, upper: 10 },
    ],
    errorBar: { yLowerKey: 'lower', yUpperKey: 'upper' },
};

const AUSTRALIA_AND_CANADA_DATA = [
    { month: 'Jan', aus: 8, ausLo: 6.5, ausHi: 10, can: 12.5, canLo: 10, canHi: 15 },
    { month: 'Feb', aus: 8.5, ausLo: 7, ausHi: 10.5, can: 13, canLo: 11.5, canHi: 15.5 },
    { month: 'Mar', aus: 10, ausLo: 8.5, ausHi: 12, can: 15.5, canLo: 13, canHi: 18 },
    { month: 'Apr', aus: 12, ausLo: 10.5, ausHi: 13.5, can: 18, canLo: 16.5, canHi: 19.5 },
    { month: 'May', aus: 14.5, ausLo: 13, ausHi: 16, can: 21.5, canLo: 19, canHi: 24 },
    { month: 'Jun', aus: 16.5, ausLo: 15, ausHi: 18, can: 24, canLo: 22.5, canHi: 26 },
    { month: 'Jul', aus: 18, ausLo: 16.5, ausHi: 19.5, can: 26.5, canLo: 24, canHi: 29 },
    { month: 'Aug', aus: 17, ausLo: 15.5, ausHi: 18.5, can: 25, canLo: 22.5, canHi: 28 },
    { month: 'Sep', aus: 15.5, ausLo: 14, ausHi: 17, can: 23.5, canLo: 21, canHi: 27 },
    { month: 'Oct', aus: 12.5, ausLo: 11, ausHi: 14, can: 20, canLo: 17.5, canHi: 22.5 },
    { month: 'Nov', aus: 10, ausLo: 8.5, ausHi: 11.5, can: 16.5, canLo: 14, canHi: 19 },
    { month: 'Dec', aus: 8.5, ausLo: 7, ausHi: 10, can: 13, canLo: 11.5, canHi: 15.5 },
];

const SERIES_BOYLESLAW: AgScatterSeriesOptions = {
    type: 'scatter',
    data: [
        { volume: 0.5, volumeLower: 0.45, volumeUpper: 0.55, pressure: 9.5, pressureLower: 10.3, pressureUpper: 8.7 },
        { volume: 1, volumeLower: 0.9, volumeUpper: 1.1, pressure: 8.1, pressureLower: 8.9, pressureUpper: 7.4 },
        { volume: 1.5, volumeLower: 1.35, volumeUpper: 1.65, pressure: 6.8, pressureLower: 7.5, pressureUpper: 6.2 },
        { volume: 2, volumeLower: 1.8, volumeUpper: 2.2, pressure: 5.5, pressureLower: 5.9, pressureUpper: 5 },
        { volume: 2.5, volumeLower: 2.25, volumeUpper: 2.75, pressure: 4.2, pressureLower: 4.7, pressureUpper: 3.8 },
        { volume: 3, volumeLower: 2.7, volumeUpper: 3.3, pressure: 3.1, pressureLower: 3.5, pressureUpper: 2.8 },
        { volume: 3.5, volumeLower: 3.15, volumeUpper: 3.85, pressure: 2, pressureLower: 2.3, pressureUpper: 1.8 },
        { volume: 4, volumeLower: 3.6, volumeUpper: 4.4, pressure: 1.2, pressureLower: 1.4, pressureUpper: 1.1 },
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
        return _ModuleSupport.Transformable.toCanvasPoint(series.contentGroup, item.midPoint.x, item.midPoint.y);
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
            axes: {
                y: { type: 'number', position: 'left' },
                x: { type: 'number', position: 'bottom' },
            },
        });
        await compare();
    });

    it('should extend Y axis on line series as expected', async () => {
        chart = await createEnterpriseChart({
            series: [{ ...SERIES_CANADA, type: 'line', data: EXTENDING_BARS }],
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
                    size: 55,
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
                    size: 55,
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
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, lengthRatio: 1 } },
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
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, lengthRatio: 1 } },
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
                    type: 'line',
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, length: 75 } },
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
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, length: 30 } },
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
                    errorBar: { ...SERIES_BOYLESLAW.errorBar, cap: { strokeWidth: 4, length: 75 } },
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
                    errorBar: { ...SERIES_CANADA.errorBar, cap: { strokeWidth: 4, length: 100 } },
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
                            length: 45,
                            lengthRatio: 1,
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
                    size: 80,
                    strokeWidth: 60,
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
            highlight: {
                drawingMode: 'cutout',
            },
            series: [
                { type: 'line', ...SERIES_CANADA },
                { type: 'line', ...SERIES_AUSTRALIA, highlight: { unhighlightedSeries: { opacity: 0.3 } } },
            ],
        });

        // Highlight Canada (Australia should be dimmed)
        const { x, y } = getItemCoords(2);
        await hoverAction(x, y)(chart);
        await compare();

        // Unhighlight Canada (Australia opacity to should be restored)
        await hoverAction(0, 0)(chart);
        await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
        await compare();
    });

    it('should render default tooltips', async () => {
        chart = await createEnterpriseChart({ series: [SERIES_BOYLESLAW] });

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(document.querySelectorAll('.ag-charts-tooltip')).toMatchSnapshot();
    });

    it('AG-10525 should render tooltips with no errorbars', async () => {
        const { data, xKey, yKey } = SERIES_AUSTRALIA;
        chart = await createEnterpriseChart({ data, series: [{ type: 'line', xKey, yKey }] });

        const { x, y } = getItemCoords(4);
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);

        expect(document.querySelectorAll('.ag-charts-tooltip')).toMatchSnapshot();
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
            return '';
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
            return '';
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

    it('should apply itemStyler as expected', async () => {
        const itemStyler: Styler<AgErrorBarItemStylerParams<any>, AgErrorBarThemeableOptions> = (params) => {
            let stroke, cap;
            switch (params.datum[params.xKey]) {
                case 'Jan':
                    cap = { length: 40, strokeWidth: 10 };
                    break;
                case 'Feb':
                    cap = { lengthRatio: 0.5, strokeWidth: 10 };
                    break;
                case 'Mar':
                    cap = { strokeWidth: 10 };
                    break;
                case 'Apr':
                case 'May':
                case 'Jun':
                    stroke = 'blue';
                    cap = { strokeWidth: 10 };
                    break;
                case 'Jul':
                case 'Aug':
                case 'Sep':
                    stroke = 'green';
                    break;
                case 'Oct':
                    stroke = 'gold';
                    break;
                case 'Nov':
                    stroke = 'gold';
                    cap = { length: 50 };
                    break;
                case 'Dec':
                    stroke = 'gold';
                    cap = { lengthRatio: 0.5 };
                    break;
            }
            return { stroke, cap };
        };
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'line',
                    marker: { size: 25 },
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        strokeWidth: 3,
                        itemStyler,
                    },
                },
            ],
        });
        await compare();
    });

    it('should set itemStyler highlightState param as expected', async () => {
        const result: string[] = [];
        chart = await createEnterpriseChart({
            series: [
                {
                    ...SERIES_CANADA,
                    type: 'line',
                    errorBar: {
                        ...SERIES_CANADA.errorBar,
                        itemStyler: (param: AgErrorBarItemStylerParams<any>) => {
                            result.push(param.highlightState ?? 'none');
                            return {};
                        },
                    },
                },
            ],
        });

        // Check itemStyler initialisation
        const allNone = [
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
            'none',
        ];
        expect(result).toStrictEqual(allNone);
        result.length = 0;

        // Hover over an error bar
        const { x, y } = getItemCoords(4);
        await hoverAction(x, y - 20)(chart);
        await waitForChartStability(chart);
        expect(result).toStrictEqual(['highlighted-item']);
        result.length = 0;

        // Hover over nothing
        await hoverAction(0, 0)(chart);
        await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
        expect(result).toStrictEqual(['unhighlighted-item']);
    });

    it('AG-14263 should set itemStyler seriesId', async () => {
        type TDatum = { x: string; y: number; yLower: number; yUpper: number };
        const barSeriesItemStyler = jest.fn((_p: AgBarSeriesItemStylerParams<TDatum>): AgBarSeriesStyle => {
            return {};
        });
        const errorBarItemStyler = jest.fn((_p: AgErrorBarItemStylerParams<TDatum>): AgErrorBarThemeableOptions => {
            return {};
        });
        const opts: AgCartesianChartOptions<TDatum> = {
            data: [
                { x: 'Jan', y: 2.5, yLower: 1.5, yUpper: 3.5 },
                { x: 'Feb', y: 3, yLower: 2.3, yUpper: 3.7 },
                { x: 'Mar', y: 2.8, yLower: 2.1, yUpper: 3.5 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    itemStyler: barSeriesItemStyler,
                    errorBar: {
                        itemStyler: errorBarItemStyler,
                        yLowerKey: 'yLower',
                        yUpperKey: 'yUpper',
                    },
                },
            ],
        };
        chart = await createEnterpriseChart(opts);

        expect(errorBarItemStyler).toBeCalledTimes(3);
        expect(errorBarItemStyler.mock.calls[0][0]).toMatchObject({ seriesId: 'BarSeries-1' });
        expect(errorBarItemStyler.mock.calls[1][0]).toMatchObject({ seriesId: 'BarSeries-1' });
        expect(errorBarItemStyler.mock.calls[2][0]).toMatchObject({ seriesId: 'BarSeries-1' });

        expect(barSeriesItemStyler).toBeCalledTimes(3);
        expect(barSeriesItemStyler.mock.calls[0][0]).toMatchObject({ seriesId: 'BarSeries-1' });
        expect(barSeriesItemStyler.mock.calls[2][0]).toMatchObject({ seriesId: 'BarSeries-1' });
        expect(barSeriesItemStyler.mock.calls[1][0]).toMatchObject({ seriesId: 'BarSeries-1' });
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
        await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);
        expect(getCursor(chart)).toBe('default');
    });

    describe('context', () => {
        type TDatum = Readonly<{ quarter: string; sales: number; salesLower: number; salesUpper: number }>;
        type TContext = object;
        type TMock = MockErrorBarStyler<TDatum, TContext>;
        let options: AgCartesianChartOptions<TDatum, TContext>;
        let seriesContext: object;
        const itemStyler = newFreezableMock<TDatum, TContext, TMock>();

        beforeEach(async () => {
            seriesContext = {};
            itemStyler.mock.mockClear();
            options = {
                title: { text: 'Quarterly Car Sales (USD)' },
                data: [
                    { quarter: 'q1', sales: 120000, salesLower: 115000, salesUpper: 125000 },
                    { quarter: 'q2', sales: 150000, salesLower: 145000, salesUpper: 155000 },
                    { quarter: 'q3', sales: 170000, salesLower: 165000, salesUpper: 175000 },
                    { quarter: 'q4', sales: 160000, salesLower: 155000, salesUpper: 165000 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'quarter',
                        yKey: 'sales',
                        errorBar: {
                            yLowerKey: 'salesLower',
                            yUpperKey: 'salesUpper',
                            itemStyler: itemStyler.frozen as any,
                        },
                        context: seriesContext,
                    },
                ],
            };
            chart = await createEnterpriseChart(options);
        });

        test('itemStyler', () => {
            expect(Object.isFrozen(seriesContext)).toBe(false);
            itemStyler.expect().toHaveBeenCalledTimes(4).withContext(seriesContext);
        });
    });
});
