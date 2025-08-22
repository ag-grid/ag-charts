import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Quarterly Performance (Millions USD)',
    },
    // Root-level formatter for consistent value formatting
    formatter: {
        y: ({ value }) => `$${Number(value).toFixed(1)}M`,
    },
    tooltip: {
        enabled: true,
    },
    theme: {
        overrides: {
            nightingale: {
                series: {
                    fillOpacity: 0.9,
                    strokeWidth: 1.5,
                    highlight: {
                        highlightedItem: {
                            fillOpacity: 1,
                            strokeWidth: 2.5,
                        },
                    },
                    tooltip: {
                        renderer: ({ datum }) => ({
                            heading: datum.quarter,
                            title: `Total: $${(datum.software + datum.hardware + datum.services).toFixed(2)}M`,
                            data: [
                                { label: 'Software', value: `$${datum.software.toFixed(2)}M` },
                                { label: 'Hardware', value: `$${datum.hardware.toFixed(2)}M` },
                                { label: 'Services', value: `$${datum.services.toFixed(2)}M` },
                            ],
                        }),
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
        },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0.15,
            label: {
                enabled: true,
            },
            interval: {
                step: 2,
            },
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
            crossLines: [
                {
                    type: 'range',
                    range: [10, 12],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [8, 6],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [4, 2],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'line',
                    value: 8,
                    label: {
                        text: 'Target: $8M',
                        positionAngle: 180,
                    },
                    strokeWidth: 2,
                    lineDash: [5, 3],
                },
            ],
        },
        {
            type: 'angle-category',
            paddingInner: 0.25,
            line: {
                enabled: false,
            },
            label: {
                enabled: true,
            },
        },
    ],
    legend: {
        position: 'bottom',
        spacing: 20,
    },
};

AgCharts.create(options);
