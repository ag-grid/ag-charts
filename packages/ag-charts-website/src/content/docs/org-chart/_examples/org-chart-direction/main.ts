import {
    AgChartOptions,
    AgCharts,
    AgOrganizationSeriesOptions,
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
    initialState: {
        collapsed: ['Mr. Jeffrey Brown', 'Nicole Jones', 'Justin Contreras', 'Lawrence Martinez', 'Eric Jensen'],
    },
    series: [
        {
            type: 'organization',
            idKey: 'id',
            parentIdKey: 'parentId',
            direction: 'up',
            node: {
                clickToExpand: false,
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

function changeDirection(direction: 'up' | 'down' | 'left' | 'right') {
    (options.series![0] as AgOrganizationSeriesOptions).direction = direction;
    chart.update(options);
}
