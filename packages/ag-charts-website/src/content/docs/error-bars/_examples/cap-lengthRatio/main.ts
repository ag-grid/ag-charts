import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Monthly Average Temperatures with Error Bars (Celsius)',
    },
    series: [
        {
            type: 'bar',
            data: getData(),
            xKey: 'month',
            yKey: 'temperature',
            yName: 'Canada',
            errorBar:  {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
                cap: { lengthRatio: 1.0 },
            },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
