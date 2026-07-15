import {
    AgCharts,
    AgStandaloneChartOptions,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    listeners: {
        collapsedChange: (event) => {
            if (event.collapsed.find((item) => item.itemId === 'Henry VIII')) {
                event.preventDefault();
            }
            console.log(JSON.stringify(event.collapsed));
        },
    },
    data: getData(),
    series: [
        {
            type: 'organization',
            idKey: 'name',
            parentIdKey: 'parent',
            node: {
                clickToExpand: false,
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'years',
                },
                labels: [{ key: 'reign' }],
            },
        },
    ],
};

AgCharts.create(options);
