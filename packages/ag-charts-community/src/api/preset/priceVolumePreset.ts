import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesOptions,
    AgBaseFinancialPresetOptions,
    AgCandlestickSeriesOptions,
    AgCartesianChartOptions,
    AgChartTheme,
    AgChartThemeName,
    AgLineSeriesOptions,
    AgNavigatorOptions,
    AgNumberAxisOptions,
    AgOhlcSeriesOptions,
    AgPriceVolumePreset,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgToolbarOptions,
    AgZoomOptions,
} from 'ag-charts-types';

import type { ChartTheme } from '../../chart/themes/chartTheme';
import { DEFAULT_STROKES } from '../../chart/themes/defaultColors';
import {
    PALETTE_DOWN_FILL,
    PALETTE_DOWN_STROKE,
    PALETTE_NEUTRAL_FILL,
    PALETTE_NEUTRAL_STROKE,
    PALETTE_UP_FILL,
    PALETTE_UP_STROKE,
} from '../../chart/themes/symbols';
import { Logger } from '../../util/logger';
import { isObject } from '../../util/type-guards';

function fromTheme<T>(
    theme: AgChartTheme | AgChartThemeName | undefined,
    cb: (theme: AgChartTheme) => T
): T | undefined {
    if (isObject(theme)) {
        return cb(theme);
    }
}

const chartTypes = ['ohlc', 'line', 'step-line', 'hlc', 'high-low', 'candlestick', 'hollow-candlestick'];

