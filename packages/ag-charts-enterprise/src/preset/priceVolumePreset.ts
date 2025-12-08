import { _ModuleSupport, _Theme } from 'ag-charts-community';
import { Logger, mergeDefaults } from 'ag-charts-core';
import type {
    AgAnnotationsOptions,
    AgAnnotationsToolbarButton,
    AgBarSeriesOptions,
    AgBaseFinancialPresetOptions,
    AgCandlestickSeriesOptions,
    AgCartesianChartOptions,
    AgChartSyncOptions,
    AgLineSeriesOptions,
    AgNavigatorOptions,
    AgNumberAxisOptions,
    AgOhlcSeriesOptions,
    AgPriceVolumePreset,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgRangesOptions,
    AgZoomOptions,
    DatumDefault,
} from 'ag-charts-types';

import { annotationsTheme } from './priceVolumePresetTheme';

type ChartTheme = _Theme.ChartTheme;
const { SAFE_STROKE_FILL_OPERATION } = _ModuleSupport;

const chartTypes = ['ohlc', 'line', 'step-line', 'hlc', 'high-low', 'candlestick', 'hollow-candlestick'];

const toolbarButtons: AgAnnotationsToolbarButton[] = [
    {
        icon: 'trend-line-drawing',
        tooltip: 'toolbarAnnotationsLineAnnotations',
        value: 'line-menu',
    },
    {
        icon: 'fibonacci-retracement-drawing',
        tooltip: 'toolbarAnnotationsFibonacciAnnotations',
        value: 'fibonacci-menu',
    },
    {
        icon: 'text-annotation',
        tooltip: 'toolbarAnnotationsTextAnnotations',
        value: 'text-menu',
    },
    {
        icon: 'arrow-drawing',
        tooltip: 'toolbarAnnotationsShapeAnnotations',
        value: 'shape-menu',
    },
    {
        icon: 'measurer-drawing',
        tooltip: 'toolbarAnnotationsMeasurerAnnotations',
        value: 'measurer-menu',
    },
    {
        icon: 'delete',
        tooltip: 'toolbarAnnotationsClearAll',
        value: 'clear',
    },
];

