import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Earthquake Magnitudes by Source',
    },
    footnote: {
        text: 'Source: US Geological Survey',
    },
    series: [
        {
            data: data.ci,
            type: 'line',
            title: 'Southern California Seismic Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
        {
            data: data.hv,
            type: 'line',
            title: 'Hawaiian Volcano Observatory Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
        {
            data: data.nc,
            type: 'line',
            title: 'USGS Northern California Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
        {
            data: data.ok,
            type: 'line',
            title: 'Oklahoma Seismic Network',
            xKey: 'time',
            yKey: 'magnitude',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            label: {
                format: '%d/%m',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Magnitude',
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
