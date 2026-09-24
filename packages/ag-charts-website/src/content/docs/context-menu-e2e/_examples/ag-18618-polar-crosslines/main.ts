import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type {
    AgContextMenuGetItemsParams,
    AgContextMenuItem,
    AgCrossLineContextMenuActionEvent,
    AgPolarChartOptions,
} from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

// Same geometry as the events-e2e polar cross-line example, so the two suites share their click points.
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: 'Q1', value: 2 },
        { quarter: 'Q2', value: 4 },
        { quarter: 'Q3', value: 6 },
        { quarter: 'Q4', value: 8 },
    ],
    series: [{ type: 'radar-line', angleKey: 'quarter', radiusKey: 'value' }],
    legend: { enabled: false },
    axes: {
        angle: {
            type: 'angle-category',
            shape: 'circle',
            label: { enabled: false },
            crossLines: [{ id: 'band', type: 'range', range: ['Q2', 'Q3'] }],
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            label: { enabled: false },
            min: 0,
            max: 10,
            crossLines: [{ id: 'threshold', type: 'line', value: 5, strokeWidth: 12 }],
        },
    },
    contextMenu: {
        getItems: (params: AgContextMenuGetItemsParams): AgContextMenuItem[] => {
            getItemsCalls.push(params);
            if (params.showOn !== 'cross-line') {
                return [{ showOn: 'always', label: 'No cross line was right-clicked', action: () => {} }];
            }
            return [
                {
                    showOn: 'cross-line',
                    label: 'Run cross-line action',
                    action: (event: AgCrossLineContextMenuActionEvent) => {
                        actions.push(event);
                    },
                },
            ];
        },
    },
};

AgCharts.create(options);

const actions: AgCrossLineContextMenuActionEvent[] = [];
const getItemsCalls: AgContextMenuGetItemsParams[] = [];
(window as any).agE2E = {
    popActions: () => actions.splice(0),
    popGetItems: () => getItemsCalls.splice(0),
};
