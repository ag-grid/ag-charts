import { describe } from '@jest/globals';

import { registerInbuiltModules } from '../chart/factory/registerInbuiltModules';
import { seriesRegistry } from '../chart/factory/seriesRegistry';
import { setupModules } from '../chart/factory/setupModules';
import * as examples from '../chart/test/examples';
import { ChartTheme } from '../chart/themes/chartTheme';
import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgChartOptions,
    AgLineSeriesOptions,
} from '../options/agChartOptions';
import { doOnce } from '../util/function';
import { ChartOptions } from './optionsModule';
import type { SeriesType } from './optionsModuleTypes';

function prepareOptions<T extends AgChartOptions>(userOptions: T): T {
    const chartOptions = new ChartOptions(userOptions);
    return chartOptions.processedOptions as T;
}

function getSeriesOptions(seriesType: string, mapper?: <T>(series: T) => T) {
    const seriesOptions = seriesOptionsMap[seriesType];
    return mapper ? seriesOptions.map(mapper) : seriesOptions;
}

function switchSeriesType(
    type: 'bar' | 'line' | 'area',
    series: AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions
): AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions {
    return { ...series, type } as any;
}

const baseSeriesIPhone = {
    xKey: 'quarter',
    yKey: 'iphone',
    yName: 'IPhone',
};
const baseSeriesMac = {
    xKey: 'quarter',
    yKey: 'mac',
    yName: 'Mac',
};
const baseSeriesWearables = {
    xKey: 'quarter',
    yKey: 'wearables',
    yName: 'Wearables',
};
const baseSeriesServices = {
    xKey: 'quarter',
    yKey: 'services',
    yName: 'Services',
};

const colSeriesIPhone = switchSeriesType('bar', baseSeriesIPhone);
const colSeriesMac = switchSeriesType('bar', baseSeriesMac);
const colSeriesWearables = switchSeriesType('bar', baseSeriesWearables);
const colSeriesServices = switchSeriesType('bar', baseSeriesServices);
const lineSeriesIPhone = switchSeriesType('line', baseSeriesIPhone);
const lineSeriesMac = switchSeriesType('line', baseSeriesMac);
const areaSeriesIPhone = switchSeriesType('area', baseSeriesIPhone);
const areaSeriesMac = switchSeriesType('area', baseSeriesMac);
const areaSeriesWearables = switchSeriesType('area', baseSeriesWearables);
const areaSeriesServices = switchSeriesType('area', baseSeriesServices);

const seriesOptions: Array<AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions> = [
    {
        ...colSeriesIPhone,
        fill: 'pink',
        showInLegend: true,
    } as AgBarSeriesOptions,
    lineSeriesMac,
    {
        ...colSeriesMac,
        fill: 'red',
        showInLegend: false,
    } as AgBarSeriesOptions,
    lineSeriesIPhone,
    {
        ...colSeriesWearables,
        showInLegend: true,
        grouped: true,
    } as AgBarSeriesOptions,
    {
        ...colSeriesServices,
        showInLegend: false,
        grouped: true,
    } as AgBarSeriesOptions,
];

const areas = [areaSeriesIPhone, areaSeriesMac, areaSeriesWearables, areaSeriesServices];
const lines = [lineSeriesIPhone, lineSeriesMac];
const columns = [colSeriesIPhone, colSeriesMac, colSeriesWearables, colSeriesServices];
const rangeColumns = [
    {
        type: 'range-bar',
        xKey: 'date',
        yLowKey: 'low',
        yHighKey: 'high',
    },
    {
        type: 'range-bar',
        xKey: 'date',
        yLowKey: 'low2',
        yHighKey: 'high2',
    },
];

const nightingales = [
    {
        type: 'nightingale',
        angleKey: 'product',
        radiusKey: 'A sales',
    },
    {
        type: 'nightingale',
        angleKey: 'product',
        radiusKey: 'B sales',
    },
];

const seriesOptionsMap: Record<string, any[]> = {
    area: areas,
    bar: columns,
    line: lines,
    nightingale: nightingales,
    'range-bar': rangeColumns,
};

