import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    NumberAxisModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sweaters made',
    },
    data: [
        { month: 'Jun', sweaters: 50 },
        { month: 'Jul', sweaters: 70 },
        { month: 'Aug', sweaters: 60 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
        },
    ],
    contextMenu: {
        getItems: () => {
            const state = chart.getState();
            return [
                {
                    type: 'action',
                    showOn: 'series-node',
                    label: 'Log last state',
                    action: () => console.log(`state was`, state),
                },
            ];
        },
    },
    listeners: {
        activeChange: (ev) => {
            if (ev.activeItem === undefined) {
                ev.preventDefault();
            }
        },
    },
};

const chart = AgCharts.create(options);
