import {
    AgChartOptions,
    AgCharts,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule, ZoomModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Reporting Hierarchy',
    },
    data: getData(),
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            layout: { type: 'stacked', stackAtDepth: 5 },
            node: {
                maxWidth: 180,
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'title',
                },
            },
            expander: {
                text: {
                    showAllChildren: true,
                    showDirectChildren: true,
                },
            },
        },
    ],
    zoom: {
        buttons: {
            visible: 'zoomed',
        },
    },
};

AgCharts.create(options);
