import { AgCharts, AgPolarChartOptions, AgPolarSeriesOptions } from 'ag-charts-enterprise';

import { getData2020, getData2022 } from './data';

const numFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
});

const sharedSeriesOptions: AgPolarSeriesOptions = {
    type: 'pie',
    sectorLabelKey: 'share',
    angleKey: 'share',
    legendItemKey: 'browser',
    fillOpacity: 0.9,
    strokeWidth: 2,
    strokeOpacity: 1,
    highlight: {
        highlightedItem: {
            fillOpacity: 1,
            strokeWidth: 3,
        },
    },
    sectorLabel: {
        formatter: ({ value }) => {
            return value >= 0.1 ? `${(value * 100).toFixed(0)}%` : '';
        },
    },
};

const options: AgPolarChartOptions = {
    // Investigate missing sectorLabels.
    container: document.getElementById('myChart'),
    title: {
        text: 'Desktop Browser Market Share Evolution',
    },
    subtitle: {
        text: 'Comparing January 2020 (inner) vs September 2022 (outer)',
    },
    series: [
        {
            ...sharedSeriesOptions,
            data: getData2020(),
            outerRadiusRatio: 0.5,
            showInLegend: false,
            title: {
                text: '2020',
            },
            tooltip: {
                renderer: (params: any) => {
                    const value = params.datum.share * 100;
                    return {
                        title: params.datum.browser,
                        data: [{ label: 'Market Share', value: `${value.toFixed(1)}%` }],
                    };
                },
            },
        },
        {
            ...sharedSeriesOptions,
            type: 'donut',
            data: getData2022(),
            title: {
                text: '2022',
            },
            calloutLabelKey: 'browser',
            tooltip: {
                renderer: (params) => {
                    const { datum } = params;
                    const value2022 = datum.share * 100;
                    const data2020 = getData2020().find((d) => d.browser === datum.browser);
                    const value2020 = data2020 ? data2020.share * 100 : 0;
                    const change = value2022 - value2020;
                    const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '–';

                    return {
                        title: datum.browser,
                        data: [
                            { label: '2022', value: `${value2022.toFixed(1)}%` },
                            { label: '2020', value: `${value2020.toFixed(1)}%` },
                            { label: 'Change', value: `${changeIcon} ${Math.abs(change).toFixed(1)} pp` },
                        ],
                    };
                },
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'right',
        item: {
            marker: {
                size: 18,
                strokeWidth: 2,
                padding: 8,
            },
            paddingX: 16,
            paddingY: 8,
        },
    },
};

AgCharts.create(options);
