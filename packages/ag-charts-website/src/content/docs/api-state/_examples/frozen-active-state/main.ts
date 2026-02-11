import {
    AgCandlestickSeriesTooltipRendererParams,
    AgCartesianChartOptions,
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

let isFrozen = false;

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
          <div ${isFrozen ? '' : 'style="display: none"'}>
            <button type="button" onclick="unfreeze()">Unfreeze</button>
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
                    isFrozen = true;
                    chart.setState({
                        version,
                        active: {
                            frozen: true,
                            activeItem: {
                                type: 'series-node',
                                // TODO: should event include `itemId`?
                                itemId: chart.getState().active.activeItem.itemId,
                                seriesId: event.seriesId,
                            },
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
};

const chart = AgCharts.create(options);
const version = chart.getState().version;

function unfreeze() {
    isFrozen = false;
    chart.setState({ version, active: { activeItem: chart.getState().active.activeItem, frozen: false } });
}
