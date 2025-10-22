import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Department Efficiency KPI',
    },
    subtitle: {
        text: 'Lower values indicate better efficiency (reversed scale: 100% at center, 0% at edge)',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency Score',
            fillOpacity: 0.2,
            strokeWidth: 2,
            marker: {
                size: 8,
                strokeWidth: 2,
            },
            highlight: {
                highlightedSeries: {
                    strokeWidth: 3,
                    fillOpacity: 1,
                },
                highlightedItem: {
                    strokeWidth: 3,
                    fillOpacity: 1,
                },
            },
            tooltip: {
                renderer: ({ datum, radiusKey, radiusName }) => ({
                    heading: datum.department,
                    title: radiusName,
                    data: [
                        {
                            label: 'Efficiency',
                            value: `${datum[radiusKey]}%`,
                        },
                        {
                            label: 'Performance',
                            value:
                                datum[radiusKey] >= 70
                                    ? 'Excellent'
                                    : datum[radiusKey] >= 50
                                      ? 'Good'
                                      : datum[radiusKey] >= 30
                                        ? 'Average'
                                        : 'Needs Improvement',
                        },
                        {
                            label: 'Status',
                            value: datum[radiusKey] < 50 ? 'Below Target' : 'Meeting Target',
                        },
                    ],
                }),
            },
        },
    ],
    axes: [
        {
            type: 'angle-category',
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
            label: {
                spacing: 12,
            },
        },
        {
            type: 'radius-number',
            shape: 'circle',
            positionAngle: 180,
            label: {
                rotation: 180,
                formatter: ({ value }) => `${value}%`,
            },
            reverse: true,
        },
    ],
};

AgCharts.create(options);
