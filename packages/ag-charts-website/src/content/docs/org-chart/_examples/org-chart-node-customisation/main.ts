import {
    AgChartOptions,
    AgCharts,
    AgOrganizationSeriesNodeItemStylerParams,
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
                itemStyler: (params: AgOrganizationSeriesNodeItemStylerParams) => {
                    if (params.datum.job === 'Chief Financial Officer') {
                        return {
                            fill: '#fff1e5',
                            stroke: '#ff7faa',
                            lineDash: [8, 2],
                            cornerRadius: 30,
                        };
                    }

                    if (params.highlightState === 'highlighted-item') {
                        return { strokeWidth: 4 };
                    }
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

AgCharts.create(options);
