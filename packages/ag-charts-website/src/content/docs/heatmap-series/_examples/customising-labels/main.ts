import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK monthly mean temperature °C',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'temperature',
            colorName: 'Temperature',

            labelKey: 'temperature',
            label: {
                enabled: true,
                formatter: ({ value }) => {
                    return `${value.toFixed(0)}°C`;
                },
            },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
