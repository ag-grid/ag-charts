import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

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
                stroke: 'pink',
                strokeWidth: 2,
                cap: {
                    stroke: 'red', // otherwise inherits `pink` from whisker
                    strokeWidth: 5, // otherwise inherits `2` from whisker
                    length: 25,
                },
            },
        },
    ],
};

AgChart.create(options);
