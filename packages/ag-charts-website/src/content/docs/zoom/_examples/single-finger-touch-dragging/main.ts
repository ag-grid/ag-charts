import { AgCartesianChartOptions, AgCharts, AgTouchOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e3),
    animation: { enabled: false },
    touch: { dragAction: 'none' },
    zoom: {
        enabled: true,
        enableAxisDragging: false,
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'timestamp',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
};

const chart = AgCharts.create(options);

function changeAction(newAction: NonNullable<AgTouchOptions['dragAction']>) {
    options.touch.dragAction = newAction;
    chart.update(options);
}
