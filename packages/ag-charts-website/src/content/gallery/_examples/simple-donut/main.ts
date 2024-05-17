import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();
const numFormatter = new Intl.NumberFormat('en-US');
const total = data.reduce((sum, d) => sum + d['count'], 0);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Dwelling Fires (UK)',
    },
    footnote: {
        text: 'Source: Home Office',
    },
    series: [
        {
            type: 'donut',
            calloutLabelKey: 'type',
            angleKey: 'count',
            sectorLabelKey: 'count',
            calloutLabel: {
                enabled: false,
            },
            sectorLabel: {
                formatter: ({ datum, sectorLabelKey }) => {
                    const value = datum[sectorLabelKey!];
                    return numFormatter.format(value);
                },
            },
            title: {
                text: 'Annual Count',
            },
            innerRadiusRatio: 0.7,
            innerLabels: [
                {
                    text: numFormatter.format(total),
                    fontSize: 24,
                },
                {
                    text: 'Total',
                    fontSize: 16,
                    margin: 10,
                },
            ],
            tooltip: {
                renderer: ({ datum, calloutLabelKey, title, sectorLabelKey }) => {
                    return {
                        title,
                        content: `${datum[calloutLabelKey!]}: ${numFormatter.format(datum[sectorLabelKey!])}`,
                    };
                },
            },
            sectorSpacing: 3,
        },
    ],
};

AgCharts.create(options);
