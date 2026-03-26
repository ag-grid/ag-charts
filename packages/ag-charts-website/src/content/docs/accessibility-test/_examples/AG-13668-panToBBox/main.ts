import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { date: new Date('Monday, July 31, 2023'), open: 4139.39, high: 4177.47, low: 4132.94, close: 4166.82 },
        { date: new Date('Tuesday, August 01, 2023'), open: 4171.33, high: 4195.55, low: 4153.12, close: 4193.8 },
        { date: new Date('Wednesday, August 02, 2023'), open: 4201.27, high: 4245.64, low: 4197.74, close: 4237.86 },
        { date: new Date('Thursday, August 03, 2023'), open: 4152.93, high: 4156.7, low: 4103.78, close: 4117.37 },
        { date: new Date('Friday, August 04, 2023'), open: 4175.99, high: 4183.6, low: 4127.9, close: 4137.23 },
    ],
    series: [{ type: 'candlestick', xKey: 'date', lowKey: 'low', highKey: 'high', openKey: 'open', closeKey: 'close' }],
    zoom: { enabled: true },
};
AgCharts.create(options);