export function priceVolume(
    opts: AgPriceVolumePreset & AgBaseFinancialPresetOptions,
    _presetTheme: any,
    getTheme: () => ChartTheme
): AgCartesianChartOptions<DatumDefault, never> {
    const {
        dateKey = 'date',
        highKey = 'high',
        openKey = 'open',
        lowKey = 'low',
        closeKey = 'close',
        volumeKey = 'volume',
        chartType = 'candlestick',
        navigator = false,
        volume = true,
        rangeButtons = true,
        statusBar = true,
        toolbar = true,
        zoom = true,
        sync = false,
        theme,
        data,
        formatter,
        ...unusedOpts
    } = opts;

    const priceSeries = createPriceSeries(chartType, dateKey, highKey, lowKey, openKey, closeKey);
    const volumeSeries = createVolumeSeries(getTheme, dateKey, openKey, closeKey, volume, volumeKey);

    const miniChart = volume
        ? {
              miniChart: {
                  enabled: navigator,
                  series: [
                      {
                          type: 'line' as const,
                          xKey: dateKey,
                          yKey: volumeKey,
                          stroke: SAFE_STROKE_FILL_OPERATION,
                          marker: { enabled: false },
                      },
                  ],
              },
              height: 40,
              minHandle: {
                  height: 46,
              },
              maxHandle: {
                  height: 46,
              },
          }
        : null;
    const navigatorOpts = {
        navigator: {
            enabled: navigator,
            ...miniChart,
        } satisfies AgNavigatorOptions,
    };

    const annotationOpts = {
        annotations: {
            enabled: toolbar,
            optionsToolbar: {
                enabled: toolbar,
            },
            // @ts-expect-error undocumented option
            snap: true,
            toolbar: {
                enabled: toolbar,
                buttons: toolbarButtons,
                padding: 0,
            },
            data,
            xKey: dateKey,
            volumeKey: volume ? volumeKey : undefined,
        } satisfies AgAnnotationsOptions,
    };

    const statusBarOpts = statusBar
        ? {
              statusBar: {
                  enabled: true,
                  highKey,
                  openKey,
                  lowKey,
                  closeKey,
                  volumeKey: volume ? volumeKey : undefined,
              },
          }
        : null;

    const zoomOpts = {
        zoom: {
            enabled: zoom,
            autoScaling: {
                enabled: true,
            },
            onDataChange: {
                stickToEnd: true,
            },
            // @ts-expect-error undocumented option
            enableIndependentAxes: true,
        } satisfies AgZoomOptions,
    };

    const toolbarOpts = {
        ranges: {
            enabled: rangeButtons,
        } satisfies AgRangesOptions,
    };

    const syncGroup = sync
        ? {
              sync: {
                  enabled: sync,
                  nodeInteraction: true,
                  zoom: true,
              } satisfies AgChartSyncOptions,
          }
        : null;

    const volumeAxis = volume
        ? {
              yVolume: {
                  type: 'number',
                  position: 'left',
                  label: { enabled: false },
                  crosshair: { enabled: false },
                  gridLine: { enabled: false },
                  nice: false,
                  // @ts-expect-error undocumented option
                  layoutConstraints: {
                      stacked: false,
                      width: 20,
                      unit: 'percent',
                      align: 'end',
                  },
              } satisfies AgNumberAxisOptions,
          }
        : {};

    return {
        theme: {
            baseTheme: typeof theme === 'string' ? theme : 'ag-financial',
            ...mergeDefaults(typeof theme === 'object' ? theme : null, {
                overrides: {
                    common: {
                        title: { padding: 4 },
                        padding: {
                            top: 6,
                            right: 8,
                            bottom: 6,
                        },
                        chartToolbar: {
                            enabled: toolbar,
                        },
                        annotations: { ...annotationsTheme },
                        axes: {
                            number: {
                                interval: { maxSpacing: 45 },
                                label: { format: '.2f' },
                            },
                            category: {
                                gridLine: { enabled: true },
                            },
                            time: {
                                gridLine: { enabled: true },
                            },
                            'unit-time': {
                                gridLine: { enabled: true },
                            },
                            'ordinal-time': {
                                gridLine: { enabled: true },
                            },
                        },
                    },
                    bar: {
                        series: {
                            fillOpacity: 0.5,
                            highlight: { unhighlightedItem: { opacity: 1 }, unhighlightedSeries: { opacity: 1 } },
                        },
                    },
                    line: {
                        series: {
                            marker: { enabled: false },
                            highlight: { unhighlightedSeries: { opacity: 1 } },
                            ...inlineSwitch(chartType, {
                                hlc: {
                                    stroke: { $palette: 'altNeutral.stroke' },
                                    strokeWidth: 2,
                                },
                                line: {
                                    stroke: { $palette: 'neutral.stroke' },
                                },
                                'step-line': {
                                    stroke: { $palette: 'neutral.stroke' },
                                    interpolation: { type: 'step' },
                                },
                            }),
                        },
                    },
                    candlestick: {
                        series: {
                            highlight: { unhighlightedItem: { opacity: 1 }, unhighlightedSeries: { opacity: 1 } },
                            ...inlineSwitch(chartType, {
                                'hollow-candlestick': {
                                    item: {
                                        up: { fill: 'transparent' },
                                    },
                                },
                            }),
                        },
                    },
                    ohlc: {
                        series: {
                            highlight: { unhighlightedItem: { opacity: 1 }, unhighlightedSeries: { opacity: 1 } },
                        },
                    },
                    'range-area': {
                        series: {
                            fillOpacity: 0.3,
                            strokeWidth: 2,
                            highlight: {
                                bringToFront: false,
                                unhighlightedItem: { opacity: 1 },
                                unhighlightedSeries: { opacity: 1 },
                            },
                            ...inlineSwitch(chartType, {
                                hlc: {
                                    fill: {
                                        $if: [
                                            { $eq: [{ $value: '$index' }, 1] },
                                            { $palette: 'up.fill' },
                                            { $palette: 'down.fill' },
                                        ],
                                    },
                                    stroke: {
                                        $if: [
                                            { $eq: [{ $value: '$index' }, 1] },
                                            { $palette: 'up.stroke' },
                                            { $palette: 'down.stroke' },
                                        ],
                                    },
                                },
                            }),
                        },
                    },
                    'range-bar': {
                        series: {
                            highlight: {
                                unhighlightedItem: { opacity: 1 },
                                unhighlightedSeries: { opacity: 1 },
                            },
                            ...inlineSwitch(chartType, {
                                'high-low': {
                                    fill: { $palette: 'neutral.fill' },
                                    stroke: { $palette: 'neutral.stroke' },
                                },
                            }),
                        },
                    },
                },
            }),
        },
        animation: { enabled: false },
        legend: { enabled: false },
        series: [...volumeSeries, ...priceSeries],
        axes: {
            y: {
                type: 'number',
                position: 'right',
                crosshair: {
                    enabled: true,
                    snap: false,
                },
                // @ts-expect-error undocumented option
                layoutConstraints: {
                    stacked: false,
                    width: 100,
                    unit: 'percent',
                    align: 'start',
                },
            },
            ...volumeAxis,
            x: {
                type: 'ordinal-time',
                position: 'bottom',
                line: {
                    enabled: false,
                },
                label: {
                    enabled: true,
                },
                crosshair: {
                    enabled: true,
                },
            },
        },
        tooltip: { enabled: false },
        data,
        formatter,
        ...annotationOpts,
        ...navigatorOpts,
        ...statusBarOpts,
        ...zoomOpts,
        ...toolbarOpts,
        ...syncGroup,
        ...unusedOpts,
    } satisfies AgCartesianChartOptions<DatumDefault, never>;
}

