import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    NumberAxisModule,
]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    enableRtl: true,
    title: {
        text: 'תרשים עמודות',
    },
    contextMenu: {
        items: [
            'download',
            'separator',
            {
                showOn: 'always',
                type: 'action',
                label: 'Sales in שקלים for 2024',
                action: () => {
                    console.log('Action: Sales in שקלים for 2024');
                },
            },
            {
                showOn: 'always',
                label: 'מכירות Sales מוצרים',
                items: [
                    {
                        type: 'action',
                        label: 'תרשים עמודות',
                        action: () => {
                            console.log('Action: תרשים עמודות');
                        },
                    },
                    {
                        label: 'מכירות Q1 2024',
                        items: [
                            {
                                type: 'action',
                                label: 'Revenue מכירות',
                                action: () => {
                                    console.log('Action: Revenue מכירות');
                                },
                            },
                            {
                                type: 'action',
                                label: 'מכירות Sales מוצרים',
                                action: () => {
                                    console.log('Action: מכירות Sales מוצרים');
                                },
                            },
                        ],
                    },
                ],
            },
            'separator',
            {
                showOn: 'legend-item',
                type: 'action',
                label: 'מכירות Q1 2024',
                action: ({ itemId }) => {
                    console.log(`Legend action: ${itemId}`);
                },
            },
        ],
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Revenue מכירות',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'revenue',
            yName: 'מכירות Q1 2024',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'right',
        },
    },
};

AgCharts.create(options);
