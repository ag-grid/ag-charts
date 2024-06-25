import type {
    AgAreaSeriesOptions,
    AgBaseFinancialPresetOptions,
    AgCandlestickSeriesOptions,
    AgCartesianChartOptions,
    AgLineSeriesOptions,
    AgOhlcSeriesOptions,
    AgPriceVolumePreset,
    AgRangeAreaSeriesOptions,
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
        timeFormat = '%d-%b',
        data,
        ...unusedOpts
    } = opts;

    const volumeSeries = createSeries(chartType, xKey, highKey, lowKey, openKey, closeKey);

    return {
        _type: 'price-volume',
        zoom: {
            enabled: true,
            // @ts-expect-error
            enableIndependentAxes: true,
        },
        toolbar: {
            annotationOptions: {
                enabled: true,
            },
            annotations: {
                enabled: true,
            },
            ranges: {
                enabled: true,
            },
        },
        legend: { enabled: false },
        statusBar: {
            enabled: true,
            data: data ?? [],
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
        series: [
            {
                type: 'bar',
                xKey: 'date',
                yKey: volumeKey,
                itemStyler({ datum }) {
                    return { fill: datum[openKey] < datum[closeKey] ? '#92D2CC' : '#F7A9A7' };
                },
            },
            ...volumeSeries,
        ],
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
                    format: timeFormat,
                },
                crosshair: {
                    enabled: true,
                },
            },
        ],
        annotations: {
            enabled: true,
        },
        tooltip: { enabled: false },
        data,
        ...unusedOpts,
    };
}

function createSeries(
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
                    item: {
                        up: {
                            stroke: '#089981',
                        },
                        down: {
                            stroke: '#F23645',
                        },
                    },
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
                    fill: '#089981',
                } satisfies AgRangeAreaSeriesOptions,
                {
                    type,
                    xKey,
                    yHighKey: closeKey,
                    yLowKey: lowKey,
                    fill: '#F23645',
                } satisfies AgRangeAreaSeriesOptions,
            ];

        default:
        case 'candlestick':
            return [
                {
                    type: 'candlestick',
                    ...keys,
                    item: {
                        up: {
                            fill: '#089981',
                            stroke: '#089981',
                        },
                        down: {
                            fill: '#F23645',
                            stroke: '#F23645',
                        },
                    },
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
                            stroke: '#5090dc',
                        },
                        down: {
                            fill: '#5090dc',
                            stroke: '#5090dc',
                        },
                    },
                } satisfies AgCandlestickSeriesOptions,
            ];
    }
}
