import { AgChartOptions, AgCharts, AgDonutSeriesOptions } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const data = getData();
const numFormatter = new Intl.NumberFormat('en-GB');
const total = data.reduce((sum, d) => sum + d.count, 0);

// Sort data by count descending for better visual hierarchy
const sortedData = [...data].sort((a, b) => b.count - a.count);

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: sortedData,
    title: {
        text: 'Dwelling Fires by Property Type',
    },
    subtitle: {
        text: 'United Kingdom - Annual Statistics',
        spacing: 20,
    },
    footnote: {
        text: 'Source: UK Home Office Fire Statistics',
    },
    theme: {
        overrides: {
            donut: {
                series: {
                    strokeWidth: 1,
                    sectorSpacing: 2,
                    innerRadiusRatio: 0.6,
                    outerRadiusRatio: 0.95,
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 2,
                        },
                    },
                },
            },
        },
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
            title: {
                text: 'Annual Incidents',
            },
            innerLabels: [
                {
                    text: numFormatter.format(total),
                },
                {
                    text: 'Total Fires',
                    spacing: 10,
                },
            ],
            tooltip: {
                renderer: ({ datum, angleKey }) => {
                    const value = datum[angleKey] as number;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                        title: datum.type,
                        data: [
                            { label: 'Incidents', value: numFormatter.format(value) },
                            { label: 'Percentage', value: `${percentage}%` },
                            {
                                label: 'Rank',
                                value: `#${sortedData.findIndex((d) => d.type === datum.type) + 1} of ${sortedData.length}`,
                            },
                        ],
                    };
                },
            },
            legendItemKey: 'type',
        },
    ],
    formatter: (params) => (typeof params.value === 'number' ? numFormatter.format(params.value) : undefined),
    legend: {
        position: 'bottom',
        spacing: 40,
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: {
                size: 12,
            },
            label: {
                formatter: ({ value }) => {
                    const item = sortedData.find((d) => d.type === value);
                    if (item) {
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return `${value} (${percentage}%)`;
                    }
                    return value;
                },
            },
        },
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
