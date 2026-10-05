import {
    AgBubbleSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    AgMarkerSizeMode,
    BubbleSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Store Performance',
    },
    subtitle: {
        text: 'Bubble size shows annual revenue',
    },
    series: [
        {
            type: 'bubble',
            xKey: 'footfall',
            xName: 'Weekly Footfall',
            yKey: 'conversion',
            yName: 'Conversion Rate',
            sizeKey: 'revenue',
            sizeName: 'Revenue',
            labelKey: 'store',
            sizeMode: 'diameter',
            minSize: 4,
            maxSize: 60,
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                text: 'Weekly Footfall',
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Conversion Rate',
            },
        },
    },
    formatter: {
        x: '#{~f}k',
        y: '#{~f}%',
        size: '$#{~f}m',
    },
};

const chart = AgCharts.create(options);

function setSizeMode(event: Event) {
    (options.series![0] as AgBubbleSeriesOptions).sizeMode = (event.target as HTMLInputElement)
        .value as AgMarkerSizeMode;
    chart.update(options);
}
