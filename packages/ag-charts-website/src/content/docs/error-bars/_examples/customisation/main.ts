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
            xKey: 'vol',
            yKey: 'pres',
            errorBar: {
                xLowerKey: 'volLower',
                xUpperKey: 'volUpper',
                yLowerKey: 'presLower',
                yUpperKey: 'presUpper',
                stroke: '#4A4A93',
                strokeWidth: 1,
                cap: {
                    stroke: '#FF9E4A', // otherwise inherits `#4A4A93` from whisker
                    strokeWidth: 3, // otherwise inherits `1` from whisker
                    length: 25,
                },
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
