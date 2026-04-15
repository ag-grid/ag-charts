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

const chart = AgCharts.create(options);

function changePosition(position: string) {
    options.series[0].node.image.position = position;
    chart.update(options);
}
