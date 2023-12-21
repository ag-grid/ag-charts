import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

function formatNumber(value: number) {
    value /= 1000;
    return `$${Math.floor(value)}K`;
}

const leftOptions: AgChartOptions = {
    container: document.getElementById('left'),
    data: [{ revenue: 326_270, targetRevenue: 250_000 }],
    title: { text: 'Revenue' },
    subtitle: { text: '2020 YTD (US $)' },
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Actual',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: 'Revenue 2020 YTD',
                        content: `<b>${valueName}: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
            target: { strokeWidth: 5, stroke: 'red' },
            colorRanges: [
                { color: '#666666', stop: 100_000 },
                { color: '#888888', stop: 200_000 },
                { color: '#AAAAAA', stop: 300_000 },
                { color: '#CCCCCC' },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
            label: { formatter: () => '' },
        },
    ],
    width: 150,
};

AgCharts.create(leftOptions);

const centerOptions: AgChartOptions = {
    container: document.getElementById('center'),
    data: [{ revenue: 123_456, targetRevenue: 250_000 }],
    title: { text: 'Revenue' },
    subtitle: { text: '2020 YTD (US $)' },
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Actual',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: 'Revenue 2020 YTD',
                        content: `<b>${valueName}: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
            target: { strokeWidth: 5, stroke: 'red' },
            colorRanges: [
                { color: '#666666', stop: 100_000 },
                { color: '#888888', stop: 200_000 },
                { color: '#AAAAAA', stop: 300_000 },
                { color: '#CCCCCC' },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
            label: { formatter: () => '' },
        },
    ],
    width: 150,
};

AgCharts.create(centerOptions);

const rightOptions: AgChartOptions = {
    container: document.getElementById('right'),
    data: [{ revenue: 225_000, targetRevenue: 250_000 }],
    title: { text: 'Revenue' },
    subtitle: { text: '2020 YTD (US $)' },
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Actual',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: 'Revenue 2020 YTD',
                        content: `<b>${valueName}: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
            target: { strokeWidth: 5, stroke: 'red' },
            colorRanges: [
                { color: '#666666', stop: 100_000 },
                { color: '#888888', stop: 200_000 },
                { color: '#AAAAAA', stop: 300_000 },
                { color: '#CCCCCC' },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
            label: { formatter: () => '' },
        },
    ],
    width: 150,
};

AgCharts.create(rightOptions);