type TestCase = {
    options: AgChartOptions;
};
const EXAMPLES: Record<string, TestCase> = {
    BAR_CHART_EXAMPLE: {
        options: examples.BAR_CHART_EXAMPLE,
    },
    GROUPED_BAR_CHART_EXAMPLE: {
        options: examples.GROUPED_BAR_CHART_EXAMPLE,
    },
    STACKED_BAR_CHART_EXAMPLE: {
        options: examples.STACKED_BAR_CHART_EXAMPLE,
    },
    ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE,
    },
    BAR_CHART_WITH_LABELS_EXAMPLE: {
        options: examples.BAR_CHART_WITH_LABELS_EXAMPLE,
    },
    SIMPLE_COLUMN_CHART_EXAMPLE: {
        options: examples.SIMPLE_COLUMN_CHART_EXAMPLE,
    },
    GROUPED_COLUMN_EXAMPLE: {
        options: examples.GROUPED_COLUMN_EXAMPLE,
    },
    STACKED_COLUMN_GRAPH_EXAMPLE: {
        options: examples.STACKED_COLUMN_GRAPH_EXAMPLE,
    },
    ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE,
    },
    COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE,
    },
    SIMPLE_PIE_CHART_EXAMPLE: {
        options: examples.SIMPLE_PIE_CHART_EXAMPLE,
    },
    SIMPLE_DONUT_CHART_EXAMPLE: {
        options: examples.SIMPLE_DONUT_CHART_EXAMPLE,
    },
    SIMPLE_LINE_CHART_EXAMPLE: {
        options: examples.SIMPLE_LINE_CHART_EXAMPLE,
    },
    LINE_GRAPH_WITH_GAPS_EXAMPLE: {
        options: examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
    },
    SIMPLE_SCATTER_CHART_EXAMPLE: {
        options: examples.SIMPLE_SCATTER_CHART_EXAMPLE,
    },
    BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
    },
    BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE,
    },
    SIMPLE_AREA_GRAPH_EXAMPLE: {
        options: examples.SIMPLE_AREA_GRAPH_EXAMPLE,
    },
    STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.STACKED_AREA_GRAPH_EXAMPLE,
    },
    ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE,
    },
    AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
    },
    // START ADVANCED EXAMPLES =====================================================================
    ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS: {
        options: examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
    },
    LOG_AXIS_EXAMPLE: {
        options: examples.LOG_AXIS_EXAMPLE,
    },
    ADV_COMBINATION_SERIES_CHART_EXAMPLE: {
        options: examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE,
    },
    ADV_CHART_CUSTOMISATION: {
        options: examples.ADV_CHART_CUSTOMISATION,
    },
    ADV_CUSTOM_MARKER_SHAPES_EXAMPLE: {
        options: examples.ADV_CUSTOM_MARKER_SHAPES_EXAMPLE,
    },
    ADV_CUSTOM_TOOLTIPS_EXAMPLE: {
        options: examples.ADV_CUSTOM_TOOLTIPS_EXAMPLE,
    },
    ADV_PER_MARKER_CUSTOMISATION_EXAMPLE: {
        options: examples.ADV_PER_MARKER_CUSTOMISATION,
    },
};

const COMBO_CHART_EXAMPLE: AgCartesianChartOptions = {
    series: [
        { type: 'line', xKey: 'abc', yKey: 'test2' },
        { type: 'bar', xKey: 'abc', yKey: 'test' },
        { type: 'area', xKey: 'abc', yKey: 'test3' },
    ],
    theme: {
        baseTheme: {
            baseTheme: 'ag-default',
            overrides: {
                bar: { series: { label: { enabled: true } } },
                line: { series: { label: { enabled: true } } },
                area: { series: { label: { enabled: true } } },
            },
        } as any,
        overrides: {},
    },
};

