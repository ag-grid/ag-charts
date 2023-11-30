import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Belsize Road Tesco Annual Sales',
    },
    subtitle: {
        text: 'Total Sales In 2022 And 2023 For Different Product Categories',
    },
    footnote: {
        text: 'Sales in Pound Sterling (£)',
    },
    seriesArea: {
        padding: {
            right: 20,
        },
    },
    data: getData(),
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'category',
            xName: 'Category',
            yName: 'Annual Sales',
            yLowKey: 'sales2022',
            yLowName: 'Sales 2022',
            yHighKey: 'sales2023',
            yHighName: 'Sales 2023',
            label: {
                placement: 'outside',
                color: 'rgb(118,118,118)',
                formatter: ({ itemId, datum, yHighKey, yLowKey }) => {
                    const increase = datum[yHighKey] - datum[yLowKey];
                    return itemId === 'high' ? `↑£${increase / 1000}K` : '';
                },
            },
            formatter: ({ datum, yHighKey, yLowKey }) => ({
                fillOpacity: (datum[yHighKey] - datum[yLowKey]) / 100000,
            }),
            strokeWidth: 1,
            lineDash: [3, 5],
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            paddingInner: 0.4,
            gridLine: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'top',
            gridLine: {
                enabled: false,
            },
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
        },
    ],
};

AgCharts.create(options);
