import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    AgNumberAxisOptions,
} from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
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
            position: 'bottom',
            label: {},
        },
        y: {
            type: 'number',
            position: 'left',
            label: {},
        },
    },
};

const chart = AgCharts.create(options);

function reset() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    delete categoryAxis.label!.rotation;
    delete categoryAxis.label!.autoRotate;
    delete categoryAxis.label!.avoidCollisions;
    delete numberAxis.label!.rotation;
    delete numberAxis.label!.autoRotate;
    delete numberAxis.label!.avoidCollisions;

    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function disableRotation() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    delete categoryAxis.label!.rotation;
    delete numberAxis.label!.rotation;
    categoryAxis.label!.autoRotate = false;
    numberAxis.label!.autoRotate = false;

    chart.update(options);
}

function fixedRotation() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    categoryAxis.label!.rotation = 45;
    numberAxis.label!.rotation = 45;
    categoryAxis.label!.autoRotate = false;
    numberAxis.label!.autoRotate = false;

    chart.update(options);
}

function autoRotation() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    delete categoryAxis.label!.rotation;
    delete numberAxis.label!.rotation;
    categoryAxis.label!.autoRotate = true;
    numberAxis.label!.autoRotate = true;

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

    categoryAxis.label!.avoidCollisions = false;
    numberAxis.label!.avoidCollisions = false;

    chart.update(options);
}

function autoCollisionDetection() {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    categoryAxis.label!.avoidCollisions = true;
    numberAxis.label!.avoidCollisions = true;

    chart.update(options);
}
