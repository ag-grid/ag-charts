import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Punch Card of Github',
    },
    subtitle: {
        text: 'Time Distribution of Commits',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'hour',
            xName: 'Time',
            yKey: 'day',
            yName: 'Day',
            sizeKey: 'size',
            sizeName: 'Commits',
            title: 'Punch Card',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
        },
        {
            position: 'left',
            type: 'category',
        },
    ],
};

AgEnterpriseCharts.create(options);
