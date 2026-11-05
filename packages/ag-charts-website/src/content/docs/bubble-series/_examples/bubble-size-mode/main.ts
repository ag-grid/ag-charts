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
            sizeDomain: [0, 250],
            label: {
                enabled: true,
                placement: ['inside', 'top', 'bottom'],
                truncate: false,
                formatter: ({ datum }) => `$${datum.revenue}m`,
            },
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

function setMinSize(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    (options.series![0] as AgBubbleSeriesOptions).minSize = value;
    chart.update(options);

    document.getElementById('minSizeValue')!.innerHTML = String(value);
}

function setMaxSize(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    (options.series![0] as AgBubbleSeriesOptions).maxSize = value;
    chart.update(options);

    document.getElementById('maxSizeValue')!.innerHTML = String(value);
}

function setSizeDomain(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    (options.series![0] as AgBubbleSeriesOptions).sizeDomain =
        value === 'data' ? undefined : (value.split(',').map(Number) as [number, number]);
    chart.update(options);
}
