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
    title: { text: 'Company Organisation' },
    data: getData(),
    initialState: {
        collapsed: ['Mr. Jeffrey Brown', 'Nathan Jones', 'Justin Contreras', 'Lawrence Martinez', 'Eric Jensen'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                image: { key: 'avatar', position: 'left', height: 50, width: 50 },
                title: { key: 'name', textAlign: 'left', fontSize: 16 },
                subtitle: { key: 'job', textAlign: 'left', fontStyle: 'italic' },
                labels: [
                    { key: 'location', textAlign: 'left' },
                    {
                        key: 'status',
                        textAlign: 'right',
                        itemStyler: ({ datum }) => {
                            const isRemote = datum.status === 'Remote';
                            return {
                                fill: isRemote ? '#fff3e0' : '#e8f5e9',
                                stroke: isRemote ? '#ff9800' : '#4caf50',
                                color: isRemote ? '#e65100' : '#2e7d32',
                                cornerRadius: 8,
                                padding: 4,
                                fontWeight: 'bold',
                            };
                        },
                    },
                ],
            },
        },
    ],
};

AgCharts.create(options);
