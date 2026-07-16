import {
    AgChartOptions,
    AgCharts,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Organisation',
    },
    data: getData(),
    listeners: {
        collapsedChange: (event) => {
            console.log(
                `source: ${event.source},`,
                'collapsed itemIds:',
                event.collapsed.map(({ itemId }) => itemId)
            );
        },
    },
    initialState: {
        collapsed: ['Mr. Jeffrey Brown', 'Nicole Jones', 'Justin Contreras', 'Lawrence Martinez', 'Eric Jensen'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                image: {
                    key: 'avatar',
                    height: 50,
                    width: 50,
                    position: 'left',
                },
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
            },
        },
    ],
};

AgCharts.create(options);
