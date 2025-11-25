import {
    BarSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    AgUnitTimeAxisThemeOptions,
    AnimationModule,
    CrosshairModule,
} from 'ag-charts-enterprise';
import { NavigatorModule, ZoomModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CrosshairModule,
    LegendModule,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Influenza Cases',
    },
    subtitle: {
        text: 'Recorded Data for 2024',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Time',
            yKey: 'total_cases',
            yName: 'Total Cases',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Time',
            yKey: 'hospitalizations',
            yName: 'Hospitalizations',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Time',
            yKey: 'deaths',
            yName: 'Deaths',
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            unit: {
                unit: 'day',
                step: 7,
                epoch: new Date(2024, 0, 1),
            },
            parentLevel: {
                enabled: false,
            },
        },
        y: {
            type: 'number',
        },
    },
    zoom: {
        enabled: true,
    },
    navigator: {
        enabled: true,
    },
    initialState: { zoom: { ratioX: { start: 0.8 } } },
    tooltip: {
        mode: 'shared',
    },
    formatter: {
        x(params) {
            if (params.type === 'date' && params.unit === 'day' && params.step === 7 && params.epoch != null) {
                const { value, epoch } = params;
                const weekDuration = 7 * 24 * 60 * 60 * 1000;
                const week = Math.floor((value.getTime() - epoch.getTime()) / weekDuration);
                return `Week ${week + 1}`;
            }
        },
    },
};

const chart = AgCharts.create(options);
