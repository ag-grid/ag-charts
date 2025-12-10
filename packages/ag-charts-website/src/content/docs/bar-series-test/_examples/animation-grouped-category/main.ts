import {
    AgCartesianChartOptions,
    AgChartLegendPosition,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    GroupedCategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

/* eslint-disable aglint/validate-module-registration -- grouped-category axis is inferred from array data */
ModuleRegistry.registerModules([
    BarSeriesModule,
    GroupedCategoryAxisModule,
    LegendModule,
    NumberAxisModule,
    AnimationModule,
]);
/* eslint-enable aglint/validate-module-registration */

const legendPositions: Array<AgChartLegendPosition> = ['bottom', 'left', 'right', 'top'];
const stackGroups = ['Devices', 'Devices', 'Devices', 'Wearables', 'Series'];

let data = getData();

const series: NonNullable<AgCartesianChartOptions['series']> = [
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'yearQuarter',
        yKey: 'iphone',
        yName: 'iPhone',
        stackGroup: 'Devices',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'yearQuarter',
        yKey: 'mac',
        yName: 'Mac',
        stackGroup: 'Devices',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'yearQuarter',
        yKey: 'ipad',
        yName: 'iPad',
        stackGroup: 'Devices',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'yearQuarter',
        yKey: 'wearables',
        yName: 'Wearables',
        label: {
            color: 'white',
        },
    },
    {
        type: 'bar',
        direction: 'horizontal',
        xKey: 'yearQuarter',
        yKey: 'services',
        yName: 'Services',
        label: {
            color: 'white',
        },
    },
];

const options: AgCartesianChartOptions = {
    theme: 'ag-default',
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data,
    series,
    legend: {},
};

const chart = AgCharts.create(options);

function reset() {
    data = getData();
    options.data = data;
    options.series = [...series];
    chart.update(options);
}

function randomise() {
    options.data = [
        ...data.map((d: any) => ({
            ...d,
            iphone: d.iphone + Math.floor(Math.random() * 50 - 25),
        })),
    ];
    chart.update(options);
}

function removeData() {
    options.data = options.data?.slice(0, options.data.length - 1);
    chart.update(options);
}

function removeSeries() {
    options.series = series.slice(0, options.series!.length - 1);
    chart.update(options);
}

function addSeries() {
    options.series = series.slice(0, options.series!.length + 1);
    chart.update(options);
}

function switchDirection() {
    options.series?.forEach((s: any) => (s.direction = s.direction === 'horizontal' ? 'vertical' : 'horizontal'));
    chart.update(options);
}

function switchToGrouped() {
    options.series?.forEach((s: any) => delete s['stackGroup']);
    chart.update(options);
}

function switchToStacked() {
    options.series?.forEach((s: any, i) => {
        s.stackGroup = stackGroups[i];
    });
    chart.update(options);
}

function moveLegend() {
    const currentPosition = legendPositions.indexOf(options.legend?.position ?? 'bottom');
    options.legend ??= {};
    options.legend.position = legendPositions[(currentPosition + 1) % 4];
    chart.update(options);
}

function changeTheme() {
    const themes = ['ag-default', 'ag-sheets', 'ag-polychroma'] as const;
    const idx = themes.indexOf(options.theme as any);
    options.theme = themes[(idx + 1) % themes.length];
    chart.update(options);
}
