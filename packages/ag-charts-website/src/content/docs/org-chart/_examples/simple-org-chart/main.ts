import {
    AgChartOptions,
    AgCharts,
    ContextMenuModule,
    ModuleRegistry,
    OrganizationSeriesModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([OrganizationSeriesModule, ContextMenuModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', location: 'London', parentId: null },
        { id: 'cto', name: 'Bob Smith', job: 'Chief Technology Officer', location: 'London', parentId: 'ceo' },
        { id: 'cfo', name: 'Carol Wu', job: 'Chief Financial Officer', location: 'London', parentId: 'ceo' },
        { id: 'dev', name: 'Dave Jones', job: 'Developer', location: 'New York', parentId: 'cto' },
        { id: 'qa', name: 'Eve Park', job: 'Quality Assurance', location: 'London', parentId: 'cto' },
        { id: 'acc', name: 'Frank Cash', job: 'Accountant', location: 'London', parentId: 'cfo' },
    ],
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            node: {
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'job',
                },
                labels: [
                    {
                        key: 'location',
                    },
                ],
            },
        },
    ],
};

AgCharts.create(options);
