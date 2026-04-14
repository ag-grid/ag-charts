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
            link: {},
            node: {
                itemStyler: (params: any) => {
                    if (params.datum.job === 'Chief Financial Officer') {
                        return {
                            fill: '#fff1e5',
                            stroke: '#006f9b',
                            lineDash: [8, 2],
                            cornerRadius: 30,
                        };
                    }
                },
                title: {
                    key: 'name',
                },
                subtitle: {
                    key: 'job',
                    itemStyler: (params: any) => {
                        if (params.datum.job === 'Developer') {
                            return {
                                color: '#006f9b',
                                fontStyle: 'italic',
                            };
                        }
                    },
                },
                labels: [
                    {
                        key: 'location',
                    },
                    {
                        key: 'tenure',
                        itemStyler: (params: any) => {
                            if (params.datum.tenure > 2) {
                                return {
                                    color: '#ff7faa',
                                    fontWeight: 'bold',
                                };
                            }
                        },
                    },
                ],
            },
        },
    ],
};

AgCharts.create(options);
