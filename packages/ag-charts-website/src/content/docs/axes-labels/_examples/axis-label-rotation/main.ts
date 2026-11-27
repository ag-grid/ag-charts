import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    AgNumberAxisOptions,
    LegendModule,
} from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'category',
            label: {},
        },
        y: {
            type: 'number',
            label: {},
        },
    },
};

const chart = AgCharts.create(options);

function reset() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    delete categoryAxis.label!.rotation;
    delete categoryAxis.label!.collision;
    delete numberAxis.label!.rotation;
    delete numberAxis.label!.collision;

    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function disableRotation() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    categoryAxis.label!.rotation = 0;
    numberAxis.label!.rotation = 0;

    chart.update(options);
}

function fixedRotation() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    categoryAxis.label!.rotation = 45;
    numberAxis.label!.rotation = 45;

    chart.update(options);
}

function autoRotation() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    categoryAxis.label!.rotation = [0, 335];
    numberAxis.label!.rotation = [0, 335];

    chart.update(options);
}

function shortLabels() {
    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function longLabels() {
    (options.series![0] as AgBarSeriesOptions).xKey = 'country';
    chart.update(options);
}

function noCollisionDetection() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    categoryAxis.label!.collision = { alwaysShow: true };
    numberAxis.label!.collision = { alwaysShow: true };

    chart.update(options);
}

function autoCollisionDetection() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    delete categoryAxis.label!.collision;
    delete numberAxis.label!.collision;

    chart.update(options);
}
