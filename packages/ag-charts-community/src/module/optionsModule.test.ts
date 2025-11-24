import { describe, jest } from '@jest/globals';

import { Logger, ModuleRegistry } from 'ag-charts-core';
import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgChartOptions,
    AgChartTheme,
    AgLineSeriesOptions,
    AgNumberAxisOptions,
    SeriesType,
} from 'ag-charts-types';

import { sanitizeThemeModules } from '../chart/factory/processModuleOptions';
import * as examples from '../chart/test/examples';
import { ChartTheme } from '../chart/themes/chartTheme';
import { VERSION } from '../version';
import { ChartOptions } from './optionsModule';

function prepareOptions<T extends AgChartOptions>(userOptions: T): T {
    const chartOptions = new ChartOptions(userOptions, {} as T, {}, {}, {});
    return chartOptions.processedOptions;
}

function getSeriesOptions(seriesType: string, mapper?: <T>(series: T) => T) {
    const seriesOptions = seriesOptionsMap[seriesType];
    return mapper ? seriesOptions.map(mapper) : seriesOptions;
}

function setSeriesType(
    type: 'bar' | 'line' | 'area',
    series: Omit<AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions, 'type'>
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

const colSeriesIPhone = setSeriesType('bar', baseSeriesIPhone);
const colSeriesMac = setSeriesType('bar', baseSeriesMac);
const colSeriesWearables = setSeriesType('bar', baseSeriesWearables);
const colSeriesServices = setSeriesType('bar', baseSeriesServices);
const lineSeriesIPhone = setSeriesType('line', baseSeriesIPhone);
const lineSeriesMac = setSeriesType('line', baseSeriesMac);
const areaSeriesIPhone = setSeriesType('area', baseSeriesIPhone);
const areaSeriesMac = setSeriesType('area', baseSeriesMac);
const areaSeriesWearables = setSeriesType('area', baseSeriesWearables);
const areaSeriesServices = setSeriesType('area', baseSeriesServices);

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
    axes: {
        x: { type: 'time', position: 'bottom' },
        xSecondary: { type: 'time', position: 'bottom', title: { text: 'Time' } },
        y: { type: 'number', position: 'left', title: { text: 'Velocity' } },
        ySecondary: { type: 'number', position: 'right', title: { text: 'G', enabled: true } },
    },
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
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            interval: {
                maxSpacing: 26,
            },
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
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Custom Left Axis Title',
            },
            label: {
                autoRotate: true,
            },
        },
    },
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
    },
    initialState: {
        zoom: {
            ratioX: {
                start: 0.5,
                end: 0.8,
            },
        },
    },
};