function createVolumeSeries(
    getTheme: () => ChartTheme,
    xKey: string,
    openKey: string,
    closeKey: string,
    volume: boolean,
    volumeKey: string
) {
    if (!volume) return [];

    return [
        {
            type: 'bar',
            xKey: xKey,
            yKey: volumeKey,
            yKeyAxis: 'yVolume',
            tooltip: { enabled: false },
            // @ts-expect-error undocumented options: simpleItemStyler, focusPriority
            simpleItemStyler(datum: any) {
                const { up, down } = getTheme().palette;
                return { fill: datum[openKey] < datum[closeKey] ? up?.fill : down?.fill };
            },
            focusPriority: 1,
            highlight: { unhighlightedSeries: { opacity: 1 } },
        } satisfies AgBarSeriesOptions,
    ];
}

const RANGE_AREA_TYPE = 'range-area';

interface PriceSeriesCommon {
    pickOutsideVisibleMinorAxis: boolean;
}

interface PriceSeriesKeys {
    xKey: string;
    openKey: string;
    closeKey: string;
    highKey: string;
    lowKey: string;
}

interface PriceSeriesSingleKeys {
    xKey: string;
    yKey: string;
}

function createPriceSeries(
    chartType: AgPriceVolumePreset['chartType'],
    xKey: string,
    highKey: string,
    lowKey: string,
    openKey: string,
    closeKey: string
) {
    const keys: PriceSeriesKeys = {
        xKey,
        openKey,
        closeKey,
        highKey,
        lowKey,
    };
    const singleKeys: PriceSeriesSingleKeys = {
        xKey,
        yKey: closeKey,
    };
    const common: PriceSeriesCommon = {
        pickOutsideVisibleMinorAxis: true,
    };

    switch (chartType ?? 'candlestick') {
        case 'ohlc':
            return createPriceSeriesOHLC(common, keys);
        case 'line':
        case 'step-line':
            return createPriceSeriesLine(common, singleKeys);
        case 'hlc':
            return createPriceSeriesHLC(common, singleKeys, keys);
        case 'high-low':
            return createPriceSeriesHighLow(common, keys);
        case 'candlestick':
        case 'hollow-candlestick':
            return createPriceSeriesCandlestick(common, keys);
        default:
            Logger.warnOnce(`unknown chart type: ${chartType}; expected one of: ${chartTypes.join(', ')}`);
            return createPriceSeriesCandlestick(common, keys);
    }
}

function createPriceSeriesOHLC(common: PriceSeriesCommon, keys: PriceSeriesKeys) {
    return [
        {
            type: 'ohlc',
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            ...keys,
        } satisfies AgOhlcSeriesOptions,
    ];
}

function createPriceSeriesLine(common: PriceSeriesCommon, singleKeys: PriceSeriesSingleKeys) {
    return [
        {
            type: 'line',
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            ...singleKeys,
        } satisfies AgLineSeriesOptions,
    ];
}

function createPriceSeriesHLC(
    common: PriceSeriesCommon,
    singleKeys: PriceSeriesSingleKeys,
    { xKey, highKey, closeKey, lowKey }: PriceSeriesKeys
) {
    return [
        {
            type: RANGE_AREA_TYPE,
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            xKey,
            yHighKey: highKey,
            yLowKey: closeKey,
        } satisfies AgRangeAreaSeriesOptions,
        {
            type: RANGE_AREA_TYPE,
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            xKey,
            yHighKey: closeKey,
            yLowKey: lowKey,
        } satisfies AgRangeAreaSeriesOptions,
        {
            type: 'line',
            ...common,
            ...singleKeys,
        } satisfies AgLineSeriesOptions,
    ];
}

function createPriceSeriesHighLow(common: PriceSeriesCommon, { xKey, highKey, lowKey }: PriceSeriesKeys) {
    return [
        {
            type: 'range-bar',
            ...common,
            xKey,
            yHighKey: highKey,
            yLowKey: lowKey,
            tooltip: { range: 'nearest' },
            // @ts-expect-error undocumented option
            focusPriority: 0,
        } satisfies AgRangeBarSeriesOptions,
    ];
}

function createPriceSeriesCandlestick(common: PriceSeriesCommon, keys: PriceSeriesKeys) {
    return [
        {
            type: 'candlestick',
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            ...keys,
        } satisfies AgCandlestickSeriesOptions,
    ];
}

export function inlineSwitch<T extends string>(
    caseName: T,
    switchCases: { [K in T]?: object } & { default?: object }
): object | undefined {
    return switchCases[caseName] ?? switchCases.default;
}
