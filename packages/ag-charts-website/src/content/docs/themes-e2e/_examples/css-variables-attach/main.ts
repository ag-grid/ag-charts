// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgChartInstance,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

type Scenario =
    'series-fallback' | 'series-no-fallback' | 'theme-fallback' | 'theme-no-fallback' | 'series-unresolvable';

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
let detachedChart: AgChartInstance | undefined;
let theme: { params: Record<string, string> } | undefined;

// The chart is created on a container that is not yet in the document, as a framework wrapper does while it mounts.
function createDetached(scenario: Scenario) {
    const container = document.createElement('div');
    container.style.cssText = 'width: 100%; height: 300px;';
    detached = container;

    const fills: Record<Scenario, string | undefined> = {
        'series-fallback': 'var(--attach-color, green)',
        'series-no-fallback': 'var(--attach-color)',
        'theme-fallback': undefined,
        'theme-no-fallback': undefined,
        'series-unresolvable': 'var(--attach-undefined)',
    };
    const backgrounds: Partial<Record<Scenario, string>> = {
        'theme-fallback': 'var(--attach-background, purple)',
        'theme-no-fallback': 'var(--attach-background)',
    };
    const backgroundColor = backgrounds[scenario];
    theme = backgroundColor ? { params: { backgroundColor } } : undefined;

    detachedChart = AgCharts.create({
        ...options,
        container,
        theme,
        title: { text: scenario },
        series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', fill: fills[scenario] }],
    });
}

// A data-only update takes the fast path, which does not process the options' CSS variables again.
function updateDetached() {
    detachedChart!.updateDelta({ data: data.map((datum) => ({ ...datum, revenue: datum.revenue + 10 })) });
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
(window as any).updateDetached = updateDetached;
(window as any).attachTo = attachTo;
(window as any).changeCSSVariable = changeCSSVariable;
(window as any).themeParams = themeParams;
