import {
    AgChartOptions,
    AgCharts,
    AgOrganizationSeriesExpanderItemStylerParams,
    AgOrganizationSeriesNodeItemStylerParams,
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
                text: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: 'red',
                },
                itemStyler: (params: AgOrganizationSeriesExpanderItemStylerParams) => {
                    if (params.datum.department === 'Technology') {
                        return { fill: '#e8f5e9', stroke: '#2e7d32' };
                    }
                    if (params.datum.department === 'Operations') {
                        return { fill: '#fff3e0', stroke: '#e65100' };
                    }
                },
            },
            node: {
                image: { key: 'avatar', position: 'left', height: 50, width: 50, cornerRadius: 25 },
                itemStyler: (params: AgOrganizationSeriesNodeItemStylerParams) => {
                    if (params.datum.department === 'Executive') {
                        return { fill: '#e3f2fd', stroke: '#1565C0', strokeWidth: 2 };
                    }
                    if (params.datum.department === 'Technology') {
                        return { fill: '#e8f5e9', stroke: '#2e7d32', strokeWidth: 2 };
                    }
                    if (params.datum.department === 'Operations') {
                        return { fill: '#fff3e0', stroke: '#e65100', strokeWidth: 2 };
                    }
                },
                title: { key: 'name' },
                subtitle: { key: 'job' },
                labels: [{ key: 'location' }],
            },
        },
    ],
};

AgCharts.create(options);
