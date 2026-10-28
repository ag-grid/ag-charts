import { AgChartOptions, AgCharts, ModuleRegistry, OrganizationSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([OrganizationSeriesModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Organisation',
    },
    data: getData(),
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            layout: {
                type: 'stacked',
                stackFromDepth: 4,
            },
            node: {
                clickToExpand: true,
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'job',
                },
            },
        },
    ],
};

AgCharts.create(options);
