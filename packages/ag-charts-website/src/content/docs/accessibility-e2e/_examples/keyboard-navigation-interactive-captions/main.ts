// @ag-skip-fws
import {
    AgCaptionClickEvent,
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    NumberAxisModule,
]);

type DataType = { quarter: string; fiction: number; nonFiction: number };
type CaptionEvent = Pick<AgCaptionClickEvent<string>, 'type' | 'captionType' | 'text'>;

let events: CaptionEvent[] = [];

// The DOM `event` field is not serialisable across the Playwright boundary, so only record the API fields.
function recordEvent({ type, captionType, text }: AgCaptionClickEvent<string>) {
    events.push({ type, captionType, text });
}

function popEvents(): CaptionEvent[] {
    const result = events;
    events = [];
    return result;
}

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Book Sales' },
    subtitle: { text: '(prices in USD)' },
    footnote: { text: 'Disclaimer: This is a test' },
    data: [
        { quarter: 'Q1', fiction: 140, nonFiction: 95 },
        { quarter: 'Q2', fiction: 124, nonFiction: 110 },
        { quarter: 'Q3', fiction: 168, nonFiction: 102 },
        { quarter: 'Q4', fiction: 210, nonFiction: 131 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'fiction', yName: 'Fiction' },
        { type: 'bar', xKey: 'quarter', yKey: 'nonFiction', yName: 'Non-Fiction' },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    // The context menu is enabled by default once its module is registered, so always set it explicitly.
    contextMenu: { enabled: false },
};

const chart = AgCharts.create(options);

export function onUpdate() {
    const mode = (document.getElementById('myTestMode') as HTMLSelectElement).value;
    const titleClick = mode === 'local-click-title' || mode === 'local-click-title-context-menu';
    const contextMenu = mode === 'local-click-title-context-menu' || mode === 'context-menus';
    chart.update({
        ...options,
        title: { ...options.title, listeners: titleClick ? { click: recordEvent } : undefined },
        contextMenu: { enabled: contextMenu },
        listeners: mode === 'global-caption-click' ? { captionClick: recordEvent } : {},
    });
}

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
