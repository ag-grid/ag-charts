import { Logger } from 'ag-charts-core';
import type {
    AgAnnotationsOptions,
    AgAnnotationsToolbarButton,
    AgBarSeriesItemStylerParams,
    AgBarSeriesOptions,
    AgBaseFinancialPresetOptions,
    AgCandlestickSeriesOptions,
    AgCartesianChartOptions,
    AgLineSeriesOptions,
    AgNavigatorOptions,
    AgNumberAxisOptions,
    AgOhlcSeriesOptions,
    AgPriceVolumePreset,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgRangesOptions,
    AgZoomOptions,
} from 'ag-charts-types';

import type { ChartTheme } from '../../chart/themes/chartTheme';
import {
    PALETTE_DOWN_FILL,
    PALETTE_DOWN_STROKE,
    PALETTE_NEUTRAL_FILL,
    PALETTE_NEUTRAL_STROKE,
    PALETTE_UP_FILL,
    PALETTE_UP_STROKE,
} from '../../chart/themes/symbols';
import { SAFE_STROKE_FILL_OPERATION } from '../../chart/themes/util';
import { mergeDefaults } from '../../util/object';
import { annotationsTheme } from './priceVolumePresetTheme';

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
): AgCartesianChartOptions {
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
        theme,
        data,
        ...unusedOpts
    } = opts;

    const priceSeries = createPriceSeries(chartType, dateKey, highKey, lowKey, openKey, closeKey);
    const volumeSeries = createVolumeSeries(getTheme, openKey, closeKey, volume, volumeKey);

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
                  data,
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
            // @ts-expect-error undocumented option
            enableIndependentAxes: true,
        } satisfies AgZoomOptions,
    };

    const toolbarOpts = {
        ranges: {
            enabled: rangeButtons,
        } satisfies AgRangesOptions,
    };

    const volumeAxis = volume
        ? [
              {
                  type: 'number',
                  position: 'left',
                  keys: [volumeKey],
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
          ]
        : [];

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
                            bottom: 5,
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
                        },
                    },
                    bar: {
                        series: {
                            fillOpacity: 0.5,
                        },
                    },
                    line: {
                        series: {
                            marker: { enabled: false },
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
                            ...inlineSwitch(chartType, {
                                'hollow-candlestick': {
                                    item: {
                                        up: { fill: 'transparent' },
                                    },
                                },
                            }),
                        },
                    },
                    'range-area': {
                        series: {
                            fillOpacity: 0.3,
                            strokeWidth: 2,
                        },
                    },
                },
            }),
        },
        animation: { enabled: false },
        legend: { enabled: false },
        series: [...volumeSeries, ...priceSeries],
        axes: [
            {
                type: 'number',
                position: 'right',
                keys: [openKey, closeKey, highKey, lowKey],
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
            {
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
        ],
        tooltip: { enabled: false },
        data,
        ...annotationOpts,
        ...navigatorOpts,
        ...statusBarOpts,
        ...zoomOpts,
        ...toolbarOpts,
        ...unusedOpts,
    } satisfies AgCartesianChartOptions;
}

function createVolumeSeries(
    getTheme: () => ChartTheme,
    openKey: string,
    closeKey: string,
    volume: boolean,
    volumeKey: string
) {
    if (!volume) return [];

    return [
        {
            type: 'bar',
            xKey: 'date',
            yKey: volumeKey,
            tooltip: { enabled: false },
            itemStyler({ datum }: AgBarSeriesItemStylerParams<any>) {
                const { up, down } = getTheme().palette;
                return { fill: datum[openKey] < datum[closeKey] ? up?.fill : down?.fill };
            },
            // @ts-expect-error undocumented option
            focusPriority: 1,
            fastDataProcessing: true,
            highlight: { enabled: false },
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
            fill: PALETTE_UP_FILL,
            stroke: PALETTE_UP_STROKE,
        } satisfies AgRangeAreaSeriesOptions,
        {
            type: RANGE_AREA_TYPE,
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            xKey,
            yHighKey: closeKey,
            yLowKey: lowKey,
            fill: PALETTE_DOWN_FILL,
            stroke: PALETTE_DOWN_STROKE,
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
            fill: PALETTE_NEUTRAL_FILL,
            stroke: PALETTE_NEUTRAL_STROKE,
            tooltip: {
                range: 'nearest',
            },
            // @ts-expect-error undocumented option
            focusPriority: 0,
            fastDataProcessing: true,
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
