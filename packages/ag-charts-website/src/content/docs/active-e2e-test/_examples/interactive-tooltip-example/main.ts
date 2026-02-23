import type {
    AgActiveChangeEvent,
    AgBarSeriesTooltipRendererParams,
    AgCartesianChartOptions,
} from 'ag-charts-community';
import { AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
            tooltip: {
                renderer: (params: AgBarSeriesTooltipRendererParams<DataType>) => {
                    return `<div class="tooltip">
                        <div class="tooltip-title">
                            ${params.datum[params.xKey]}: ${params.datum[params.yKey]}
                        </div>
                        <div class="tooltip-body">
                            <button tabindex="0" onclick="onClear()">Clear</button>
                        </div>
                    </div>`;
                },
                interaction: {
                    enabled: true,
                },
            },
        },
    ],
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<DataType, unknown>) => {
            if (ev.source === 'user-interaction' && ev.activeItem === undefined) {
                ev.preventDefault();
            }
        },
    },
};

const chart = AgCharts.create(options);
const version = chart.getState().version;

function onClear() {
    chart.setState({ version, active: { activeItem: undefined } });
}

// For e2e testing:
(window as any).agE2E = { chart };
