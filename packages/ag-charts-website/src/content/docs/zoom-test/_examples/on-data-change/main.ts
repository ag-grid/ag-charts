// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import type { DatumType } from './data';
import { getData } from './data';
import { initPlusButton } from './plusButton';

initPlusButton();

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    zoom: { enabled: true },
    series: [
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y1',
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y2',
        },
        {
            type: 'line',
            xKey: 'x',
            yKey: 'y3',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

const chart = AgCharts.create(options);

function onUpdateData(): void {
    options.data = getData();
    chart.update(options);
}

function onXAxisTypeChange(value: 'number' | 'category'): void {
    options.axes![0]!.type = value;
}
