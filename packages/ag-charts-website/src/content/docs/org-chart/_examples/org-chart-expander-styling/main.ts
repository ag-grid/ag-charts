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
        collapsed: ['Mr. Jeffrey Brown', 'Nicole Jones', 'Justin Contreras', 'Lawrence Martinez', 'Eric Jensen'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            expander: {
                cornerRadius: 25,
                strokeWidth: 2,
                padding: 15,
                itemStyler: ({ datum }) => {
                    if (datum.department === 'Technology') return { fill: '#e8f5e9', stroke: '#2e7d32' };
                    if (datum.department === 'Operations') return { fill: '#fff3e0', stroke: '#e65100' };
                },
            },
            node: {
                image: { key: 'avatar', position: 'left', height: 50, width: 50, cornerRadius: 25 },
                itemStyler: ({ datum }) => {
                    if (datum.department === 'Executive')
                        return { fill: '#76B2DC', fillOpacity: 0.2, stroke: '#1B65BF', strokeWidth: 2 };
                    if (datum.department === 'Technology')
                        return { fill: '#7AE281', fillOpacity: 0.2, stroke: '#327C35', strokeWidth: 2 };
                    if (datum.department === 'Operations')
                        return { fill: '#EBB967', fillOpacity: 0.2, stroke: '#A94F1D', strokeWidth: 2 };
                },
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
            },
        },
    ],
};

AgCharts.create(options);
