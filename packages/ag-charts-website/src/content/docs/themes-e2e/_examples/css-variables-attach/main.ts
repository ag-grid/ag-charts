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

type Scenario = 'series-fallback' | 'series-no-fallback' | 'theme-no-fallback' | 'series-unresolvable';

const data = [
    { month: 'Jan', revenue: 120 },
    { month: 'Feb', revenue: 150 },
    { month: 'Mar', revenue: 180 },
    { month: 'Apr', revenue: 140 },
];

const shadowRoot = document.getElementById('shadowHost')!.attachShadow({ mode: 'open' });
const lightHost = document.getElementById('lightHost')!;

// A chart that stays in the page, so it never depends on the scenario under test.
const options: AgCartesianChartOptions = {
    container: document.getElementById('reference'),
    title: { text: 'Reference' },
    data,
    series: [{ type: 'bar', xKey: 'month', yKey: 'revenue' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};

AgCharts.create(options);

let detached: HTMLElement | undefined;
let theme: AgCartesianChartOptions['theme'];

// The chart is created on a container that is not yet in the document, as a framework wrapper does while it mounts.
function createDetached(scenario: Scenario) {
    const container = document.createElement('div');
    container.style.cssText = 'width: 100%; height: 300px;';
    detached = container;

    const fills: Record<Scenario, string | undefined> = {
        'series-fallback': 'var(--attach-color, green)',
        'series-no-fallback': 'var(--attach-color)',
        'theme-no-fallback': undefined,
        'series-unresolvable': 'var(--attach-undefined)',
    };
    theme = scenario === 'theme-no-fallback' ? { params: { backgroundColor: 'var(--attach-background)' } } : undefined;

    AgCharts.create({
        ...options,
        container,
        theme,
        title: { text: scenario },
        series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', fill: fills[scenario] }],
    });
}

function attachTo(target: 'shadow' | 'light') {
    (target === 'shadow' ? shadowRoot : lightHost).append(detached!);
}

function changeCSSVariable() {
    document.body.style.setProperty('--attach-color', '#ff0000');
    document.body.style.setProperty('--attach-background', '#ffff00');
}

// What the caller still holds after the chart has been created and attached.
function themeParams() {
    return JSON.stringify(theme?.params ?? null);
}

(window as any).createDetached = createDetached;
(window as any).attachTo = attachTo;
(window as any).changeCSSVariable = changeCSSVariable;
(window as any).themeParams = themeParams;
