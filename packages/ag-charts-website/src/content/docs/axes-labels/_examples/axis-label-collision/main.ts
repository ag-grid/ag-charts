import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    AgNumberAxisOptions,
    LegendModule,
    TextWrap,
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
    delete categoryAxis.label!.truncate;
    delete numberAxis.label!.rotation;
    delete numberAxis.label!.collision;
    delete numberAxis.label!.truncate;

    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);
}

function rotationChange(e: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    const value = (e.target as HTMLInputElement).value;

    switch (value) {
        case 'auto':
            categoryAxis.label!.rotation = [0, 335];
            numberAxis.label!.rotation = [0, 335];
            break;
        case 'fixed':
            categoryAxis.label!.rotation = 45;
            numberAxis.label!.rotation = 45;
            break;
        case 'disabled':
            categoryAxis.label!.rotation = 0;
            numberAxis.label!.rotation = 0;
            break;
    }
    chart.update(options);
}

function labelChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    (options.series![0] as AgBarSeriesOptions).xKey = value;
    chart.update(options);
}

function truncationChange(e: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    const value = (e.target as HTMLInputElement).value;
    const enabled = value === 'enabled';

    categoryAxis.label!.truncate = enabled;
    numberAxis.label!.truncate = enabled;
    chart.update(options);
}

function avoidanceChange(e: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    const value = (e.target as HTMLInputElement).value;
    const enabled = value === 'enabled';

    categoryAxis.label!.collision = { alwaysShow: !enabled };
    numberAxis.label!.collision = { alwaysShow: !enabled };
    chart.update(options);
}

function wrapChange(e: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;
    const value = (e.target as HTMLInputElement).value as TextWrap;

    categoryAxis.label!.wrapping = value;
    numberAxis.label!.wrapping = value;

    chart.update(options);
}
