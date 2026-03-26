import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

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
            direction: 'horizontal',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

const chart = AgCharts.create(options);

function removeValue() {
    console.log('removing');
    options.data = [...(options.data ?? [])];
    const dataLength = options.data.length;
    const removeIndex = Math.floor(dataLength * Math.random());
    options.data.splice(removeIndex, 1);
    chart.update(options);
}
