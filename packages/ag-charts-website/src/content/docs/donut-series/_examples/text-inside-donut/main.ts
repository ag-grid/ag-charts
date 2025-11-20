import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { DonutSeriesModule, ModuleRegistry } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([DonutSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Portfolio Composition',
    },
    series: [
        {
            type: 'donut',
            calloutLabelKey: 'asset',
            angleKey: 'amount',
            innerRadiusRatio: 0.9,
            innerLabels: [
                {
                    text: 'Total Investment',
                    fontWeight: 'bold',
                },
                {
                    text: '$100,000',
                    spacing: 4,
                    fontSize: 40,
                    color: 'green',
                },
            ],
            innerCircle: {
                fill: '#c9fdc9',
            },
        },
    ],
};

AgCharts.create(options);
