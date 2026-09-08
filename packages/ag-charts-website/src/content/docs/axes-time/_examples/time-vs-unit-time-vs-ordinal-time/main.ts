import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'School Absences',
    },
    data: [
        { date: new Date(2024, 0, 1), value: 2 },
        { date: new Date(2024, 1, 1), value: 5 },
        { date: new Date(2024, 2, 1), value: 3 },
        { date: new Date(2024, 3, 1), value: 1 },
        { date: new Date(2024, 4, 1), value: 2 },
        { date: new Date(2024, 5, 1), value: 3 },
        { date: new Date(2024, 9, 1), value: 1 },
        { date: new Date(2024, 10, 1), value: 2 },
        { date: new Date(2024, 11, 1), value: 2 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            title: { text: 'Unit Time Axis' },
        },
    },
};

const chart = AgCharts.create(options);

function axisTypeChange(event: Event) {
    const axisType = (event.target as HTMLInputElement).value as 'unit-time' | 'ordinal-time' | 'time';

    switch (axisType) {
        case 'unit-time':
            options.axes = {
                x: {
                    type: 'unit-time',
                    title: { text: 'Unit Time Axis' },
                },
            };
            break;
        case 'ordinal-time':
            options.axes = {
                x: {
                    type: 'ordinal-time',
                    interval: {
                        step: 'month',
                    },
                    title: { text: 'Ordinal Time Axis' },
                },
            };
            break;
        case 'time':
            options.axes = {
                x: {
                    type: 'time',
                    title: { text: 'Continuous Time Axis' },
                },
            };
            break;
    }

    chart.update(options);
}
