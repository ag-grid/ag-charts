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

export function priceVolume(opts: AgPriceVolumePreset & AgBaseFinancialPresetOptions): AgCartesianChartOptions {
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
                      return { fill: datum[openKey] < datum[closeKey] ? '#92D2CC' : '#F7A9A7' };
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
                  positive: {
                      color: '#089981',
                  },
                  negative: {
                      color: '#F23645',
                  },
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
        axes: [
            {
                type: 'number',
                position: 'right',
                keys: [openKey, closeKey, highKey, lowKey],
                interval: {
                    maxSpacing: 50,
                },
                tick: {
                    size: 0,
                },
                label: {
                    padding: 0,
                    fontSize: 10,
                    format: '.2f',
                },
                thickness: 25,
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
                position: 'right',
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
