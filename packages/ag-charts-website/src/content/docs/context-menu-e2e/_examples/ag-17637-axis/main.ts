import type {
    AgAxisContextMenuActionEvent,
    AgCartesianChartOptions,
    AgContextMenuGetItemsParams,
    AgContextMenuItem,
} from 'ag-charts-enterprise';
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { x: 'Jun', y1: 50, y2: 40_000_000 },
        { x: 'Jul', y1: 70, y2: 50_000_000 },
        { x: 'Aug', y1: 60, y2: 30_000_000 },
    ],
    series: [
        { type: 'bar', xKey: 'x', yKey: 'y1', yName: 'Series 1', yKeyAxis: 'yPrimary' },
        { type: 'bar', xKey: 'x', yKey: 'y2', yName: 'Series 2', yKeyAxis: 'ySecondary' },
    ],
    axes: {
        x: {
            title: { text: 'X Axis Label' },
            type: 'category',
        },
        yPrimary: {
            title: { text: 'Primary Y Axis Label' },
            type: 'number',
            position: 'left',
        },
        ySecondary: {
            title: { text: 'Secondary Y Axis Label' },
            type: 'number',
            position: 'right',
        },
    },
    contextMenu: {
        getItems: (params: AgContextMenuGetItemsParams): AgContextMenuItem[] => {
            getItemsCalls.push(params);
            console.log(`getItems()`, params);
            if (params.showOn !== 'axis') {
                return [
                    {
                        showOn: 'always',
                        label: 'No axis was right-click',
                        action: () => {},
                    },
                ];
            } else {
                return [
                    {
                        showOn: 'axis',
                        label: 'Run axis action',
                        action: (ev: AgAxisContextMenuActionEvent) => {
                            console.log(`action()`, params);
                            actions.push(ev);
                        },
                    },
                ];
            }
        },
    },
};

AgCharts.create(options);

// For e2e testing: expose drain-and-reset accessors for the recorded caption actions and `getItems()` calls.
const actions: AgAxisContextMenuActionEvent[] = [];
const getItemsCalls: AgContextMenuGetItemsParams[] = [];
(window as any).agE2E = {
    popActions: () => actions.splice(0),
    popGetItems: () => getItemsCalls.splice(0),
};
