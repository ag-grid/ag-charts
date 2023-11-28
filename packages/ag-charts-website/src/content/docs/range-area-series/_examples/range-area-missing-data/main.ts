import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'London Property Average Price Range',
    },
    subtitle: {
        text: '2000 - 2020',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'date',
            yLowKey: 'flatsAndMaisonettes',
            yHighKey: 'detachedHouses',
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Average Price',
            },
            label: {
                formatter: ({ value }) => `£${(+value).toLocaleString()}`,
            },
        },
        {
            position: 'bottom',
            type: 'time',
        },
    ],
};

const chart = AgCharts.create(options);

function missingYValues() {
    const data = getData();
    options.data = data.map((d) => {
        const year = d.date.getFullYear();
        if (year === 2005 || year === 2018) {
            return { ...d, flatsAndMaisonettes: undefined, detachedHouses: undefined };
        } else return d;
    });

    AgCharts.update(chart, options);
}

function missingXValue() {
    const data = getData();

    options.data = data.map((d) => {
        const year = d.date.getFullYear();
        if (year === 2005 || year === 2006 || year === 2017 || year === 2018) {
            return { ...d, date: undefined };
        } else return d;
    });

    AgCharts.update(chart, options);
}

function reset() {
    options.data = getData();
    AgCharts.update(chart, options);
}
