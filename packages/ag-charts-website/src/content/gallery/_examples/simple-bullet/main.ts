import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

function formatNumber(value: number) {
    value /= 1000;
    return `$${Math.floor(value)}K`;
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ revenue: 326270, targetRevenue: 250000 }],
    title: { text: 'Revenue (US $)' },
    subtitle: { text: '2020 YTD' },
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Actual',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350000 },
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

AgCharts.create(options);