export function priceVolume(
    opts: AgPriceVolumePreset & AgBaseFinancialPresetOptions,
    getTheme: () => ChartTheme
): AgCartesianChartOptions {
    const {
        xKey = 'date',
        highKey = 'high',
        openKey = 'open',
        lowKey = 'low',
        closeKey = 'close',
        volumeKey = 'volume',
        chartType = 'candlestick',
        navigator = false,
        volume = true,
        rangeToolbar = true,
        statusBar = true,
        annotations = true,
        zoom = true,
        theme,
        data,
        ...unusedOpts
    } = opts;

    const priceSeries = createPriceSeries(theme, chartType, xKey, highKey, lowKey, openKey, closeKey);
    const volumeSeries = createVolumeSeries(theme, getTheme, openKey, closeKey, volume, volumeKey);

    const miniChart = volume
        ? {
              miniChart: {
                  enabled: navigator,
                  series: [
                      {
                          type: 'line' as const,
                          xKey: 'date',
                          yKey: volumeKey,
                          marker: { enabled: false },
                      },
                  ],
              },
          }
        : null;
    const navigatorOpts = {
        navigator: {
            enabled: navigator,
            ...miniChart,
        } satisfies AgNavigatorOptions,
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
            // @ts-expect-error
            enableIndependentAxes: true,
        } satisfies AgZoomOptions,
    };

    const toolbarOpts = {
        chartToolbar: { enabled: true },
        toolbar: {
            seriesType: {
                enabled: true,
            },
            annotationOptions: {
                enabled: annotations,
            },
            annotations: {
                enabled: annotations,
            },
            ranges: {
                enabled: rangeToolbar,
            },
        } satisfies AgToolbarOptions,
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
                  // @ts-expect-error
                  layoutConstraints: {
                      stacked: false,
                      width: 20,
                      unit: 'percentage',
                      align: 'end',
                  },
              } satisfies AgNumberAxisOptions,
          ]
        : [];

    return {
        theme:
            typeof theme === 'string'
                ? theme
                : {
                      baseTheme: 'ag-financial' as AgChartThemeName,
                      ...(theme ?? {}),
                  },
        animation: { enabled: false },
        legend: { enabled: false },
        series: [...volumeSeries, ...priceSeries],
        padding: {
            top: 6,
            right: 8,
        },
        axes: [
            {
                type: 'number',
                position: 'right',
                keys: [openKey, closeKey, highKey, lowKey],
                interval: {
                    maxSpacing: fromTheme(theme, (t) => t.overrides?.common?.axes?.number?.interval?.maxSpacing) ?? 45,
                },
                label: {
                    format: fromTheme(theme, (t) => t.overrides?.common?.axes?.number?.label?.format) ?? '.2f',
                },
                crosshair: {
                    enabled: true,
                    snap: false,
                },
                // @ts-expect-error
                layoutConstraints: {
                    stacked: false,
                    width: 100,
                    unit: 'percentage',
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
        annotations: {
            enabled: annotations,
        },
        tooltip: { enabled: false },
        data,
        // @ts-expect-error
        titlePadding: 4,
        ...navigatorOpts,
        ...statusBarOpts,
        ...zoomOpts,
        ...toolbarOpts,
        ...unusedOpts,
    } satisfies AgCartesianChartOptions;
}

function createVolumeSeries(
    theme: AgChartThemeName | AgChartTheme | undefined,
    getTheme: () => ChartTheme,
    openKey: string,
    closeKey: string,
    volume: boolean,
    volumeKey: string
) {
    if (!volume) return [];

    const barSeriesFill = fromTheme(theme, (t) => t.overrides?.bar?.series?.fill);
    const itemStyler = barSeriesFill
        ? { fill: barSeriesFill }
        : {
              itemStyler({ datum }: AgBarSeriesItemStylerParams<any>) {
                  const { up, down } = getTheme().palette;
                  return { fill: datum[openKey] < datum[closeKey] ? up?.fill : down?.fill };
              },
          };
    return [
        {
            type: 'bar',
            xKey: 'date',
            yKey: volumeKey,
            tooltip: { enabled: false },
            // @ts-expect-error
            highlight: { enabled: false },
            fillOpacity: fromTheme(theme, (t) => t.overrides?.bar?.series?.fillOpacity) ?? 0.5,
            ...itemStyler,
        } satisfies AgBarSeriesOptions,
    ];
}

// eslint-disable-next-line sonarjs/no-duplicate-string
const RANGE_AREA_TYPE = 'range-area';

function createPriceSeries(
    theme: AgChartThemeName | AgChartTheme | undefined,
    chartType: AgPriceVolumePreset['chartType'],
    xKey: string,
    highKey: string,
    lowKey: string,
    openKey: string,
    closeKey: string
) {
    if ((chartType as string) === RANGE_AREA_TYPE) {
        Logger.warnOnce(`type '${chartType}' is deprecated, use 'hlc' chart type instead`);
        chartType = 'hlc';
    }

    const keys = {
        xKey,
        openKey,
        closeKey,
        highKey,
        lowKey,
    };
    const singleKeys = {
        xKey,
        yKey: closeKey,
    };
    const common = {
        pickOutsideVisibleMinorAxis: true,
    };

    switch (chartType ?? 'candlestick') {
        case 'ohlc':
            return [
                {
                    type: 'ohlc',
                    ...common,
                    ...keys,
                } satisfies AgOhlcSeriesOptions,
            ];
        case 'line':
            return [
                {
                    type: 'line',
                    ...common,
                    ...singleKeys,
                    stroke: fromTheme(theme, (t) => t.overrides?.line?.series?.stroke) ?? PALETTE_NEUTRAL_STROKE,
                    marker: fromTheme(theme, (t) => t.overrides?.line?.series?.marker) ?? { enabled: false },
                } satisfies AgLineSeriesOptions,
            ];
        case 'step-line':
            return [
                {
                    type: 'line',
                    ...common,
                    ...singleKeys,
                    stroke: fromTheme(theme, (t) => t.overrides?.line?.series?.stroke) ?? PALETTE_NEUTRAL_STROKE,
                    interpolation: fromTheme(theme, (t) => t.overrides?.line?.series?.interpolation) ?? {
                        type: 'step',
                    },
                    marker: fromTheme(theme, (t) => t.overrides?.line?.series?.marker) ?? { enabled: false },
                } satisfies AgLineSeriesOptions,
            ];

        case 'hlc':
            const rangeAreaColors = getThemeColors(RANGE_AREA_TYPE, theme);

            return [
                {
                    type: RANGE_AREA_TYPE,
                    ...common,
                    xKey,
                    yHighKey: highKey,
                    yLowKey: closeKey,
                    fill: rangeAreaColors.fill ?? PALETTE_UP_FILL,
                    stroke: rangeAreaColors.stroke ?? PALETTE_UP_STROKE,
                } satisfies AgRangeAreaSeriesOptions,
                {
                    type: RANGE_AREA_TYPE,
                    ...common,
                    xKey,
                    yHighKey: closeKey,
                    yLowKey: lowKey,
                    fill: rangeAreaColors.fill ?? PALETTE_DOWN_FILL,
                    stroke: rangeAreaColors.stroke ?? PALETTE_DOWN_STROKE,
                } satisfies AgRangeAreaSeriesOptions,
                {
                    type: 'line',
                    ...common,
                    ...singleKeys,
                    stroke: fromTheme(theme, (t) => t.overrides?.line?.series?.stroke) ?? DEFAULT_STROKES.GRAY,
                    marker: fromTheme(theme, (t) => t.overrides?.line?.series?.marker) ?? { enabled: false },
                } satisfies AgLineSeriesOptions,
            ];
        case 'high-low':
            const rangeBarColors = getThemeColors('range-bar', theme);

            return [
                {
                    type: 'range-bar',
                    ...common,
                    xKey,
                    yHighKey: highKey,
                    yLowKey: lowKey,
                    fill: rangeBarColors.fill ?? PALETTE_NEUTRAL_FILL,
                    stroke: rangeBarColors.stroke ?? PALETTE_NEUTRAL_STROKE,
                } satisfies AgRangeBarSeriesOptions,
            ];
        case 'candlestick':
            return [
                {
                    type: 'candlestick',
                    ...common,
                    ...keys,
                } satisfies AgCandlestickSeriesOptions,
            ];
        case 'hollow-candlestick':
            const item = fromTheme(theme, (t) => t.overrides?.candlestick?.series?.item);
            return [
                {
                    type: 'candlestick',
                    ...common,
                    ...keys,
                    item: {
                        up: {
                            fill: item?.up?.fill ?? 'transparent',
                        },
                    },
                } satisfies AgCandlestickSeriesOptions,
            ];
        default:
            Logger.warnOnce(`unknown chart type: ${chartType}; expected one of: ${chartTypes.join(', ')}`);
            return [
                {
                    type: 'candlestick',
                    ...common,
                    ...keys,
                } satisfies AgCandlestickSeriesOptions,
            ];
    }
}

function getThemeColors(seriesType: 'range-area' | 'range-bar', theme: AgChartThemeName | AgChartTheme | undefined) {
    const fill = fromTheme(theme, (t) => t.overrides?.[seriesType]?.series?.fill);
    const stroke = fromTheme(theme, (t) => t.overrides?.[seriesType]?.series?.stroke);
    return { fill, stroke };
}
