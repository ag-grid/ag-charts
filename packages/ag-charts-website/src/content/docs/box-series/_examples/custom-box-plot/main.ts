import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: 'All values in £ billions',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            xKey: 'label',
            xName: 'State',
            yName: 'Billions of GBP',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            // customized configuration
            fill: 'green',
            fillOpacity: 0.5,
            stroke: 'purple',
            strokeWidth: 6,
            strokeOpacity: 0.5,
            cap: {
                lengthRatio: 0.3,
            },
            whisker: {
                stroke: 'red',
                strokeWidth: 3,
                strokeOpacity: 0.8,
                lineDash: [5, 2],
            },
            formatter(params) {
                if (params.datum.min < 3.5) {
                    return { fill: 'yellow', strokeWidth: 1 };
                }
                return {};
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
