import { AgChartOptions, AgCharts, ContextMenuModule, ModuleRegistry, SankeySeriesModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([SankeySeriesModule, ContextMenuModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { id: 'ceo', title: 'Alice Chen', parentId: null },
        { id: 'cto', title: 'Bob Smith', parentId: 'ceo' },
        { id: 'cfo', title: 'Carol Wu', parentId: 'ceo' },
        { id: 'dev', title: 'Dave Jones', parentId: 'cto' },
        { id: 'qa', title: 'Eve Park', parentId: 'cto' },
        { id: 'acc', title: 'Mr Moneybags', parentId: 'cfo' },
    ],
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
        },
    ],
};

AgCharts.create(options);
