import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgStandaloneChartOptions,
    AgTooltipRendererResult,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    DonutSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    PieSeriesModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    DonutSeriesModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    PieSeriesModule,
    ContextMenuModule,
]);
const numFormatter = new Intl.NumberFormat('en-US');
const tooltip = {
    renderer: ({ datum, yKey, yName }: AgCartesianSeriesTooltipRendererParams<DataType>): AgTooltipRendererResult => {
        return { data: [{ label: yName!, value: numFormatter.format(Number(datum[yKey])) }] };
    },
};

const barOptions: AgCartesianChartOptions<DataType> = {
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
            stacked: true,
            yName: 'Early',
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            tooltip,
        },
    ],
    axes: {
        y: {
            type: 'number',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
};

const lineOptions: AgCartesianChartOptions<DataType> = {
    series: [
        {
            type: 'line',
            xKey: 'station',
            yKey: 'early',
            yName: 'Early',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            tooltip,
        },
    ],
    axes: {
        y: {
            type: 'number',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
};

const areaOptions: AgCartesianChartOptions<DataType> = {
    series: [
        {
            type: 'area',
            xKey: 'station',
            yKey: 'early',
            stacked: true,
            yName: 'Early',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            tooltip,
        },
    ],
    axes: {
        y: {
            type: 'number',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
};

const donutOptions: AgStandaloneChartOptions<DataType> = {
    series: [
        {
            type: 'pie',
            title: {
                text: 'Morning Peak',
            },
            calloutLabelKey: 'station',
            legendItemKey: 'station',
            angleKey: 'morningPeak',
            outerRadiusRatio: 0.6,
        },
        {
            type: 'donut',
            title: {
                text: 'Afternoon Peak',
            },
            calloutLabelKey: 'station',
            legendItemKey: 'station',
            angleKey: 'afternoonPeak',
            showInLegend: false,
        },
    ],
};

const sharedOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: {
        enabled: true,
        duration: 500,
    },
};

let options: AgChartOptions<DataType> = { ...sharedOptions, ...barOptions };

const chart = AgCharts.create(options as AgChartOptions);

function seriesTypeChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    switch (value) {
        case 'bar':
            options = { ...sharedOptions, ...barOptions };
            break;
        case 'line':
            options = { ...sharedOptions, ...lineOptions };
            break;
        case 'area':
            options = { ...sharedOptions, ...areaOptions };
            break;
        case 'donut':
            options = { ...sharedOptions, ...donutOptions };
            break;
    }
    chart.update(options);
}

function durationChange(event: Event) {
    const duration = Number((event.target as HTMLInputElement).value);
    sharedOptions.animation = { enabled: true, duration };
    options.animation = sharedOptions.animation;
    chart.update(options);
}
