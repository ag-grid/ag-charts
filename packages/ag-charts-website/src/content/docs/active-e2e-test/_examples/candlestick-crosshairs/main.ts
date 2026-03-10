import {
    AgActiveChangeEvent,
    AgActiveItemState,
    AgCandlestickSeriesTooltipRendererParams,
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartState,
    AgCharts,
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-enterprise';

import { TradeDatum, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    TimeAxisModule,
]);

let frozenChart: AgChartInstance | undefined;

function unfreeze() {
    if (frozenChart) {
        const currentState: AgChartState = frozenChart.getState();
        frozenChart.setState({
            version: currentState.version,
            active: { activeItem: currentState.active?.activeItem, frozen: false },
        });
    }
    frozenChart = undefined;
}

function tooltipRenderer({ datum }: AgCandlestickSeriesTooltipRendererParams<TradeDatum>): string {
    const date = new Date(datum.date);
    const heading = date.toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const format = (v: number) => `$${v.toFixed(2)}`;

    (window as any).unfreeze = unfreeze;
    return `
        <div class="custom-tooltip">
          <span>${heading}</span>
          <div>
            <span>open</span>
            <span>${format(datum.open)}</span>
          </div>
          <div>
            <span>high</span>
            <span>${format(datum.high)}</span>
          </div>
          <div>
            <span>low</span>
            <span>${format(datum.low)}</span>
          </div>
          <div>
            <span>close</span>
            <span>${format(datum.close)}</span>
          </div>
          <div ${frozenChart ? '' : 'style="display: none"'}>
            <button type="button" onclick="window.unfreeze()">Unfreeze</button>
          </div>
        </div>`;
}

const options: AgCartesianChartOptions<TradeDatum> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Ethereum Prices',
    },
    data: getData(),
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            listeners: {
                seriesNodeClick: (event) => {
                    frozenChart = chart;
                    const currentState: AgChartState = chart.getState();
                    const activeItem: AgActiveItemState | undefined =
                        currentState.active?.activeItem?.type === 'series-node'
                            ? {
                                  type: 'series-node',
                                  // TODO: should event include `itemId`?
                                  itemId: currentState.active.activeItem.itemId,
                                  seriesId: event.seriesId,
                              }
                            : undefined;

                    chart.setState({
                        version: currentState.version,
                        active: {
                            frozen: true,
                            activeItem,
                        },
                    });
                },
            },
            tooltip: {
                interaction: { enabled: true },
                position: {
                    anchorTo: 'chart',
                    placement: 'top-right',
                },
                renderer: tooltipRenderer,
            },
        },
    ],
    axes: {
        x: {
            type: 'time',
        },
        y: {
            type: 'number',
            label: {
                format: '$#{.2f}',
            },
        },
    },
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<unknown, unknown>) => {
            events.push(ev);
        },
    },
};

const chart = AgCharts.create(options);
let events: unknown[] = [];

function popEvents(): unknown[] {
    const result = events;
    events = [];
    return result;
}

export function onPopEvents() {
    const events = popEvents();
    console.log(events);
}

window.addEventListener('mousemove', (ev: MouseEvent) => {
    document.getElementById('myPointerPos')!.textContent = `clientX: ${ev.clientX}; clientY: ${ev.clientY}`;
});

// For e2e testing:
(window as any).agE2E = { chart, popEvents };
