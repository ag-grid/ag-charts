import { AgEnterpriseCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Prosperity Bank Financial Report (in £ millions)',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'classification',
            radiusKey: 'january_balance',
            radiusName: `January Balance`,
        },
        {
            type: 'radar-area',
            angleKey: 'classification',
            radiusKey: 'february_balance',
            radiusName: `February Balance`,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            label: {
                orientation: 'parallel',
            },
        },
        {
            type: 'radius-number',
        },
    ],
};

AgEnterpriseCharts.create(options);
