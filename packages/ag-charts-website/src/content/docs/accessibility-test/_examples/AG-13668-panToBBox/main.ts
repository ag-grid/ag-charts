import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [{ type: 'candlestick', xKey: 'date', lowKey: 'low', highKey: 'high', openKey: 'open', closeKey: 'close' }],
    zoom: { enabled: true },
};
AgCharts.create(options);
