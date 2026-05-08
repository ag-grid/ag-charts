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
    title: {
        text: 'The Royal House of Tudor',
    },
    subtitle: {
        text: 'England, 1485 - 1603',
    },
    data: getData(),
    series: [
        {
            type: 'organization',
            idKey: 'name',
            parentIdKey: 'parent',
            expander: { enabled: true },
            node: {
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
