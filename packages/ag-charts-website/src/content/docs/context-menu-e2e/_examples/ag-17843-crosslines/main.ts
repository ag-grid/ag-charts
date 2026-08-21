import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type {
    AgCartesianChartOptions,
    AgContextMenuGetItemsParams,
    AgContextMenuItem,
    AgCrossLineContextMenuActionEvent,
} from 'ag-charts-types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

// The axes are arranged so their cross lines overlap the series area at the 'Feb' node, where a
// right-click must offer every region it intersects.
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { category: 'Jan', value: 8 },
        { category: 'Feb', value: 12 },
        { category: 'Mar', value: 6 },
        { category: 'Apr', value: 15 },
        { category: 'May', value: 3 },
        { category: 'Jun', value: 18 },
        { category: 'Jul', value: 11 },
        { category: 'Aug', value: 14 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'category',
            crossAt: { value: 0 },
            crossLines: [
                { id: 'blue-line', type: 'line', value: 'May', stroke: 'blue', strokeWidth: 2 },
                { id: 'grey-range', type: 'range', range: ['Mar', 'Jun'], strokeWidth: 2 },
            ],
        },
        y: {
            type: 'number',
            // No `id`, so `crossLineId` falls back to an internally generated identifier.
            crossLines: [{ type: 'line', value: 8, stroke: 'lime', strokeWidth: 2 }],
        },
    },
    contextMenu: {
        getItems: (params: AgContextMenuGetItemsParams): AgContextMenuItem[] => {
            getItemsCalls.push(params);
            console.log(`getItems()`, params);
            if (params.showOn !== 'cross-line') {
                return [
                    {
                        showOn: 'always',
                        label: 'No crossline was right-click',
                        action: () => {},
                    },
                ];
            } else {
                return [
                    {
                        showOn: 'cross-line',
                        label: 'Run crossline action',
                        action: (ev: AgCrossLineContextMenuActionEvent) => {
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

const actions: AgCrossLineContextMenuActionEvent[] = [];
const getItemsCalls: AgContextMenuGetItemsParams[] = [];
(window as any).agE2E = {
    popActions: () => actions.splice(0),
    popGetItems: () => getItemsCalls.splice(0),
};
