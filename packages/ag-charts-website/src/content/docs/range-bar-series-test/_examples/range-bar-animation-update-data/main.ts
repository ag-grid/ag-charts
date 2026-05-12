import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';
import { random } from './randomHelpers';

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

function updateValues() {
    console.log('updating');
    const updatedData = data.map((d) => ({
        ...d,
        low: random() * d.low,
        high: random() * d.high,
    }));
    options.data = updatedData;
    chart.update(options);
}
