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
                title: {
                    key: 'name',
                    itemStyler: (params: any) => {
                        if (params.datum.job === 'Chief Financial Officer') {
                            return {
                                color: '#ff7faa',
                                fontSize: 18,
                            };
                        }
                    },
                },
                subtitle: {
                    key: 'job',
                    formatter: (params: any) => {
                        if (params.value === 'Quality Assurance') {
                            return [
                                { text: 'QUALITY', fontSize: 14, fontWeight: 'bold', color: 'purple' },
                                { text: ' Assurance' },
                            ];
                        }
                        return params.value;
                    },
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
