import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: data.slice(0, 1),
    title: {
        text: 'Range Column',
    },
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

const chart = AgCharts.create(options);

function addValue() {
    console.log('adding');
    const optionsData = options.data ?? [];
    const datum = data[optionsData.length % data.length];
    const newDatum = {
        ...datum,
    };
    if (optionsData.length % 2 === 0) {
        newDatum.date = `Nov ${Math.floor(optionsData.length / 2) + 1}`;
        options.data = [...optionsData, newDatum];
    } else {
        newDatum.date = `Oct ${31 - Math.floor(optionsData.length / 2)}`;
        options.data = [newDatum, ...optionsData];
    }
    chart.update(options);
}