const COMPLEX_THEME_SCENARIO: AgCartesianChartOptions = {
    series: [
        { type: 'line', xKey: 'abc', yKey: 'test2' },
        { type: 'bar', xKey: 'abc', yKey: 'test' },
        { type: 'area', xKey: 'abc', yKey: 'test3' },
        { type: 'area', xKey: 'abc', yKey: 'test4', label: {} },
    ],
    axes: [
        { type: 'time', position: 'bottom' },
        { type: 'time', position: 'bottom', title: { text: 'Time' } },
        { type: 'number', position: 'left', title: { text: 'Velocity' } },
        { type: 'number', position: 'right', title: { text: 'G', enabled: true } },
    ],
    theme: {
        baseTheme: {
            baseTheme: 'ag-default',
            overrides: {
                common: {
                    axes: {
                        number: { title: { _enabledFromTheme: true, enabled: false } },
                    },
                },
                bar: { series: { label: { enabled: false, _enabledFromTheme: true } } },
                line: { series: { label: { enabled: true, _enabledFromTheme: true } } },
            },
        } as any,
        overrides: {},
    },
};

const ENABLED_FALSE_OPTIONS: AgCartesianChartOptions = {
    ...examples.SIMPLE_LINE_CHART_EXAMPLE,
    title: {
        enabled: false,
        text: 'Custom Title',
        fontSize: 40,
        spacing: 200,
    },
    subtitle: {
        enabled: false,
        text: 'Custom Subtitle',
        fontSize: 20,
        spacing: 100,
    },
    footnote: {
        enabled: false,
        text: 'Custom Footnote',
        fontSize: 30,
        spacing: 150,
    },
    axes: [
        {
            position: 'bottom',
            type: 'time',
            maxSpacing: 26,
            tick: {
                enabled: false,
                width: 66,
                size: 44,
            },
            title: {
                enabled: false,
                text: 'Custom Bottom Axis Title',
            },
            label: {
                enabled: false,
                avoidCollisions: false,
                autoRotate: true,
                minSpacing: 15,
            },
            crossLines: [
                {
                    enabled: false,
                    type: 'range',
                    label: {
                        enabled: false,
                        text: 'Custom Crossline Label',
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Custom Left Axis Title',
            },
            label: {
                autoRotate: true,
            },
        },
    ],
    series: [
        {
            ...examples.SIMPLE_LINE_CHART_EXAMPLE.series?.[0],
            marker: {
                enabled: false,
                strokeWidth: 20,
            },
            label: {
                enabled: false,
                color: 'pink',
            },
            tooltip: {
                enabled: false,
                renderer: ({ datum, yKey }) => {
                    const { [yKey]: yValue } = datum;
                    return { title: `Custom Series Tooltip Renderer: ${yValue}` };
                },
            },
        },
    ] as AgLineSeriesOptions[],
    tooltip: {
        enabled: false,
        range: 20,
    },
    legend: {
        enabled: false,
        maxHeight: 100,
        maxWidth: 500,
        orientation: 'horizontal',
        spacing: 55,
        reverseOrder: true,
        pagination: {
            marker: {
                shape: 'circle',
            },
        },
        item: {
            label: {
                maxLength: 33,
            },
        },
    },
    navigator: {
        enabled: false,
        height: 229,
        min: 0.5,
        max: 0.8,
    },
};

describe('ChartOptions', () => {
    beforeAll(() => {
        registerInbuiltModules();
        setupModules();
    });

    beforeEach(() => {
        console.warn = jest.fn();
        doOnce.clear();
    });

    describe('#processSeriesOptions', () => {
        test('Simple series options processing works as expected', () => {
            const { series: options } = prepareOptions({ series: seriesOptions });

            expect(options).toMatchInlineSnapshot(`
[
  {
    "direction": "vertical",
    "fill": "pink",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 0,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#2b5c95",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "iphone",
    "yName": "IPhone",
  },
  {
    "direction": "vertical",
    "fill": "red",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 1,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#1e652e",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "direction": "vertical",
    "fill": "#e1cc00",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 2,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#a69400",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "wearables",
    "yName": "Wearables",
  },
  {
    "direction": "vertical",
    "fill": "#9669cb",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 3,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#603c88",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "services",
    "yName": "Services",
  },
  {
    "label": {
      "color": "rgb(70, 70, 70)",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
    },
    "line": {
      "position": "end",
      "style": "linear",
      "tension": 1,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#ffa03a",
      "shape": "circle",
      "size": 7,
      "stroke": "#cc6f10",
      "strokeWidth": 0,
    },
    "stroke": "#ffa03a",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "type": "node",
      },
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "label": {
      "color": "rgb(70, 70, 70)",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
    },
    "line": {
      "position": "end",
      "style": "linear",
      "tension": 1,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#34bfe1",
      "shape": "circle",
      "size": 7,
      "stroke": "#18859e",
      "strokeWidth": 0,
    },
    "stroke": "#34bfe1",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "type": "node",
      },
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "iphone",
    "yName": "IPhone",
  },
]
`);
        });

        test('Series options with grouped columns processing works as expected', () => {
            const { series: options } = prepareOptions({
                series: seriesOptions.map((s) => (s.type === 'bar' ? { ...s, grouped: true } : s)),
            });

            expect(options).toMatchInlineSnapshot(`
[
  {
    "direction": "vertical",
    "fill": "pink",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 0,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#2b5c95",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "iphone",
    "yName": "IPhone",
  },
  {
    "direction": "vertical",
    "fill": "red",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 1,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#1e652e",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "direction": "vertical",
    "fill": "#e1cc00",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 2,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#a69400",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "wearables",
    "yName": "Wearables",
  },
  {
    "direction": "vertical",
    "fill": "#9669cb",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 4,
      "groupIndex": 3,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#603c88",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "services",
    "yName": "Services",
  },
  {
    "label": {
      "color": "rgb(70, 70, 70)",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
    },
    "line": {
      "position": "end",
      "style": "linear",
      "tension": 1,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#ffa03a",
      "shape": "circle",
      "size": 7,
      "stroke": "#cc6f10",
      "strokeWidth": 0,
    },
    "stroke": "#ffa03a",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "type": "node",
      },
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "label": {
      "color": "rgb(70, 70, 70)",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
    },
    "line": {
      "position": "end",
      "style": "linear",
      "tension": 1,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#34bfe1",
      "shape": "circle",
      "size": 7,
      "stroke": "#18859e",
      "strokeWidth": 0,
    },
    "stroke": "#34bfe1",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "type": "node",
      },
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "iphone",
    "yName": "IPhone",
  },
]
`);
        });

        test('Series options with stacked columns processing works as expected', () => {
            const { series: options } = prepareOptions({
                series: seriesOptions.map((s) => (s.type === 'bar' ? { ...s, stacked: true, grouped: undefined } : s)),
            });

            expect(options).toMatchInlineSnapshot(`
[
  {
    "direction": "vertical",
    "fill": "pink",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 1,
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#2b5c95",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "iphone",
    "yName": "IPhone",
  },
  {
    "direction": "vertical",
    "fill": "red",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 1,
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 1,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#1e652e",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "direction": "vertical",
    "fill": "#e1cc00",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 1,
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 2,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#a69400",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "wearables",
    "yName": "Wearables",
  },
  {
    "direction": "vertical",
    "fill": "#9669cb",
    "fillOpacity": 1,
    "label": {
      "color": "white",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": "normal",
      "placement": "inside",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "seriesGrouping": {
      "groupCount": 1,
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 3,
    },
    "shadow": {
      "blur": 5,
      "color": "rgba(0, 0, 0, 0.5)",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#603c88",
    "strokeWidth": 0,
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "services",
    "yName": "Services",
  },
  {
    "label": {
      "color": "rgb(70, 70, 70)",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
    },
    "line": {
      "position": "end",
      "style": "linear",
      "tension": 1,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#ffa03a",
      "shape": "circle",
      "size": 7,
      "stroke": "#cc6f10",
      "strokeWidth": 0,
    },
    "stroke": "#ffa03a",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "type": "node",
      },
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "label": {
      "color": "rgb(70, 70, 70)",
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
    },
    "line": {
      "position": "end",
      "style": "linear",
      "tension": 1,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#34bfe1",
      "shape": "circle",
      "size": 7,
      "stroke": "#18859e",
      "strokeWidth": 0,
    },
    "stroke": "#34bfe1",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "type": "node",
      },
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "iphone",
    "yName": "IPhone",
  },
]
`);
        });

        describe('Stacking and grouping configuration combinations', () => {
            const seriesTypes: {
                [K in SeriesType]?: { stackable: boolean; groupable: boolean; stackedByDefault: boolean };
            } = {
                area: { stackable: true, groupable: false, stackedByDefault: false },
                bar: { stackable: true, groupable: true, stackedByDefault: false },
                line: { stackable: true, groupable: false, stackedByDefault: false },
                nightingale: { stackable: true, groupable: true, stackedByDefault: true },
                'range-bar': { stackable: false, groupable: true, stackedByDefault: false },
            };

            for (const [seriesType, { stackable, groupable, stackedByDefault }] of Object.entries(seriesTypes)) {
                seriesRegistry.register(
                    seriesType as SeriesType,
                    {
                        chartTypes: ['cartesian'],
                        stackable,
                        groupable,
                        stackedByDefault,
                    } as any
                );
            }

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted stacked property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable && stackedByDefault) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported grouping of series type "${seriesType}".`
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable && stackedByDefault) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable ? stackedByDefault || groupable : groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (!stackable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                        }
                        if (!groupable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported grouping of series type "${seriesType}".`
                            );
                        }
                        if (stackable && groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        }

                        if (stackable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false', stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: false,
                        grouped: false,
                    }));
                    const options = prepareOptions({ series: testOptions });

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(series.seriesGrouping).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: false,
                        grouped: true,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported grouping of series type "${seriesType}".`
                            );
                        }

                        if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: true,
                        grouped: false,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped and stacked properties for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: undefined,
                        grouped: undefined,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    options.series.forEach((series) => {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable ? stackedByDefault || groupable : groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    });
                }
            );
        });
    });

    describe('#prepareOptions', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should prepare options as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = example.options;
                options.container = document.createElement('div');

                const preparedOptions = prepareOptions(options);

                if (options.data) {
                    expect(preparedOptions).toHaveProperty('data', options.data);
                    expect(preparedOptions).toMatchSnapshot({
                        container: expect.any(HTMLElement),
                        data: expect.any(options.data instanceof Array ? Array : Object),
                    });
                } else {
                    const optionsCopy = { ...preparedOptions };
                    optionsCopy.series = (optionsCopy.series as any[]).map((v) => {
                        const copy = { ...v };
                        delete copy.data;
                        return copy;
                    });
                    expect(optionsCopy).toMatchSnapshot({
                        container: expect.any(HTMLElement),
                    });
                }
            }
        );

        it('should merge combo-chart series overrides as expected', () => {
            const options = COMBO_CHART_EXAMPLE;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            expect(preparedOptions.series?.length).toEqual(3);
            expect(preparedOptions.series?.map((s) => s.type)).toEqual(['line', 'bar', 'area']);
            expect(preparedOptions.series?.map((s) => 'label' in s && s.label?.enabled)).toEqual([true, true, true]);
        });

        it('should merge complex theme setups as expected', () => {
            const options = COMPLEX_THEME_SCENARIO;

            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            expect(preparedOptions.axes?.length).toEqual(4);
            expect(preparedOptions.axes?.map((a) => a.type)).toEqual(['time', 'time', 'number', 'number']);
            expect(preparedOptions.axes?.map((a) => a.title?.enabled)).toEqual([false, true, false, true]);
            expect(preparedOptions.series?.length).toEqual(4);
            expect(preparedOptions.series?.map((s) => s.type)).toEqual(['line', 'bar', 'area', 'area']);
            expect(preparedOptions.series?.map((s) => 'label' in s && s.label?.enabled)).toEqual([
                true,
                false,
                false,
                true,
            ]);
        });

        it('should use default theme options when `enabled` is set to `false` on an options object', () => {
            const options = ENABLED_FALSE_OPTIONS;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);
            const theme = new ChartTheme();

            expect(preparedOptions.title?.enabled).toBe(false);
            expect(preparedOptions.title?.text).toBe(theme.config.line.title.text);
            expect(preparedOptions.title?.fontSize).toBe(theme.config.line.title.fontSize);
            expect(preparedOptions.title?.spacing).toBe(theme.config.line.title.spacing);

            expect(preparedOptions.subtitle?.enabled).toBe(false);
            expect(preparedOptions.subtitle?.text).toBe(theme.config.line.subtitle.text);
            expect(preparedOptions.subtitle?.fontSize).toBe(theme.config.line.subtitle.fontSize);
            expect(preparedOptions.subtitle?.spacing).toBe(theme.config.line.subtitle.spacing);

            expect(preparedOptions.footnote?.enabled).toBe(false);
            expect(preparedOptions.footnote?.text).toBe(theme.config.line.footnote.text);
            expect(preparedOptions.footnote?.fontSize).toBe(theme.config.line.footnote.fontSize);
            expect(preparedOptions.footnote?.spacing).toBe(theme.config.line.footnote.spacing);

            expect(preparedOptions.axes?.[0]?.tick?.enabled).toBe(false);
            expect(preparedOptions.axes?.[0]?.tick?.width).toBe(theme.config.line.axes.time.tick.width);
            expect(preparedOptions.axes?.[0]?.tick?.size).toBe(theme.config.line.axes.time.tick.size);

            expect(preparedOptions.axes?.[0]?.title?.enabled).toBe(false);
            expect(preparedOptions.axes?.[0]?.title?.text).toBe(theme.config.line.axes.time.title.text);

            expect(preparedOptions.axes?.[0]?.label?.enabled).toBe(false);
            expect(preparedOptions.axes?.[0]?.label?.avoidCollisions).toBe(
                theme.config.line.axes.time.label.avoidCollisions
            );
            expect(preparedOptions.axes?.[0]?.label?.autoRotate).toBe(theme.config.line.axes.time.label.autoRotate);
            expect(preparedOptions.axes?.[0]?.label?.minSpacing).toBe(theme.config.line.axes.time.label.minSpacing);

            expect(preparedOptions.axes?.[0]?.crossLines?.[0]?.enabled).toBe(false);
            expect(preparedOptions.axes?.[0]?.crossLines?.[0]?.type).toBe(theme.config.line.axes.time.crossLines.type);
            expect(preparedOptions.axes?.[0]?.crossLines?.[0]?.label?.enabled).toBe(false);
            expect(preparedOptions.axes?.[0]?.crossLines?.[0]?.label?.text).toBe(
                theme.config.line.axes.time.crossLines.label.text
            );

            expect(preparedOptions.axes![1]?.title?.enabled).toBe(true);
            expect(preparedOptions.axes![1]?.title?.text).toBe('Custom Left Axis Title');

            const series0 = preparedOptions.series?.[0] as AgLineSeriesOptions | undefined;
            expect(series0?.marker?.enabled).toBe(false);
            expect(series0?.marker?.strokeWidth).toBe(theme.config.line.series.marker.strokeWidth);
            expect(series0?.label?.enabled).toBe(false);
            expect(series0?.label?.color).toBe(theme.config.line.series.label.color);
            expect(series0?.tooltip?.enabled).toBe(false);
            expect(series0?.tooltip?.renderer).toBe(theme.config.line.series.tooltip.renderer);

            expect(preparedOptions.tooltip?.enabled).toBe(false);
            expect(preparedOptions.tooltip?.range).toBe(theme.config.line.tooltip.range);

            expect(preparedOptions.legend?.enabled).toBe(false);
            expect(preparedOptions.legend?.maxHeight).toBe(theme.config.line.legend.maxHeight);
            expect(preparedOptions.legend?.maxWidth).toBe(theme.config.line.legend.maxWidth);
            expect(preparedOptions.legend?.orientation).toBe(theme.config.line.legend.orientation);
            expect(preparedOptions.legend?.spacing).toBe(theme.config.line.legend.spacing);
            expect(preparedOptions.legend?.reverseOrder).toBe(theme.config.line.legend.reverseOrder);
            expect(preparedOptions.legend?.pagination!.marker!.shape).toBe(
                theme.config.line.legend.pagination.marker.shape
            );
            expect(preparedOptions.legend?.item!.label!.maxLength).toBe(theme.config.line.legend.item.label.maxLength);
        });
    });
});
