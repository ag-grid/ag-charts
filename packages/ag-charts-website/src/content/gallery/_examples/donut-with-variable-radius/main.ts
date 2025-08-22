import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
const numFormatter = new Intl.NumberFormat('en-US');

const options: AgPolarChartOptions = {
    // FIXME: Completely rework.
    container: document.getElementById('myChart'),
    title: {
        text: 'Oxford Street Department Store',
    },
    subtitle: {
        text: 'Total Product Value by Department',
    },
    series: [
        {
            data: data['categories'],
            type: 'donut',
            calloutLabelKey: 'category',
            calloutLabel: {
                offset: 10,
                avoidCollisions: true,
            },
            angleKey: 'value',
            radiusKey: 'value',
            innerRadiusRatio: 0.3,
            fillOpacity: 0.5,
            innerLabels: [
                {
                    text: 'Total Value',
                    spacing: 4,
                },
                {
                    text: '£40M',
                    spacing: 4,
                },
            ],
            legendItemKey: 'category',
            cornerRadius: 3,
            strokeWidth: 1,
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                },
            },
            tooltip: {
                renderer: (params) => {
                    const value = params.datum[params.angleKey!] as number;
                    const formattedValue =
                        value < 1e9 ? `£${numFormatter.format(value / 1e6)}M` : `£${numFormatter.format(value / 1e9)}B`;

                    return {
                        heading: 'Total Product Value',
                        title: params.datum[params.calloutLabelKey || params.sectorLabelKey || 'category'],
                        data: [
                            {
                                label: 'Value',
                                value: formattedValue,
                            },
                        ],
                    };
                },
            },
        },
    ],
    legend: {
        // Segments already labelled in the sectorLabel.
        enabled: false,
    },
    formatter: {
        angle: (params) => {
            const value = params.value as number;
            return value < 1e9 ? `${numFormatter.format(value / 1e6)}M` : `${numFormatter.format(value / 1e9)}B`;
        },
    },
};

AgCharts.create(options);
