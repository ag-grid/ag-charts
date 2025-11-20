import { AgChartOptions, AgCharts, AgDonutSeriesOptions } from 'ag-charts-enterprise';
import { DonutSeriesModule, ModuleRegistry } from 'ag-charts-community';
import { AnimationModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([AnimationModule, DonutSeriesModule]);
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
                },
            },
        },
    },
    series: [
        {
            type: 'donut',
            angleKey: 'count',
            calloutLabelKey: 'count',
            sectorLabelKey: 'count',
            calloutLabel: {
                minAngle: 10,
                formatter: ({ datum }) => [
                    {
                        text: numFormatter.format(datum.count),
                        fontSize: 20,
                    },
                    { text: '\n' + datum.type, fontSize: 10, color: 'grey' },
                ],
            },
            sectorLabel: {
                formatter: ({ datum, angleKey }) => {
                    const value = datum[angleKey] as number;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${percentage}%`;
                },
            },
            innerLabels: [
                {
                    text: numFormatter.format(total),
                    fontSize: 24,
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
        },
    ],
    legend: {
        enabled: false,
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
