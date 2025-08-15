import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Belsize Road Tesco Annual Sales',
    },
    subtitle: {
        text: 'Total Sales In 2022 And 2023 For Different Product Categories',
    },
    footnote: {
        text: 'All values in thousands of pounds (£). Green indicates categories exceeding growth targets.',
    },
    data: getData(),
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'category',
            xName: 'Product Category',
            yName: 'Sales Range',
            yLowKey: 'sales2022',
            yHighKey: 'sales2023',
            yLowName: '2022 Sales',
            yHighName: '2023 Sales',
            cornerRadius: 6,
            fillOpacity: 0.9,
            strokeWidth: 1.5,
            strokeOpacity: 0,
            label: {
                enabled: true,
                formatter: ({ datum, yLowKey, yHighKey, itemId }) => {
                    const increase = datum[yHighKey] - datum[yLowKey];
                    if (increase > 50 && itemId === 'high') {
                        return `↑£${increase}K`;
                    }
                    if (increase < -50 && itemId === 'low') {
                        return `↓£${Math.abs(increase)}K`;
                    }
                    return '';
                },
                // placement: 'outside',
            },
            highlight: {
                highlightedItem: {
                    strokeWidth: 2,
                    strokeOpacity: 1,
                },
            },
            itemStyler: ({ datum, yLowKey, yHighKey }) => {
                const increase = datum[yHighKey] - datum[yLowKey];
                const growthRate = (increase / datum[yLowKey]) * 100;

                // Color based on growth performance
                let fill = '#94a3b8'; // Gray for low growth

                if (growthRate >= 15) {
                    fill = '#10b981'; // Green for excellent growth
                } else if (growthRate >= 10) {
                    fill = '#3b82f6'; // Blue for good growth
                } else if (growthRate >= 5) {
                    fill = '#6366f1'; // Indigo for moderate growth
                }

                // Use opacity to encode absolute increase
                const normalizedOpacity = Math.min(0.4 + increase / 200, 1);

                return {
                    fill,
                    fillOpacity: normalizedOpacity,
                    lineDash: [3, 2],
                    strokeOpacity: 0.6,
                };
            },
            tooltip: {
                enabled: true,
                renderer: ({ datum, yLowKey, yHighKey }) => {
                    const sales2022 = datum[yLowKey];
                    const sales2023 = datum[yHighKey];
                    const increase = sales2023 - sales2022;
                    const growthRate = ((increase / sales2022) * 100).toFixed(1);

                    return {
                        title: 'Sales Range',
                        data: [
                            { label: '2022 Sales', value: `£${sales2022.toLocaleString()}K` },
                            { label: '2023 Sales', value: `£${sales2023.toLocaleString()}K` },
                            { label: 'Increase', value: `↑£${increase.toLocaleString()}K` },
                            { label: 'Growth Rate', value: `${growthRate}%` },
                        ],
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
            paddingInner: 0.4,
            paddingOuter: 0.2,
            gridLine: {
                enabled: false,
            },
        },
        {
            type: 'number',
            position: 'top',
            title: {
                text: 'Sales (£ thousands)',
            },
            min: 0,
            max: 1000,
            interval: { step: 100 },
            label: {
                formatter: ({ value }) => `£${value}K`,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                    },
                    {
                        strokeWidth: 1,
                        lineDash: [5, 3],
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 500,
                    strokeWidth: 2,
                    strokeOpacity: 0.4,
                    lineDash: [8, 4],
                    label: {
                        text: '2022 Average',
                        padding: 4,
                        position: 'bottom',
                    },
                },
                {
                    type: 'line',
                    value: 750,
                    strokeWidth: 2,
                    strokeOpacity: 0.4,
                    lineDash: [8, 4],
                    label: {
                        text: 'Target',
                        padding: 4,
                        position: 'bottom',
                    },
                },
                {
                    type: 'range',
                    range: [750, 1000],
                },
            ],
        },
    ],
    legend: {
        enabled: false,
    },
    padding: {
        top: 20,
        right: 30,
        bottom: 20,
        left: 120,
    },
};

AgCharts.create(options);
