import { AgChartOptions, AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Services Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    formatter: {
        y: ({ value }) => `$${typeof value === 'number' ? value.toFixed(1) : value}M`,
    },
    tooltip: {
        enabled: true,
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            fill: {
                type: 'gradient',
                colorStops: [
                    {
                        color: 'darkred',
                        stop: 0,
                    },
                    {
                        color: 'yellow',
                        stop: 1.5,
                    },
                    {
                        color: 'green',
                        stop: 3.5,
                    },
                ],
            },
            tooltip: {
                renderer: ({ datum, angleName }) => ({
                    heading: datum.quarter,
                    title: angleName || 'Services',
                    data: [
                        {
                            label: 'Revenue',
                            value: `$${datum.services.toFixed(1)}M`,
                        },
                    ],
                }),
            },
        },
    ],
    axes: [
        {
            type: 'radius-category',
            innerRadiusRatio: 0,
            paddingOuter: 0.2,
            label: {
                enabled: true,
            },
            gridLine: {
                enabled: false,
            },
        },
        {
            type: 'angle-number',
            endAngle: 270,
            interval: {
                step: 0.2,
            },
            gridLine: {
                enabled: true,
            },
        },
    ],
};
AgCharts.create(options);
