import type {
    AgAreaSeriesOptions,
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
    AgToolbarOptions,
    AgZoomOptions,
} from 'ag-charts-types';

import type { ChartTheme } from '../../chart/themes/chartTheme';
import { PALETTE_DOWN_STROKE, PALETTE_NEUTRAL_STROKE, PALETTE_UP_STROKE } from '../../chart/themes/symbols';
import { isObject } from '../../util/type-guards';

function fromTheme<T>(
    theme: AgChartTheme | AgChartThemeName | undefined,
    cb: (theme: AgChartTheme) => T
): T | undefined {
    if (isObject(theme)) {
        return cb(theme);
    }
}

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

    const toolbarOpts =
        annotations || rangeToolbar
            ? {
                  toolbar: {
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
              }
            : null;

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
                      width: 25,
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

    switch (chartType) {
        case 'ohlc':
            return [
                {
                    type: 'ohlc',
                    ...keys,
                } satisfies AgOhlcSeriesOptions,
            ];
        case 'line':
            return [
                {
                    type: 'line',
                    ...singleKeys,
                    stroke: fromTheme(theme, (t) => t.overrides?.line?.series?.stroke) ?? PALETTE_NEUTRAL_STROKE,
                    marker: fromTheme(theme, (t) => t.overrides?.line?.series?.marker) ?? { enabled: false },
                } satisfies AgLineSeriesOptions,
            ];
        case 'step-line':
            return [
                {
                    type: 'line',
                    ...singleKeys,
                    stroke: fromTheme(theme, (t) => t.overrides?.line?.series?.stroke) ?? PALETTE_NEUTRAL_STROKE,
                    interpolation: fromTheme(theme, (t) => t.overrides?.line?.series?.interpolation) ?? {
                        type: 'step',
                    },
                    marker: fromTheme(theme, (t) => t.overrides?.line?.series?.marker) ?? { enabled: false },
                } satisfies AgLineSeriesOptions,
            ];

        case 'area':
            return [
                {
                    type: 'area',
                    ...singleKeys,
                    fill: fromTheme(theme, (t) => t.overrides?.['radar-area']?.series?.fill) ?? PALETTE_NEUTRAL_STROKE,
                    fillOpacity: fromTheme(theme, (t) => t.overrides?.area?.series?.fillOpacity) ?? 0.5,
                    stroke: fromTheme(theme, (t) => t.overrides?.area?.series?.stroke) ?? PALETTE_NEUTRAL_STROKE,
                    strokeWidth: fromTheme(theme, (t) => t.overrides?.area?.series?.strokeWidth) ?? 2,
                } satisfies AgAreaSeriesOptions,
            ];
        case RANGE_AREA_TYPE:
            const fill = fromTheme(theme, (t) => t.overrides?.['range-area']?.series?.fill);
            const stoke = fromTheme(theme, (t) => t.overrides?.['range-area']?.series?.stroke);

            return [
                {
                    type: RANGE_AREA_TYPE,
                    xKey,
                    yHighKey: highKey,
                    yLowKey: closeKey,
                    fill: fill ?? PALETTE_UP_STROKE,
                    stroke: stoke ?? PALETTE_UP_STROKE,
                } satisfies AgRangeAreaSeriesOptions,
                {
                    type: RANGE_AREA_TYPE,
                    xKey,
                    yHighKey: closeKey,
                    yLowKey: lowKey,
                    fill: fill ?? PALETTE_DOWN_STROKE,
                    stroke: stoke ?? PALETTE_DOWN_STROKE,
                } satisfies AgRangeAreaSeriesOptions,
            ];

        default:
        case 'candlestick':
            return [
                {
                    type: 'candlestick',
                    ...keys,
                } satisfies AgCandlestickSeriesOptions,
            ];

        case 'hollow-candlestick':
            const item = fromTheme(theme, (t) => t.overrides?.candlestick?.series?.item);
            return [
                {
                    type: 'candlestick',
                    ...keys,
                    item: {
                        up: {
                            fill: item?.up?.fill ?? 'transparent',
                        },
                    },
                } satisfies AgCandlestickSeriesOptions,
            ];
    }
}
