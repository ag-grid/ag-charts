import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    AgNumberAxisOptions,
} from 'ag-charts-community';

import { getData } from './data';

const categoryAxis: AgCategoryAxisOptions = {
    type: 'category',
    position: 'bottom',
    label: {},
};

const numberAxis: AgNumberAxisOptions = {
    type: 'number',
    position: 'left',
    label: {},
};

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
    axes: [categoryAxis, numberAxis],
};

const chart = AgCharts.create(options);

function reset() {
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
    delete categoryAxis.label!.rotation;
    delete numberAxis.label!.rotation;
    categoryAxis.label!.autoRotate = false;
    numberAxis.label!.autoRotate = false;

    chart.update(options);
}

function fixedRotation() {
    categoryAxis.label!.rotation = 45;
    numberAxis.label!.rotation = 45;
    categoryAxis.label!.autoRotate = false;
    numberAxis.label!.autoRotate = false;

    chart.update(options);
}

function autoRotation() {
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
    categoryAxis.label!.avoidCollisions = false;
    numberAxis.label!.avoidCollisions = false;

    chart.update(options);
}

function autoCollisionDetection() {
    categoryAxis.label!.avoidCollisions = true;
    numberAxis.label!.avoidCollisions = true;

    chart.update(options);
}
