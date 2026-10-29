// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

// Mimics a host that has registered the variable itself, as another chart on the page would have in the light DOM.
// The registration is document-wide, so a chart inside a shadow root transitions on it too.
CSS.registerProperty({
    name: '--shadow-root-background',
    syntax: '<color>',
    inherits: true,
    initialValue: 'transparent',
});

const shadowRoot = document.getElementById('shadowHost')!.attachShadow({ mode: 'open' });
const shadowContainer = document.createElement('div');
shadowContainer.id = 'shadowContainer';
shadowContainer.style.cssText = 'width: 100%; height: 300px;';
shadowRoot.append(shadowContainer);

const lightContainer = document.getElementById('myChart')!;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: { params: { backgroundColor: 'var(--shadow-root-background)' } },
    title: { text: 'Monthly Revenue' },
    data: [
        { month: 'Jan', revenue: 120 },
        { month: 'Feb', revenue: 150 },
        { month: 'Mar', revenue: 180 },
        { month: 'Apr', revenue: 140 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', yName: 'Revenue' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};

const chart = AgCharts.create(options);

function moveToLightDom() {
    options.container = lightContainer;
    chart.update(options);
}

function moveToShadowRoot() {
    options.container = shadowContainer;
    chart.update(options);
}

function changeCSSVariable() {
    const current = document.body.style.getPropertyValue('--shadow-root-background') || '#ffffff';
    document.body.style.setProperty('--shadow-root-background', current === '#ffffff' ? '#cde6ff' : '#ffffff');
}

(window as any).moveToLightDom = moveToLightDom;
(window as any).moveToShadowRoot = moveToShadowRoot;
(window as any).changeCSSVariable = changeCSSVariable;
