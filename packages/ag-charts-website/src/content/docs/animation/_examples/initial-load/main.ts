import {
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    DonutSeriesModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    PieSeriesModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgPolarChartOptions,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';
import { AnimationModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    DonutSeriesModule,
    LineSeriesModule,
    NumberAxisModule,
    PieSeriesModule,
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
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                wrapping: 'on-space',
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
            position: 'left',
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
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                wrapping: 'on-space',
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
            position: 'left',
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
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                wrapping: 'on-space',
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
};

const donutOptions: AgPolarChartOptions<DataType> = {
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

let options: AgCartesianChartOptions<DataType> | AgPolarChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: {
        enabled: true,
    },
    ...barOptions,
};

const chart = AgCharts.create(options as AgChartOptions);

function changeSeriesBar() {
    options.series = barOptions.series;
    options.axes = barOptions.axes;
    chart.update(options);
}

function changeSeriesLine() {
    options.series = lineOptions.series;
    options.axes = lineOptions.axes;
    chart.update(options);
}

function changeSeriesArea() {
    options.series = areaOptions.series;
    options.axes = areaOptions.axes;
    chart.update(options);
}

function changeSeriesDonut() {
    options.series = donutOptions.series;
    options.axes = donutOptions.axes;
    chart.update(options);
}
