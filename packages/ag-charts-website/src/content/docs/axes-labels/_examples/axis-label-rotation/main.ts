import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

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

function shortLabels() {
    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function longLabels() {
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
