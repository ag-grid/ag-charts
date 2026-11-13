import {
    AgCartesianAxisCrossAtPlacement,
    AgCharts,
    AgQuadrantChartOptions,
    ModuleRegistry,
    QuadrantChartModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Roadmap Prioritisation' },
    xKey: 'effort',
    xName: 'Effort',
    yKey: 'impact',
    yName: 'Impact',
    // labelKey: 'initiative',
    // labelName: 'Initiative',
    label: { enabled: false },
    pivot: { x: 4, y: 6 },
    xAxis: { min: 0, max: 10, title: { text: 'Effort' }, crosshair: { enabled: true } },
    yAxis: { min: 0, max: 10, title: { text: 'Impact' }, crosshair: { enabled: true } },
};

const chart = AgCharts.createQuadrantChart(options);

let alignAxesToPivot = true;

updatePlacementSelects();

function toggleAlignAxesToPivot(enabled: boolean) {
    alignAxesToPivot = enabled;
    options.alignAxesToPivot = enabled;
    chart.update(options);
    updatePlacementSelects();
}

/** inScope */
function updatePlacementSelects() {
    (document.getElementById('placementGroup') as HTMLFieldSetElement).disabled = !alignAxesToPivot;
}

function updateTitlePlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axisPlacement = { ...options.axisPlacement, title: placement };
    chart.update(options);
}

function updateLabelPlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axisPlacement = { ...options.axisPlacement, label: placement };
    chart.update(options);
}

function updateCrosshairLabelPlacement(placement: AgCartesianAxisCrossAtPlacement) {
    options.axisPlacement = { ...options.axisPlacement, crosshairLabel: placement };
    chart.update(options);
}
