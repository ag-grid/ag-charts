import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const MIN = 0;
const MAX = 10;

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Roadmap Prioritisation' },
    // subtitle: { text: 'Expected impact against implementation effort' },
    xKey: 'effort',
    xName: 'Effort',
    yKey: 'impact',
    yName: 'Impact',
    labelKey: 'initiative',
    labelName: 'Initiative',
    label: { enabled: true },
    xAxis: { min: MIN, max: MAX, title: { text: 'Effort' } },
    yAxis: { min: MIN, max: MAX, title: { text: 'Impact' } },
    pivot: { x: 4, y: 6 },
};

const chart = AgCharts.createQuadrantChart(options);

let pivotX = 4;
let pivotY = 6;

updatePivotButtons();

function movePivot(dx: number, dy: number) {
    pivotX = Math.min(MAX, Math.max(MIN, pivotX + dx));
    pivotY = Math.min(MAX, Math.max(MIN, pivotY + dy));
    options.pivot = { x: pivotX, y: pivotY };
    chart.update(options);
    updatePivotButtons();
}

/** inScope */
function updatePivotButtons() {
    (document.getElementById('pivot-left') as HTMLButtonElement).disabled = pivotX <= MIN;
    (document.getElementById('pivot-right') as HTMLButtonElement).disabled = pivotX >= MAX;
    (document.getElementById('pivot-down') as HTMLButtonElement).disabled = pivotY <= MIN;
    (document.getElementById('pivot-up') as HTMLButtonElement).disabled = pivotY >= MAX;
}
