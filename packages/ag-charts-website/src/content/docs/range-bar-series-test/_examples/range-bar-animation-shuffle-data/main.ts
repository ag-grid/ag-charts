import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Range Column',
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

const chart = AgCharts.create(options);

function shuffleValues() {
    console.log('shuffling');
    let currentIndex = data.length;
    let randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [data[currentIndex], data[randomIndex]] = [data[randomIndex], data[currentIndex]];
    }

    options.data = data;
    chart.update(options);
}
