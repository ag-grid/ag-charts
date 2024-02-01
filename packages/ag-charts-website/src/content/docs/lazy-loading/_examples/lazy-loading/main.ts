import {
    AgBarSeriesTooltipRendererParams,
    AgCartesianChartOptions,
    AgCharts,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip: AgSeriesTooltip<AgBarSeriesTooltipRendererParams> = {
    renderer: ({ datum, xKey, yKey, yName }) => ({
        content: `${datum[yKey].toFixed(0)} ${yName}`,
        title: datum[xKey],
    }),
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: (() => getData()) as any,
    series: [
        {
            type: 'bar',
            xKey: 'athlete',
            yKey: 'gold',
            yName: 'Gold',
            stackGroup: 'athlete',
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'athlete',
            yKey: 'silver',
            yName: 'Silver',
            stackGroup: 'athlete',
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'athlete',
            yKey: 'bronze',
            yName: 'Bronze',
            stackGroup: 'athlete',
            tooltip,
        },
    ],
};

AgCharts.create(options);
