import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

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

const chart = AgCharts.create(options);

function reset() {
    const element = document.getElementsByClassName('ag-chart-wrapper')![0]! as HTMLElement;
    element.style.width = '100%';
    element.style.height = '100%';

    delete options.axes![0].label!.rotation;
    delete options.axes![0].label!.autoRotate;
    delete options.axes![0].label!.avoidCollisions;
    delete options.axes![1].label!.rotation;
    delete options.axes![1].label!.autoRotate;
    delete options.axes![1].label!.avoidCollisions;

    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function disableRotation() {
    delete options.axes![0].label!.rotation;
    delete options.axes![1].label!.rotation;
    options.axes![0].label!.autoRotate = false;
    options.axes![1].label!.autoRotate = false;

    chart.update(options);
}

function fixedRotation() {
    options.axes![0].label!.rotation = 45;
    options.axes![1].label!.rotation = 45;
    options.axes![0].label!.autoRotate = false;
    options.axes![1].label!.autoRotate = false;

    chart.update(options);
}

function autoRotation() {
    delete options.axes![0].label!.rotation;
    delete options.axes![1].label!.rotation;
    options.axes![0].label!.autoRotate = true;
    options.axes![1].label!.autoRotate = true;

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
    options.axes![0].label!.avoidCollisions = false;
    options.axes![1].label!.avoidCollisions = false;

    chart.update(options);
}

function autoCollisionDetection() {
    options.axes![0].label!.avoidCollisions = true;
    options.axes![1].label!.avoidCollisions = true;

    chart.update(options);
}
