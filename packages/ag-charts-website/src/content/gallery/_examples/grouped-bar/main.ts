import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Changes in Prison Population',
    },
    footnote: {
        text: 'Source: Ministry of Justice, HM Prison Service, and Her Majesty’s Prison and Probation Service',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'menDelta',
            yName: 'Male',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'womenDelta',
            yName: 'Female',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

AgEnterpriseCharts.create(options);
