import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Harbour Bank Financial Report (in £ millions)',
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'classification',
            radiusKey: 'january_balance',
            radiusName: `January Balance`,
        },
        {
            type: 'radar-line',
            angleKey: 'classification',
            radiusKey: 'february_balance',
            radiusName: `February Balance`,
        },
    ],
};

AgEnterpriseCharts.create(options);
