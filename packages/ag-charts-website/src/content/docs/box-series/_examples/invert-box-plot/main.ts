import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: 'All values in £ billions',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            direction: 'vertical',
            xKey: 'label',
            xName: 'State',
            yName: 'Billions of GBP',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
};

AgEnterpriseCharts.create(options);
