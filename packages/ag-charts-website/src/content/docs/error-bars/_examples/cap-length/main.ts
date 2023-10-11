import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Volume-Pressure Relationship with Confidence Intervals',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            errorBar:  {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
                cap: { length: 25 },
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