const INTRINSIC_ENABLE_CROSSLINE_OPTIONS: AgCartesianChartOptions = {
    ...examples.SIMPLE_LINE_CHART_EXAMPLE,
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            crossLines: [
                {
                    type: 'range',
                    label: {
                        text: 'Custom Crossline Label',
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
        },
    },
};

describe('ChartOptions', () => {
    beforeEach(() => {
        console.warn = jest.fn();
        Logger.reset();
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
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 0,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#2b5c95",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
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
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 1,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#cc6f10",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "direction": "vertical",
    "fill": "#459d55",
    "fillOpacity": 1,
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 2,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#1e652e",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "wearables",
    "yName": "Wearables",
  },
  {
    "direction": "vertical",
    "fill": "#34bfe1",
    "fillOpacity": 1,
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 3,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#18859e",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "services",
    "yName": "Services",
  },
  {
    "highlight": {
      "enabled": true,
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "interpolation": {
      "type": "linear",
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "#181d1f",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#e1cc00",
      "shape": "circle",
      "size": 7,
      "stroke": "#a69400",
      "strokeWidth": 0,
    },
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "stroke": "#e1cc00",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "anchorTo": "node",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "nearest",
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "highlight": {
      "enabled": true,
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "interpolation": {
      "type": "linear",
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "#181d1f",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#9669cb",
      "shape": "circle",
      "size": 7,
      "stroke": "#603c88",
      "strokeWidth": 0,
    },
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "stroke": "#9669cb",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "anchorTo": "node",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "nearest",
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
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 0,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#2b5c95",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
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
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 1,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#cc6f10",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "direction": "vertical",
    "fill": "#459d55",
    "fillOpacity": 1,
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 2,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#1e652e",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "wearables",
    "yName": "Wearables",
  },
  {
    "direction": "vertical",
    "fill": "#34bfe1",
    "fillOpacity": 1,
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 4,
      "groupId": "bar-quarter-grouped",
      "groupIndex": 3,
      "stackCount": 0,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#18859e",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "services",
    "yName": "Services",
  },
  {
    "highlight": {
      "enabled": true,
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "interpolation": {
      "type": "linear",
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "#181d1f",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#e1cc00",
      "shape": "circle",
      "size": 7,
      "stroke": "#a69400",
      "strokeWidth": 0,
    },
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "stroke": "#e1cc00",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "anchorTo": "node",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "nearest",
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "highlight": {
      "enabled": true,
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "interpolation": {
      "type": "linear",
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "#181d1f",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#9669cb",
      "shape": "circle",
      "size": 7,
      "stroke": "#603c88",
      "strokeWidth": 0,
    },
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "stroke": "#9669cb",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "anchorTo": "node",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "nearest",
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
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 1,
      "groupId": "bar-quarter-stacked",
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 0,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#2b5c95",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
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
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 1,
      "groupId": "bar-quarter-stacked",
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 1,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#cc6f10",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "direction": "vertical",
    "fill": "#459d55",
    "fillOpacity": 1,
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 1,
      "groupId": "bar-quarter-stacked",
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 2,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": true,
    "stroke": "#1e652e",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "wearables",
    "yName": "Wearables",
  },
  {
    "direction": "vertical",
    "fill": "#34bfe1",
    "fillOpacity": 1,
    "highlight": {
      "enabled": true,
      "unhighlightedItem": {
        "opacity": 0.6,
      },
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "white",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
      "placement": "inside-center",
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "seriesGrouping": {
      "groupCount": 1,
      "groupId": "bar-quarter-stacked",
      "groupIndex": 0,
      "stackCount": 4,
      "stackIndex": 3,
    },
    "shadow": {
      "blur": 5,
      "color": "#00000080",
      "enabled": false,
      "xOffset": 3,
      "yOffset": 3,
    },
    "showInLegend": false,
    "stroke": "#18859e",
    "strokeWidth": 0,
    "tooltip": {
      "position": {
        "anchorTo": "pointer",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "exact",
    },
    "type": "bar",
    "visible": true,
    "xKey": "quarter",
    "yKey": "services",
    "yName": "Services",
  },
  {
    "highlight": {
      "enabled": true,
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "interpolation": {
      "type": "linear",
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "#181d1f",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#e1cc00",
      "shape": "circle",
      "size": 7,
      "stroke": "#a69400",
      "strokeWidth": 0,
    },
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "stroke": "#e1cc00",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "anchorTo": "node",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "nearest",
    },
    "type": "line",
    "visible": true,
    "xKey": "quarter",
    "yKey": "mac",
    "yName": "Mac",
  },
  {
    "highlight": {
      "enabled": true,
      "unhighlightedSeries": {
        "opacity": 0.2,
      },
    },
    "interpolation": {
      "type": "linear",
    },
    "label": {
      "border": {
        "enabled": false,
        "stroke": "rgba(24, 29, 31, 0.08)",
        "strokeWidth": 1,
      },
      "color": "#181d1f",
      "cornerRadius": 4,
      "enabled": false,
      "fontFamily": "Verdana, sans-serif",
      "fontSize": 12,
      "fontWeight": 400,
      "padding": 8,
    },
    "lineDash": [
      0,
    ],
    "lineDashOffset": 0,
    "marker": {
      "fill": "#9669cb",
      "shape": "circle",
      "size": 7,
      "stroke": "#603c88",
      "strokeWidth": 0,
    },
    "segmentation": {
      "enabled": false,
      "key": "x",
    },
    "stroke": "#9669cb",
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "tooltip": {
      "position": {
        "anchorTo": "node",
        "xOffset": 0,
        "yOffset": 0,
      },
      "range": "nearest",
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
                ModuleRegistry.register({
                    type: 'series',
                    name: seriesType,
                    chartType: 'cartesian',
                    version: VERSION,
                    stackable,
                    groupable,
                    stackedByDefault,
                } as any);
            }

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
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
                            if (groupable) {
                                expect(series.seriesGrouping).toMatchSnapshot({
                                    groupIndex: expect.any(Number),
                                    groupCount: expect.any(Number),
                                    stackIndex: expect.any(Number),
                                    stackCount: expect.any(Number),
                                });
                            } else {
                                expect(series.seriesGrouping).toBe(undefined);
                            }
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
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
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted stacked property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
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
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
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
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable, stackable, stackedByDefault } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                        }

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
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
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
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (!stackable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                        }
                        if (!groupable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
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
                    }
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
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(series.seriesGrouping).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                        }
                    }
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

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
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
                    }
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
                    const { groupable, stackable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        }

                        if (stackable && groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            if (!stackable) {
                                expect(console.warn).toHaveBeenCalledWith(
                                    `AG Charts - unsupported stacking of series type "${seriesType}".`
                                );
                            }
                            if (!groupable) {
                                expect(console.warn).toHaveBeenCalledWith(
                                    expect.stringMatching(
                                        /AG Charts - Unknown option `series\[\d+].grouped`, ignoring./
                                    )
                                );
                            }
                        }
                    }
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

                    for (const series of options.series) {
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
                    }
                }
            );
        });
    });

    describe('#prepareOptions', () => {
        it.each(Object.entries(EXAMPLES))('for %s it should prepare options as expected', (_exampleName, example) => {
            const options: AgChartOptions = example.options;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            if (options.data) {
                expect(preparedOptions).toHaveProperty('data', options.data);
                expect(preparedOptions).toMatchSnapshot({
                    container: expect.any(HTMLElement),
                    data: expect.any(Array.isArray(options.data) ? Array : Object),
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
        });

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

            expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(4);
            expect(preparedOptions.axes).toMatchObject({
                x: { type: 'time', title: { enabled: false } },
                y: { type: 'number', title: { enabled: false } },
                __AXIS_ID_2: { type: 'time', title: { enabled: true } },
                __AXIS_ID_3: { type: 'number', title: { enabled: true } },
            });
            expect(preparedOptions.series?.length).toEqual(4);
            expect(preparedOptions.series?.map((s) => s.type)).toEqual(['line', 'bar', 'area', 'area']);
            expect(preparedOptions.series?.map((s) => 'label' in s && s.label?.enabled)).toEqual([
                true,
                false,
                false,
                true,
            ]);
        });

        it('should drop unregistered theme overrides before processing', () => {
            const warnSpy = jest.spyOn(console, 'warn');
            const theme: AgChartTheme = {
                overrides: {
                    common: {
                        annotations: { enabled: true } as any,
                        navigator: { enabled: true } as any,
                        axes: {
                            // @ts-expect-error Testing unregistered axis plugins
                            'angle-number': { crosshair: { enabled: true } },
                        },
                    },
                    'radial-bar': { series: { strokeWidth: 5, errorBar: { visible: true } } } as any,
                },
            };

            const chartOptions = new ChartOptions(
                {
                    data: [{ x: 1, y: 2 }],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    theme,
                },
                {} as AgCartesianChartOptions,
                {},
                {},
                {}
            );

            try {
                expect(chartOptions.activeTheme.overrides?.common?.navigator).toBeUndefined();
                expect(chartOptions.activeTheme.overrides?.common?.annotations).toBeUndefined();
                expect(chartOptions.activeTheme.overrides?.common?.axes?.['angle-number']).toBeUndefined();
                expect((chartOptions.activeTheme.overrides as any)?.['radial-bar']).toBeUndefined();
                expect(warnSpy).toHaveBeenCalledTimes(2);
                expect(warnSpy.mock.calls[0]?.[0]).toContain('theme.overrides.common.axes.angle-number.crosshair');
                expect(warnSpy.mock.calls[1]?.[0]).toContain('theme.overrides.radial-bar.series.errorBar');
            } finally {
                warnSpy.mockRestore();
            }
        });

        it('sanitizes theme defaults when modules are missing', () => {
            const baseTheme = new ChartTheme();
            const themeWithExtras = Object.create(baseTheme, {
                config: {
                    value: { ...baseTheme.config, 'radial-bar': { series: { strokeWidth: 2 } } },
                    enumerable: true,
                },
                overrides: {
                    value: {
                        ...(baseTheme.overrides ?? {}),
                        common: { ...(baseTheme.overrides?.common ?? {}), navigator: { enabled: true } },
                        'radial-bar': { series: { strokeWidth: 5 } },
                        line: { series: { errorBar: { enabled: true } } },
                    },
                    enumerable: true,
                },
                presets: {
                    value: { ...(baseTheme.presets ?? {}), 'linear-gauge': { enabled: true } },
                    enumerable: true,
                },
            }) as ChartTheme;

            const sanitizedTheme = sanitizeThemeModules(themeWithExtras);

            expect(sanitizedTheme.config['radial-bar']).toBeUndefined();
            expect((sanitizedTheme.overrides as any)?.['radial-bar']).toBeUndefined();
            expect((sanitizedTheme.overrides as any)?.common?.navigator).toBeUndefined();
            expect((sanitizedTheme.overrides as any)?.line?.series?.errorBar).toBeUndefined();
            expect((sanitizedTheme.presets as any)?.['linear-gauge']).toBeUndefined();
        });

        it('should use default theme options when `enabled` is set to `false` on an options object', () => {
            const options = ENABLED_FALSE_OPTIONS;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);
            const theme = new ChartTheme();

            expect(preparedOptions.title?.enabled).toBe(false);
            expect(preparedOptions.title?.text).toBe(theme.config.line.title.text);
            expect(preparedOptions.title?.fontSize).toBe(17);
            expect(preparedOptions.title?.spacing).toBe(20);

            expect(preparedOptions.subtitle?.enabled).toBe(false);
            expect(preparedOptions.subtitle?.text).toBe(theme.config.line.subtitle.text);
            expect(preparedOptions.subtitle?.fontSize).toBe(13);
            expect(preparedOptions.subtitle?.spacing).toBe(theme.config.line.subtitle.spacing);

            expect(preparedOptions.footnote?.enabled).toBe(false);
            expect(preparedOptions.footnote?.text).toBe(theme.config.line.footnote.text);
            expect(preparedOptions.footnote?.fontSize).toBe(13);
            expect(preparedOptions.footnote?.spacing).toBe(theme.config.line.footnote.spacing);

            const numberAxis = preparedOptions.axes?.x as AgNumberAxisOptions;
            expect(numberAxis?.tick?.enabled).toBe(false);
            expect(numberAxis?.tick?.width).toBe(theme.config.line.axes.time.tick.width);
            expect(numberAxis?.tick?.size).toBe(theme.config.line.axes.time.tick.size);

            expect(numberAxis?.title?.enabled).toBe(false);
            expect(numberAxis?.title?.text).toBe(theme.config.line.axes.time.title.text);

            expect(numberAxis?.label?.enabled).toBe(false);
            expect(numberAxis?.label?.avoidCollisions).toBe(theme.config.line.axes.time.label.avoidCollisions);
            expect(numberAxis?.label?.autoRotate).toBe(theme.config.line.axes.time.label.autoRotate);
            expect(numberAxis?.label?.minSpacing).toBe(theme.config.line.axes.time.label.minSpacing);

            expect(preparedOptions.axes!.y?.title?.enabled).toBe(true);
            expect(preparedOptions.axes!.y?.title?.text).toBe('Custom Left Axis Title');

            const series0 = preparedOptions.series?.[0] as AgLineSeriesOptions | undefined;
            expect(series0?.marker?.enabled).toBe(false);
            expect(series0?.marker?.strokeWidth).toBe(0);
            expect(series0?.label?.enabled).toBe(false);
            expect(series0?.label?.color).toBe('#181d1f');

            expect(series0?.tooltip?.enabled).toBe(false);
            expect(series0?.tooltip?.renderer).toBe(theme.config.line.series.tooltip.renderer);

            expect(preparedOptions.tooltip?.enabled).toBe(false);
            expect(preparedOptions.tooltip?.range).toBe(theme.config.line.tooltip.range);

            // Disabled modules now keep their options object.
            expect(preparedOptions.legend).not.toBeUndefined();
        });

        it('should intrinsically enable nested crossline options', () => {
            const options = INTRINSIC_ENABLE_CROSSLINE_OPTIONS;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            const numberAxis = preparedOptions.axes?.x as AgNumberAxisOptions;
            expect(numberAxis.crossLines?.[0].enabled).toBe(true);
            expect(numberAxis.crossLines?.[0].label?.enabled).toBe(undefined);
        });

        describe('axes', () => {
            it('should persist valid axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                        myAxis: { type: 'number', position: 'right' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes to the primary axis ids', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myAxis0: { type: 'category', position: 'bottom' },
                        myAxis1: { type: 'number', position: 'top' },
                        myAxis2: { type: 'number', position: 'left' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'top' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes to the primary axis ids when given incorrect directional ids', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        y: { type: 'category', position: 'bottom' },
                        x: { type: 'number', position: 'left' },
                        myAxis: { type: 'number', position: 'right' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should append an axis when only referenced by a series axis key', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myAxis', yKeyAxis: 'y' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'category', position: 'bottom' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: '__AXIS_ID_2',
                    yKeyAxis: 'y',
                });
            });

            it('should append a primary axis when only one series references a secondary axis', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        myAxis: { type: 'number' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number' }, // myAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // myAxis
                });
            });

            it('should append a primary axis when only one series references an undefined secondary axis', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        y: { type: 'number' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number' },
                    __AXIS_ID_2: { type: 'number' }, // myAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // myAxis
                });
            });

            it('should append a secondary axis when all series reference axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myOtherAxis' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        myAxis: { type: 'number' },
                        x: { type: 'category', position: 'bottom' },
                        myOtherAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number' },
                    __AXIS_ID_2: { type: 'number' }, // myOtherAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // myOtherAxis
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y', // myAxis
                });
            });

            it('should provide default axes where a direction is missing', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        myAxis: { type: 'number', position: 'top' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    y: { type: 'number', position: 'left' },
                    x: { type: 'category', position: 'bottom' },
                    __AXIS_ID_1: { type: 'number', position: 'top' }, // myAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should persist axes when no position is provided and keys are standard', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        y: { type: 'number' },
                        x: { type: 'time' },
                        myAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'time' }, // matched by key
                    y: { type: 'number' }, // matched by key
                    __AXIS_ID_2: { type: 'number' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes when no position is provided and keys are non-standard', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myAxis0: { type: 'time' },
                        myAxis1: { type: 'number' },
                        myAxis2: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'time' }, // matched by index, myAxis0
                    y: { type: 'number' }, // matched by index, myAxis1
                    __AXIS_ID_2: { type: 'number' }, // myAxis2
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes when a mixture of position and no position', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'category' },
                        y: { type: 'number', position: 'left' },
                        myAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category' },
                    y: { type: 'number' },
                    __AXIS_ID_2: { type: 'number' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            // TODO: predict the axes based on their types?
            it.failing(
                'should remap axes when no position is provided and keys are non-standard and axes are in wrong order',
                () => {
                    const options: AgCartesianChartOptions = {
                        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                        axes: {
                            myAxis0: { type: 'number' },
                            myAxis1: { type: 'time' },
                        },
                    };

                    const preparedOptions = prepareOptions(options);

                    expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                    expect(preparedOptions.axes).toMatchObject({
                        x: { type: 'time' },
                        y: { type: 'number' },
                    });
                    expect(preparedOptions.series?.[0]).toMatchObject({
                        xKeyAxis: 'x',
                        yKeyAxis: 'y',
                    });
                }
            );

            it('should only create default axes when series have axis keys but no axes are provided', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myXAxis', yKeyAxis: 'myYAxis' }],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should create new axes when series have axis keys that do not match provided axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myXAxis', yKeyAxis: 'myYAxis' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    __AXIS_ID_2: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: '__AXIS_ID_2', // user's myXAxis
                    yKeyAxis: 'y', // user's myYAxis, since no axes.y provided
                });
            });

            it('should remap and create default axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        y: { type: 'category', position: 'bottom' },
                        myAxis: { type: 'number', position: 'top' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_1: { type: 'number', position: 'top' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });
        });
    });
});
