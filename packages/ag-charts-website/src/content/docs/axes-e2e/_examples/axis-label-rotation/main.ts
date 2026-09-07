import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    AgNumberAxisOptions,
    ContextMenuModule,
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
    const element = document.getElementsByClassName('ag-charts-wrapper')![0]! as HTMLElement;
    element.style.width = '100%';
    element.style.height = '100%';

    delete categoryAxis.label!.rotation;
    delete categoryAxis.label!.autoRotate;
    delete categoryAxis.label!.avoidCollisions;
    delete numberAxis.label!.rotation;
    delete numberAxis.label!.autoRotate;
    delete numberAxis.label!.avoidCollisions;

    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);

    (document.getElementById('rotation-auto') as HTMLInputElement).checked = true;
    (document.getElementById('values-uniform') as HTMLInputElement).checked = true;
    (document.getElementById('collisions-on') as HTMLInputElement).checked = true;
}

function rotationChange(event: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;
    const rotation = (event.target as HTMLInputElement).value;

    if (rotation === 'fixed') {
        categoryAxis.label!.rotation = 45;
        numberAxis.label!.rotation = 45;
    } else {
        delete categoryAxis.label!.rotation;
        delete numberAxis.label!.rotation;
    }

    categoryAxis.label!.autoRotate = rotation === 'auto';
    numberAxis.label!.autoRotate = rotation === 'auto';

    chart.update(options);
}

function valuesChange(event: Event) {
    const values = (event.target as HTMLInputElement).value;

    (options.series![0] as AgBarSeriesOptions).xKey = values === 'uniform' ? 'year' : 'country';

    chart.update(options);
}

function collisionsChange(event: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;
    const avoidCollisions = (event.target as HTMLInputElement).value === 'on';

    categoryAxis.label!.avoidCollisions = avoidCollisions;
    numberAxis.label!.avoidCollisions = avoidCollisions;

    chart.update(options);
}
