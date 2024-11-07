import { AgChartOptions, AgCharts, Marker } from 'ag-charts-enterprise';

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
        size: 5,
    })),
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            label: {
                formatter: ({ value }) => `${value / 1000}K`,
            },
            title: {
                text: 'National Income',
            },
            crosshair: {
                label: {
                    renderer: ({ value }) =>
                        `<div style="padding: 0 7px; border-radius: 2px; line-height: 1.7em; background-color: rgb(71,71,71); color: rgb(255, 255, 255);">${Math.round(value / 1000)}K</div>`,
                },
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
                size: 5,
            },
        },
    },
};

AgCharts.create(options);
