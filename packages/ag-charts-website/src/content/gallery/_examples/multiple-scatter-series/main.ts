import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Wealth And Happiness',
    },
    footnote: {
        text: 'Source: The World Happiness Report 2018',
    },
    series: Object.entries(getData()).map(([continent, data]) => ({
        data,
        type: 'scatter',
        title: continent,
        xKey: 'gdpPerCapita',
        xName: 'GDP Per Capita',
        yKey: 'lifeSatisfaction',
        yName: 'Happiness',
        labelKey: 'country',
        labelName: 'Country',
        label: {
            enabled: true,
        },
        shape: 'star',
        size: 10,
    })),
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            title: {
                text: 'National Income',
            },
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            title: {
                text: 'Happiness',
            },
        },
    ],
    legend: {
        position: 'right',
        item: {
            marker: {
                size: 10,
            },
        },
    },
    formatter: {
        x: (params) => {
            if (params.type !== 'number') return;
            let fractionDigits = params.fractionDigits ?? 0;
            fractionDigits = Math.max(fractionDigits - 1, 0);
            return `${(params.value / 1000).toFixed(fractionDigits)}K`;
        },
    },
};

AgCharts.create(options);
