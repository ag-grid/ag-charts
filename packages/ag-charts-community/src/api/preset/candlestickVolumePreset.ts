import type {
    AgAxisLabelFormatterParams,
    AgBarSeriesFormatterParams,
    AgBaseFinancialPresetOptions,
    AgCandlestickVolumePreset,
    AgCartesianChartOptions,
    AgCrosshairLabelRendererParams,
} from 'ag-charts-types';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    return format == 'd-m'
        ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
        : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });
}

export function candlestickVolumePreset(
    opts: AgCandlestickVolumePreset & AgBaseFinancialPresetOptions
): AgCartesianChartOptions {
    const {
        type: _type,
        xKey = 'date',
        highKey = 'high',
        openKey = 'open',
        lowKey = 'low',
        closeKey = 'close',
        volumeKey = 'volume',
        data,
        ...unusedOpts
    } = opts;
    return {
        zoom: {
            enabled: true,
            // @ts-expect-error
            enableIndependentAxes: true,
        },
        toolbar: {
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
                itemStyler: (params: AgBarSeriesFormatterParams<any>) => {
                    const { datum } = params;
                    const fill = datum[openKey] < datum[closeKey] ? '#92D2CC' : '#F7A9A7';
                    return { fill };
                },
            },
            {
                type: 'candlestick',
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
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
            },
        ],
        axes: [
            {
                type: 'number',
                position: 'right',
                keys: [openKey, closeKey, highKey, lowKey],
                max: 210,
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
                type: 'category',
                position: 'bottom',
                label: {
                    enabled: true,
                    autoRotate: false,
                    formatter: ({ value }: AgAxisLabelFormatterParams) => dateFormat(value, 'd-m'),
                },
                crosshair: {
                    enabled: true,
                    label: {
                        renderer: ({ value }: AgCrosshairLabelRendererParams) => {
                            return { text: dateFormat(value, 'd-m') };
                        },
                    },
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
