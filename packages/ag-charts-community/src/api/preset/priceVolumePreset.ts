import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgBaseFinancialPresetOptions,
    AgCandlestickSeriesOptions,
    AgCartesianChartOptions,
    AgChartThemeName,
    AgLineSeriesOptions,
    AgNavigatorOptions,
    AgOhlcSeriesOptions,
    AgPriceVolumePreset,
    AgRangeAreaSeriesOptions,
    AgToolbarOptions,
    AgZoomOptions,
} from 'ag-charts-types';

import type { ChartTheme } from '../../chart/themes/chartTheme';

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

    const priceSeries = createPriceSeries(chartType, xKey, highKey, lowKey, openKey, closeKey);

    const volumeSeries = volume
        ? [
              {
                  type: 'bar',
                  xKey: 'date',
                  yKey: volumeKey,
                  itemStyler: ({ datum }) => {
                      const { up, down } = getTheme().palette;
                      return { fill: datum[openKey] < datum[closeKey] ? up?.fill : down?.fill };
                  },
              } satisfies AgBarSeriesOptions,
          ]
        : [];

    const navigatorOpts = navigator
        ? {
              navigator: {
                  enabled: true,
                  miniChart: {
                      enabled: true,
                      series: [
                          {
                              type: 'line',
                              xKey: 'date',
                              yKey: volumeKey,
                              marker: { enabled: false },
                          },
                      ],
                  },
              } satisfies AgNavigatorOptions,
          }
        : null;

    const statusBarOpts = statusBar
        ? {
              statusBar: {
                  enabled: true,
                  data,
                  highKey,
                  openKey,
                  lowKey,
                  closeKey,
                  volumeKey,
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
                          position: 'bottom',
                      },
                  } satisfies AgToolbarOptions,
              }
            : null;

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
        series: [...priceSeries, ...volumeSeries],
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
                    maxSpacing: 50,
                },
                label: {
                    format: '.2f', // MOVE TO THEME!
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
            },
            {
                type: 'ordinal-time',
                position: 'bottom',
                label: {
                    enabled: true,
                    autoRotate: false,
                },
                crosshair: {
                    enabled: true,
                },
                gridLine: { enabled: true },
            },
        ],
        annotations: {
            enabled: annotations,
        },
        tooltip: { enabled: false },
        data,
        ...navigatorOpts,
        ...statusBarOpts,
        ...zoomOpts,
        ...toolbarOpts,
        ...unusedOpts,
    };
}

function createPriceSeries(
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
                } satisfies AgLineSeriesOptions,
            ];
        case 'step-line':
            return [
                {
                    type: 'line',
                    ...singleKeys,
                    interpolation: { type: 'step' },
                } satisfies AgLineSeriesOptions,
            ];

        case 'area':
            return [
                {
                    type: 'area',
                    ...singleKeys,
                } satisfies AgAreaSeriesOptions,
            ];
        case 'range-area':
            const type = 'range-area';
            return [
                {
                    type,
                    xKey,
                    yHighKey: highKey,
                    yLowKey: closeKey,
                } satisfies AgRangeAreaSeriesOptions,
                {
                    type,
                    xKey,
                    yHighKey: closeKey,
                    yLowKey: lowKey,
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
            return [
                {
                    type: 'candlestick',
                    ...keys,
                    item: {
                        up: {
                            fill: 'transparent',
                        },
                    },
                } satisfies AgCandlestickSeriesOptions,
            ];
    }
}
