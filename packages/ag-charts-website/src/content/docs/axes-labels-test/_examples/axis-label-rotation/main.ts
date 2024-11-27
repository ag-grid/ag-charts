import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    AgNumberAxisOptions,
} from 'ag-charts-enterprise';

import { getData } from './data';

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
    axes: [
        {
            type: 'category',
            position: 'bottom',
            label: {},
        },
        {
            type: 'number',
            position: 'left',
            label: {},
        },
    ],
};

const categoryAxis = options.axes![0] as AgCategoryAxisOptions;
const numberAxis = options.axes![1] as AgNumberAxisOptions;

const chart = AgCharts.create(options);

function reset() {
    const element = document.getElementsByClassName('ag-chart-wrapper')![0]! as HTMLElement;
    element.style.width = '100%';
    element.style.height = '100%';

    delete categoryAxis.label!.rotation;
    delete categoryAxis.label!.autoRotate;
    delete categoryAxis.label!.avoidCollisions;
    delete categoryAxis.label!.rotation;
    delete categoryAxis.label!.autoRotate;
    delete categoryAxis.label!.avoidCollisions;

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

function uniformLabels() {
    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function irregularLabels() {
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
