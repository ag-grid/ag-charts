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
    delete categoryAxis.label!.autoRotate;
    delete categoryAxis.label!.avoidCollisions;
    delete categoryAxis.label!.truncate;
    delete categoryAxis.label!.wrapping;
    delete numberAxis.label!.rotation;
    delete numberAxis.label!.autoRotate;
    delete numberAxis.label!.avoidCollisions;
    delete numberAxis.label!.truncate;
    delete numberAxis.label!.wrapping;

    (options.series![0] as AgBarSeriesOptions).xKey = 'year';
    chart.update(options);

    // The chart is back in its created state, so re-sync every control to the option it was created with.
    (document.getElementById('avoidance-select') as HTMLSelectElement).value = 'enabled';
    (document.getElementById('label-select') as HTMLSelectElement).value = 'year';
    (document.getElementById('truncation-select') as HTMLSelectElement).value = 'disabled';
    (document.getElementById('rotation-select') as HTMLSelectElement).value = 'auto';
    (document.getElementById('wrap-select') as HTMLSelectElement).value = 'on-space';
    setAvoidanceDependentControls(true);
}

// Truncation and wrapping are only applied while collision avoidance is enabled, so their controls are
// gated on it.
function setAvoidanceDependentControls(enabled: boolean) {
    (document.getElementById('truncationGroup') as HTMLFieldSetElement).disabled = !enabled;
    (document.getElementById('wrappingGroup') as HTMLFieldSetElement).disabled = !enabled;
}

function rotationChange(e: Event) {
    const categoryAxis = options.axes!.x! as AgCategoryAxisOptions;
    const numberAxis = options.axes!.y! as AgNumberAxisOptions;

    delete categoryAxis.label!.rotation;
    delete numberAxis.label!.rotation;

    const value = (e.target as HTMLInputElement).value;

    switch (value) {
        case 'auto':
            categoryAxis.label!.autoRotate = true;
            numberAxis.label!.autoRotate = true;
            break;
        case 'fixed':
            categoryAxis.label!.rotation = 45;
            numberAxis.label!.rotation = 45;
            categoryAxis.label!.autoRotate = false;
            numberAxis.label!.autoRotate = false;
            break;
        case 'disabled':
            categoryAxis.label!.autoRotate = false;
            numberAxis.label!.autoRotate = false;
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

    categoryAxis.label!.avoidCollisions = enabled;
    numberAxis.label!.avoidCollisions = enabled;
    setAvoidanceDependentControls(enabled);
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
